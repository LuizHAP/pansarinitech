import { describe, expect, it, vi } from 'vitest';
import { analyzeLead } from './analyze';

const base = {
  name: 'Padaria Boa',
  whatsapp: '5511912345678',
  phone: null,
  email: null,
  instagram: null,
  extras: { category: 'Padaria', rating: 4.5, reviews: 80 },
};
const clock = () => new Date('2026-11-18T12:00:00.000Z');

describe('analyzeLead', () => {
  it('scores a lead without a site without fetching anything', async () => {
    const fetchMock = vi.fn();
    const score = await analyzeLead(
      { ...base, website: null },
      { fetch: fetchMock as never, env: {}, clock },
    );
    expect(score.signals.semSite).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('audits an own website before scoring', async () => {
    const fetchMock = vi.fn(async () => new Response('<html></html>', { status: 200 }));
    const score = await analyzeLead(
      { ...base, website: 'https://padaria.com.br' },
      { fetch: fetchMock as never, resolver: async () => ['93.184.216.34'], env: {}, clock },
    );
    expect(score.signals).toMatchObject({ semSite: false, siteAcessivel: true, responsivo: false });
    expect(score.engine).toBe('local');
  });

  it('does not audit social profiles', async () => {
    const fetchMock = vi.fn();
    await analyzeLead(
      { ...base, website: 'https://instagram.com/padaria' },
      { fetch: fetchMock as never, env: {}, clock },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
