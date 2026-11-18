import fs from 'node:fs';
import path from 'node:path';
import { findLead, listLeads, saveLead } from '@/lib/admin/lead-store';
import type { Lead } from '@/lib/admin/leads';
import {
  WA_KEYS,
  WA_MAX_MESSAGES_PER_CHAT,
  type WaChat,
  type WaCommand,
  type WaMessage,
  type WaOutboxItem,
  type WaSendResult,
  type WaStatus,
  type WaStatusValue,
} from '@/lib/crm/contract';
import {
  applyStageAutomation,
  digits,
  extractMessage,
  findLeadByPhone,
  isIgnoredJid,
  mergeChat,
  phoneFromJid,
  pickKnownJid,
  splitOutbox,
} from '@/lib/crm/wa';
import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import type { WorkerContext } from './context';

const AUTH_DIR = path.join(process.cwd(), '.worker-data', 'wa-auth');
const SENT_TTL_SECONDS = 24 * 60 * 60;
const LEADS_CACHE_MS = 30_000;

export async function start(ctx: WorkerContext): Promise<void> {
  const { redis, log } = ctx;
  // Baileys is ESM-only; a static import is compiled to require() under tsx and fails to resolve.
  const baileys = await import('@whiskeysockets/baileys');
  const { Browsers, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } = baileys;
  const makeWASocket = baileys.default;
  const baileysLogger = pino({ level: 'silent' });

  let sock: WASocket | null = null;
  let status: WaStatusValue = 'offline';
  let qr: string | null = null;
  let me: string | null = null;
  let starting = false;
  let stopping = false;
  let leadsCache: { at: number; leads: Lead[] } = { at: 0, leads: [] };

  const writeStatus = async () => {
    const value: WaStatus = { status, qr, me, heartbeatAt: Date.now() };
    await redis.set(WA_KEYS.status, value);
  };
  const setStatus = (next: WaStatusValue) => {
    status = next;
    void writeStatus().catch((err) => log.warn({ err }, 'wa: falha ao gravar status'));
  };

  const getLeads = async (): Promise<Lead[]> => {
    if (Date.now() - leadsCache.at > LEADS_CACHE_MS) {
      const { available, leads } = await listLeads();
      if (available) leadsCache = { at: Date.now(), leads };
    }
    return leadsCache.leads;
  };

  const applyAutomation = async (leadId: string, direction: 'out' | 'in', ts: number) => {
    const { lead } = await findLead(leadId);
    if (!lead) return;
    const updated = applyStageAutomation(lead, direction, ts);
    await saveLead(updated);
    leadsCache = {
      ...leadsCache,
      leads: leadsCache.leads.map((item) => (item.id === updated.id ? updated : item)),
    };
  };

  const storeMessage = async (m: WAMessage, live: boolean) => {
    const jid = m.key.remoteJid;
    if (!jid || isIgnoredJid(jid) || !m.key.id) return;
    const parsed = extractMessage(m.message);
    if (!parsed) return;
    const fromMe = !!m.key.fromMe;
    const ts = (Number(m.messageTimestamp) || Math.floor(Date.now() / 1000)) * 1000;
    const phone =
      phoneFromJid(jid) ?? phoneFromJid((m.key as { remoteJidAlt?: string }).remoteJidAlt);

    const message: WaMessage = {
      id: m.key.id,
      jid,
      fromMe,
      body: parsed.body,
      type: parsed.type,
      ts,
      status: fromMe ? 'sent' : undefined,
    };
    const inserted = await redis.hsetnx(WA_KEYS.messages(jid), message.id, message);
    if (!inserted) return;
    await trimMessages(jid);

    const leads = await getLeads();
    const lead = findLeadByPhone(leads, phone);
    const existing = await redis.get<WaChat>(WA_KEYS.chat(jid));
    const chat = mergeChat(existing, {
      jid,
      phone,
      name: !fromMe && m.pushName ? m.pushName : null,
      ts,
      body: parsed.body,
      unreadInc: live && !fromMe ? 1 : 0,
      leadId: lead?.id ?? null,
    });
    await redis.set(WA_KEYS.chat(jid), chat);
    await redis.zadd(WA_KEYS.chatsIndex, { score: chat.lastTs, member: jid });

    if (live && chat.leadId) await applyAutomation(chat.leadId, fromMe ? 'out' : 'in', ts);
  };

  const trimMessages = async (jid: string) => {
    const key = WA_KEYS.messages(jid);
    if ((await redis.hlen(key)) <= WA_MAX_MESSAGES_PER_CHAT + 20) return;
    const all = await redis.hgetall<Record<string, WaMessage>>(key);
    const sorted = Object.values(all ?? {}).sort((a, b) => a.ts - b.ts);
    const stale = sorted.slice(0, sorted.length - WA_MAX_MESSAGES_PER_CHAT).map((m) => m.id);
    if (stale.length) await redis.hdel(key, ...stale);
  };

  const connect = async () => {
    if (starting || status === 'connected') return;
    starting = true;
    try {
      setStatus('connecting');
      qr = null;
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion();
      const s = makeWASocket({
        version,
        auth: state,
        logger: baileysLogger,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });
      sock = s;

      s.ev.on('creds.update', saveCreds);

      s.ev.on('connection.update', async (u) => {
        if (u.qr) {
          qr = await QRCode.toDataURL(u.qr, { margin: 1, width: 320 });
          setStatus('qr');
        }
        if (u.connection === 'open') {
          qr = null;
          me = phoneFromJid(s.user?.id) ?? null;
          setStatus('connected');
          log.info({ me }, 'wa: conectado');
        }
        if (u.connection === 'close') {
          const code = (u.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
            ?.output?.statusCode;
          sock = null;
          me = null;
          if (code === DisconnectReason.loggedOut) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            setStatus('offline');
          } else if (!stopping) {
            setStatus('connecting');
            setTimeout(() => void connect(), 2000);
          }
        }
      });

      s.ev.on('messages.upsert', ({ messages, type }) => {
        for (const m of messages) {
          storeMessage(m, type === 'notify').catch((err) =>
            log.warn({ err }, 'wa: falha ao gravar mensagem'),
          );
        }
      });

      s.ev.on('messaging-history.set', ({ messages }) => {
        for (const m of messages) {
          storeMessage(m, false).catch((err) => log.warn({ err }, 'wa: falha ao gravar histórico'));
        }
      });

      s.ev.on('contacts.upsert', (contacts) => {
        for (const c of contacts) {
          const name = c.name || c.notify;
          if (!name) continue;
          void (async () => {
            const chat = await redis.get<WaChat>(WA_KEYS.chat(c.id));
            if (chat && !chat.name) await redis.set(WA_KEYS.chat(c.id), { ...chat, name });
          })().catch(() => {});
        }
      });
    } catch (err) {
      log.error({ err }, 'wa: falha ao conectar');
      sock = null;
      setStatus('offline');
    } finally {
      starting = false;
    }
  };

  const logout = async () => {
    try {
      await sock?.logout();
    } catch {
      // socket already closed
    }
    sock = null;
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    qr = null;
    me = null;
    setStatus('offline');
  };

  const knownChats = async (): Promise<WaChat[]> => {
    const jids = await redis.zrange<string[]>(WA_KEYS.chatsIndex, 0, -1);
    if (jids.length === 0) return [];
    const chats = await redis.mget<(WaChat | null)[]>(...jids.map(WA_KEYS.chat));
    return chats.filter((chat): chat is WaChat => chat !== null);
  };

  const resolveJid = async (phone: string): Promise<string> => {
    const known = pickKnownJid(await knownChats(), phone);
    if (known) return known;
    const d = digits(phone);
    const result = await sock?.onWhatsApp(d);
    if (result?.[0]?.exists) return result[0].jid;
    throw new Error('Esse número não tem WhatsApp');
  };

  const pollCommands = async () => {
    for (;;) {
      const command = await redis.lpop<WaCommand>(WA_KEYS.commands);
      if (!command) return;
      log.info({ type: command.type }, 'wa: comando');
      if (command.type === 'connect') void connect();
      if (command.type === 'logout') await logout();
    }
  };

  const sendOne = async () => {
    if (status !== 'connected' || !sock) return;
    const items = await redis.lrange<WaOutboxItem>(WA_KEYS.outbox, 0, -1);
    const [item] = splitOutbox(items, Date.now()).due;
    if (!item) return;
    const removed = await redis.lrem(WA_KEYS.outbox, 1, item);
    if (!removed) return;

    let result: WaSendResult;
    try {
      const jid = await resolveJid(item.phone);
      const sent = await sock.sendMessage(jid, { text: item.text });
      if (sent) await storeMessage(sent, true);
      if (sent?.key.id && item.campaignId) {
        const stored = await redis.hget<WaMessage>(WA_KEYS.messages(jid), sent.key.id);
        if (stored) {
          await redis.hset(WA_KEYS.messages(jid), {
            [sent.key.id]: { ...stored, campaignId: item.campaignId },
          });
        }
      }
      result = { ok: true, ts: Date.now(), error: null };
    } catch (err) {
      log.warn({ err, id: item.id }, 'wa: falha ao enviar');
      result = {
        ok: false,
        ts: Date.now(),
        error: err instanceof Error ? err.message : 'Falha ao enviar',
      };
    }
    await redis.set(WA_KEYS.sent(item.id), result, { ex: SENT_TTL_SECONDS });
  };

  const guarded = (name: string, fn: () => Promise<void>) => async () => {
    try {
      await fn();
    } catch (err) {
      log.warn({ err }, `wa: ${name} falhou`);
    }
  };

  if (fs.existsSync(AUTH_DIR)) void connect();
  await writeStatus();

  const heartbeat = setInterval(guarded('heartbeat', writeStatus), 5000);
  const commands = setInterval(guarded('comandos', pollCommands), 2000);
  let sending = false;
  const outbox = setInterval(
    guarded('outbox', async () => {
      if (sending) return;
      sending = true;
      try {
        await sendOne();
      } finally {
        sending = false;
      }
    }),
    1000,
  );

  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    clearInterval(heartbeat);
    clearInterval(commands);
    clearInterval(outbox);
    sock?.end(undefined);
    status = 'offline';
    qr = null;
    me = null;
    await writeStatus().catch(() => {});
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());

  await new Promise<void>(() => {});
}
