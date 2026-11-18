import { describe, expect, it, vi } from 'vitest';
import { BlockedUrlError, assertPublicUrl, isBlockedIp } from './ssrf';

describe('isBlockedIp', () => {
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '100.64.0.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    'fe80::1',
    'fc00::1',
    'fd12:3456::1',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:a9fe:a9fe',
    '64:ff9b::7f00:1',
    '2001:db8::1',
    '2002:7f00:1::1',
    'not-an-ip',
  ])('blocks %s', (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each([
    '8.8.8.8',
    '172.32.0.1',
    '100.63.0.1',
    '1.1.1.1',
    '2606:4700:4700::1111',
    '::ffff:8.8.8.8',
  ])('allows %s', (ip) => {
    expect(isBlockedIp(ip)).toBe(false);
  });
});

describe('assertPublicUrl', () => {
  const publicHost = vi.fn(async () => ['93.184.216.34']);

  it('accepts a public http(s) url', async () => {
    const url = await assertPublicUrl('https://exemplo.com.br/a', publicHost);
    expect(url.hostname).toBe('exemplo.com.br');
  });

  it.each([
    'ftp://exemplo.com',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://user:pass@exemplo.com',
    'https://exemplo.com:8080',
    'http://localhost',
    'http://app.localhost',
    'http://printer.local',
    'http://svc.internal',
    'http://127.0.0.1',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data',
    'http://2130706433',
    'not a url',
  ])('rejects %s', async (raw) => {
    await expect(assertPublicUrl(raw, publicHost)).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('rejects a domain that resolves to a private address, even among public ones', async () => {
    const resolver = vi.fn(async () => ['93.184.216.34', '10.0.0.5']);
    await expect(assertPublicUrl('https://rebind.example', resolver)).rejects.toThrow(
      /não público/,
    );
  });

  it('rejects when DNS fails or returns nothing', async () => {
    await expect(
      assertPublicUrl('https://x.example', async () => {
        throw new Error('ENOTFOUND');
      }),
    ).rejects.toThrow(/resolver/);
    await expect(assertPublicUrl('https://x.example', async () => [])).rejects.toBeInstanceOf(
      BlockedUrlError,
    );
  });
});
