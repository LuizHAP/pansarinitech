import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export type HostLookup = (hostname: string) => Promise<string[]>;

const ALLOWED_PORTS = new Set(['', '80', '443']);
const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home.arpa'];

export const resolveHost: HostLookup = async (hostname) => {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
};

function ipv4Octets(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : Number.NaN));
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null;
}

function isBlockedIpv4(octets: number[]): boolean {
  const [a, b, c] = octets as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0 && c === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

function ipv6Groups(ip: string): number[] | null {
  let text = ip.split('%')[0] ?? ip;
  const dotted = text.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const octets = ipv4Octets(dotted[2] as string);
    if (!octets) return null;
    const hi = ((octets[0] as number) << 8) | (octets[1] as number);
    const lo = ((octets[2] as number) << 8) | (octets[3] as number);
    text = `${dotted[1]}${hi.toString(16)}:${lo.toString(16)}`;
  }
  const halves = text.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const all = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  const groups = all.map((group) =>
    /^[0-9a-f]{1,4}$/i.test(group) ? Number.parseInt(group, 16) : Number.NaN,
  );
  return groups.length === 8 && groups.every((group) => !Number.isNaN(group)) ? groups : null;
}

function isBlockedIpv6(ip: string): boolean {
  const groups = ipv6Groups(ip);
  if (!groups) return true;
  const [g0, g1, g2, g3, g4, g5, g6, g7] = groups as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const embeddedV4 = [g6 >> 8, g6 & 255, g7 >> 8, g7 & 255];
  if (groups.every((group) => group === 0)) return true;
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0 && g6 === 0 && g7 === 1)
    return true;
  const mapped = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0xffff;
  const compat = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0;
  const nat64 = g0 === 0x64 && g1 === 0xff9b && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0;
  if (mapped || compat || nat64) return isBlockedIpv4(embeddedV4);
  if ((g0 & 0xfe00) === 0xfc00) return true;
  if ((g0 & 0xffc0) === 0xfe80) return true;
  if ((g0 & 0xff00) === 0xff00) return true;
  if (g0 === 0x2001 && g1 === 0x0db8) return true;
  if (g0 === 0x2002) return isBlockedIpv4([g1 >> 8, g1 & 255, g2 >> 8, g2 & 255]);
  return false;
}

export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isBlockedIpv4(ipv4Octets(ip) as number[]);
  if (version === 6) return isBlockedIpv6(ip);
  return true;
}

export class BlockedUrlError extends Error {}

export async function assertPublicUrl(
  raw: string | URL,
  resolver: HostLookup = resolveHost,
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BlockedUrlError('Endereço inválido.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new BlockedUrlError('Só http e https são aceitos.');
  }
  if (url.username || url.password) throw new BlockedUrlError('Endereço com credenciais.');
  if (!ALLOWED_PORTS.has(url.port)) throw new BlockedUrlError('Porta não permitida.');

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new BlockedUrlError('Host interno.');
  }
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new BlockedUrlError('Endereço IP não público.');
    return url;
  }

  let addresses: string[];
  try {
    addresses = await resolver(host);
  } catch {
    throw new BlockedUrlError('Não foi possível resolver o domínio.');
  }
  if (addresses.length === 0 || addresses.some(isBlockedIp)) {
    throw new BlockedUrlError('O domínio aponta para um endereço não público.');
  }
  return url;
}
