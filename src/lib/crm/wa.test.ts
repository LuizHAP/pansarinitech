import type { Lead } from '@/lib/admin/leads';
import type { WaChat, WaMessage, WaOutboxItem } from '@/lib/crm/contract';
import { describe, expect, it } from 'vitest';
import {
  applyStageAutomation,
  chatTitle,
  extractMessage,
  findLeadByPhone,
  formatPhone,
  isIgnoredJid,
  isWorkerOnline,
  leadPhone,
  mergeChat,
  phoneFromJid,
  phoneKey,
  phonesMatch,
  pickKnownJid,
  sortMessages,
  splitOutbox,
} from './wa';

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l1',
    name: 'Padaria',
    website: null,
    source: 'google-maps',
    sourceUrl: null,
    whatsapp: null,
    email: null,
    phone: null,
    instagram: null,
    previewSlug: null,
    nextStep: null,
    dueDate: null,
    notes: null,
    stage: 'prospectado',
    history: [{ stage: 'prospectado', at: '2026-01-01T00:00:00.000Z' }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('phone matching', () => {
  it('matches with and without the Brazilian 9th digit and country code', () => {
    expect(phonesMatch('5511987654321', '1187654321')).toBe(true);
    expect(phonesMatch('+55 (11) 98765-4321', '11 8765-4321')).toBe(true);
    expect(phonesMatch('5511987654321', '5511987654322')).toBe(false);
  });

  it('rejects numbers that are too short', () => {
    expect(phoneKey('1234567')).toBeNull();
    expect(phonesMatch(null, '5511987654321')).toBe(false);
  });

  it('finds a lead by whatsapp first, then phone', () => {
    const byPhone = lead({ id: 'a', phone: '(11) 8765-4321' });
    const byWhats = lead({ id: 'b', whatsapp: '5511987654321' });
    expect(findLeadByPhone([byPhone, byWhats], '5511987654321')?.id).toBe('b');
    expect(findLeadByPhone([byPhone], '551187654321')?.id).toBe('a');
    expect(findLeadByPhone([byPhone], null)).toBeNull();
  });

  it('ignores a lead phone when it has a different whatsapp', () => {
    const other = lead({ whatsapp: '5511900000000', phone: '1187654321' });
    expect(findLeadByPhone([other], '5511987654321')).toBeNull();
  });

  it('prefers whatsapp over phone for the lead number', () => {
    expect(leadPhone(lead({ whatsapp: '5511987654321', phone: '1100000000' }))).toBe(
      '5511987654321',
    );
    expect(leadPhone(lead({ phone: '(11) 3000-0000' }))).toBe('1130000000');
    expect(leadPhone(lead())).toBeNull();
  });
});

describe('jid and phone parsing', () => {
  it('reads the phone from a user jid, dropping the device suffix', () => {
    expect(phoneFromJid('5511987654321@s.whatsapp.net')).toBe('5511987654321');
    expect(phoneFromJid('5511987654321:12@s.whatsapp.net')).toBe('5511987654321');
  });

  it('returns null for lid, group and empty jids', () => {
    expect(phoneFromJid('123456@lid')).toBeNull();
    expect(phoneFromJid('123@g.us')).toBeNull();
    expect(phoneFromJid(undefined)).toBeNull();
  });

  it('ignores groups, status and newsletters', () => {
    expect(isIgnoredJid('1@g.us')).toBe(true);
    expect(isIgnoredJid('status@broadcast')).toBe(true);
    expect(isIgnoredJid('1@newsletter')).toBe(true);
    expect(isIgnoredJid('5511987654321@s.whatsapp.net')).toBe(false);
  });

  it('formats Brazilian and foreign numbers', () => {
    expect(formatPhone('5511987654321')).toBe('+55 (11) 98765-4321');
    expect(formatPhone('551187654321')).toBe('+55 (11) 8765-4321');
    expect(formatPhone('14155550123')).toBe('+14155550123');
    expect(formatPhone(null)).toBe('');
  });

  it('titles a chat by name, phone or jid', () => {
    const base = { jid: '5511987654321@s.whatsapp.net', phone: '5511987654321', name: null };
    expect(chatTitle({ ...base, name: 'Ana' })).toBe('Ana');
    expect(chatTitle(base)).toBe('+55 (11) 98765-4321');
    expect(chatTitle({ jid: '99@lid', phone: null, name: null })).toBe('99');
  });
});

describe('message extraction', () => {
  it('extracts text and captions', () => {
    expect(extractMessage({ conversation: 'oi' })).toEqual({ body: 'oi', type: 'text' });
    expect(extractMessage({ extendedTextMessage: { text: 'link' } })).toEqual({
      body: 'link',
      type: 'text',
    });
    expect(extractMessage({ imageMessage: { caption: 'foto' } })).toEqual({
      body: 'foto',
      type: 'image',
    });
  });

  it('labels media without text', () => {
    expect(extractMessage({ imageMessage: {} })?.body).toBe('[imagem]');
    expect(extractMessage({ videoMessage: {} })?.body).toBe('[vídeo]');
    expect(extractMessage({ audioMessage: {} })).toEqual({ body: '[áudio]', type: 'audio' });
    expect(extractMessage({ stickerMessage: {} })).toEqual({
      body: '[figurinha]',
      type: 'sticker',
    });
    expect(extractMessage({ documentMessage: { fileName: 'a.pdf' } })).toEqual({
      body: '[documento] a.pdf',
      type: 'document',
    });
    expect(extractMessage({ documentMessage: {} })?.body).toBe('[documento]');
  });

  it('skips unsupported content', () => {
    expect(extractMessage(null)).toBeNull();
    expect(extractMessage({})).toBeNull();
  });
});

describe('stage automation', () => {
  const ts = Date.parse('2026-02-01T12:00:00.000Z');

  it.each(['prospectado', 'previa-pronta', 'previa-enviada'] as const)(
    'moves %s to contatado on outbound',
    (stage) => {
      const next = applyStageAutomation(lead({ stage }), 'out', ts);
      expect(next.stage).toBe('contatado');
      expect(next.history.at(-1)).toEqual({ stage: 'contatado', at: '2026-02-01T12:00:00.000Z' });
      expect(next.extras?.lastContactAt).toBe('2026-02-01T12:00:00.000Z');
    },
  );

  it.each(['prospectado', 'previa-pronta', 'previa-enviada', 'contatado'] as const)(
    'moves %s to em-conversa on inbound',
    (stage) => {
      const next = applyStageAutomation(lead({ stage }), 'in', ts);
      expect(next.stage).toBe('em-conversa');
      expect(next.extras?.lastReplyAt).toBe('2026-02-01T12:00:00.000Z');
    },
  );

  it('keeps later stages but still records the timestamps', () => {
    const base = lead({ stage: 'proposta', extras: { city: 'SP' } });
    const out = applyStageAutomation(base, 'out', ts);
    expect(out.stage).toBe('proposta');
    expect(out.history).toBe(base.history);
    expect(out.extras).toEqual({ city: 'SP', lastContactAt: '2026-02-01T12:00:00.000Z' });
    expect(applyStageAutomation(lead({ stage: 'contatado' }), 'out', ts).stage).toBe('contatado');
    expect(applyStageAutomation(lead({ stage: 'em-conversa' }), 'in', ts).history).toHaveLength(1);
  });
});

describe('outbox ordering', () => {
  const item = (id: string, notBefore: number, createdAt = 0): WaOutboxItem => ({
    id,
    phone: '5511987654321',
    text: id,
    leadId: null,
    campaignId: null,
    notBefore,
    createdAt,
  });

  it('only releases items whose notBefore has passed, oldest first', () => {
    const { due, later } = splitOutbox(
      [item('c', 300), item('a', 100), item('b', 100, 5), item('d', 900)],
      300,
    );
    expect(due.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(later.map((i) => i.id)).toEqual(['d']);
  });

  it('treats notBefore equal to now as due', () => {
    expect(splitOutbox([item('a', 50)], 50).due).toHaveLength(1);
  });
});

describe('chat helpers', () => {
  const chat = (jid: string, phone: string | null, lastTs: number): WaChat => ({
    jid,
    phone,
    name: null,
    lastTs,
    lastBody: null,
    unread: 0,
    leadId: null,
  });

  it('picks the most recent chat matching the last 8 digits', () => {
    const chats = [
      chat('a', '5511987654321', 1),
      chat('b', '1187654321', 9),
      chat('c', '5511900000000', 99),
    ];
    expect(pickKnownJid(chats, '5511987654321')).toBe('b');
    expect(pickKnownJid(chats, '5521911112222')).toBeNull();
    expect(pickKnownJid(chats, '123')).toBeNull();
  });

  it('creates and merges chats', () => {
    const input = {
      jid: 'j',
      phone: '551187654321',
      name: 'Ana',
      ts: 10,
      body: 'oi',
      unreadInc: 1,
      leadId: 'l1',
    };
    const created = mergeChat(null, input);
    expect(created).toMatchObject({ unread: 1, lastBody: 'oi', leadId: 'l1' });

    const older = mergeChat(created, {
      ...input,
      name: null,
      ts: 5,
      body: 'antiga',
      unreadInc: 0,
      leadId: null,
    });
    expect(older).toMatchObject({
      lastTs: 10,
      lastBody: 'oi',
      name: 'Ana',
      unread: 1,
      leadId: 'l1',
    });

    const newer = mergeChat(created, { ...input, ts: 20, body: 'nova', unreadInc: 1 });
    expect(newer).toMatchObject({ lastTs: 20, lastBody: 'nova', unread: 2 });
  });

  it('sorts messages by time and keeps the newest within the limit', () => {
    const m = (id: string, ts: number): WaMessage => ({
      id,
      jid: 'j',
      fromMe: false,
      body: id,
      type: 'text',
      ts,
    });
    expect(sortMessages([m('b', 2), m('c', 3), m('a', 1)], 2).map((x) => x.id)).toEqual(['b', 'c']);
  });

  it('flags a stale heartbeat as worker offline', () => {
    expect(isWorkerOnline({ heartbeatAt: 1000 }, 10_000, 15_000)).toBe(true);
    expect(isWorkerOnline({ heartbeatAt: 1000 }, 20_000, 15_000)).toBe(false);
    expect(isWorkerOnline(null, 1, 15_000)).toBe(false);
  });
});
