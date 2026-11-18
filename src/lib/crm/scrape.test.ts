import { type Lead, parseLeadInput } from '@/lib/admin/leads';
import { describe, expect, it } from 'vitest';
import {
  type RawPlace,
  type ScrapedPlace,
  buildSearchQuery,
  clampMaxResults,
  dedupeKey,
  dedupeKeys,
  extractInstagram,
  extractWebsite,
  formatPhoneBR,
  isBrMobile,
  leadDedupeKeys,
  normalizeCategory,
  normalizePhoneBR,
  parseCoordsFromUrl,
  parsePlace,
  parseRating,
  parseReviews,
  parseScrapeRequest,
  toLeadInput,
} from './scrape';
import { isWorkerOnline } from './scrape-store';

const job = { id: 'job-1', city: 'Campinas' };

const fixture: RawPlace = {
  name: ' Clínica  Sorriso ',
  category: 'Clínica odontológica',
  address: ' Rua das Flores, 123 - Centro, Campinas - SP, 13010-000',
  phone: '19991234567',
  websiteHref: 'https://www.clinicasorriso.com.br/?utm_source=gmaps&x=1',
  hrefs: [
    'https://www.google.com/maps/place/x',
    'https://www.instagram.com/p/abc/',
    'https://www.instagram.com/clinica.sorriso/?igsh=zzz',
  ],
  ratingText: '4,8',
  reviewsText: '1.234 avaliações',
  url: 'https://www.google.com/maps/place/Cl%C3%ADnica+Sorriso/@-22.9,-47.06,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x1!8m2!3d-22.9056391!4d-47.0608134!16s',
};

describe('buildSearchQuery', () => {
  it('joins niche, city and state', () => {
    expect(buildSearchQuery(' dentista ', 'Campinas', 'SP')).toBe('dentista em Campinas SP');
    expect(buildSearchQuery('dentista', 'Campinas', null)).toBe('dentista em Campinas');
  });
});

describe('parseScrapeRequest', () => {
  it('accepts a valid request and caps maxResults', () => {
    const result = parseScrapeRequest({
      query: 'dentista',
      city: 'Campinas',
      state: 'sp',
      maxResults: '500',
    });
    expect(result).toEqual({
      ok: true,
      request: { query: 'dentista', city: 'Campinas', state: 'SP', maxResults: 120 },
    });
  });

  it('rejects blank niche, blank city and unknown state', () => {
    expect(parseScrapeRequest({ query: '', city: 'x y' }).ok).toBe(false);
    expect(parseScrapeRequest({ query: 'abc', city: '' }).ok).toBe(false);
    expect(parseScrapeRequest({ query: 'abc', city: 'Campinas', state: 'ZZ' }).ok).toBe(false);
  });

  it('defaults maxResults', () => {
    expect(clampMaxResults(undefined)).toBe(40);
    expect(clampMaxResults('abc')).toBe(40);
    expect(clampMaxResults(0)).toBe(40);
    expect(clampMaxResults('25')).toBe(25);
  });
});

describe('phone', () => {
  it.each([
    ['(19) 99123-4567', '5519991234567'],
    ['+55 19 99123-4567', '5519991234567'],
    ['019 3234-5678', '551932345678'],
    ['5519991234567', '5519991234567'],
  ])('normalizes %s', (raw, expected) => {
    expect(normalizePhoneBR(raw)).toBe(expected);
  });

  it('rejects foreign or short numbers', () => {
    expect(normalizePhoneBR('+1 415 555 2671')).toBeNull();
    expect(normalizePhoneBR('1234')).toBeNull();
    expect(normalizePhoneBR(null)).toBeNull();
    expect(normalizePhoneBR('0800 123 456')).toBeNull();
  });

  it('tells mobile from landline and formats', () => {
    expect(isBrMobile('5519991234567')).toBe(true);
    expect(isBrMobile('551932345678')).toBe(false);
    expect(isBrMobile(null)).toBe(false);
    expect(formatPhoneBR('5519991234567')).toBe('(19) 99123-4567');
    expect(formatPhoneBR('551932345678')).toBe('(19) 3234-5678');
  });
});

describe('normalizeCategory', () => {
  it.each([
    ['Dentista', 'Odontologia'],
    ['Clínica odontológica', 'Odontologia'],
    ['Clínica médica', 'Saúde'],
    ['Salão de beleza', 'Beleza e estética'],
    ['Pet shop', 'Pet'],
    ['Restaurante japonês', 'Gastronomia'],
    ['Escritório de advocacia', 'Advocacia'],
    ['Fabricante de zíperes', 'Fabricante de zíperes'],
  ])('%s -> %s', (raw, expected) => {
    expect(normalizeCategory(raw)).toBe(expected);
  });

  it('returns null for empty', () => {
    expect(normalizeCategory('  ')).toBeNull();
  });
});

describe('links', () => {
  it('keeps a real website and strips tracking', () => {
    expect(extractWebsite('https://www.clinicasorriso.com.br/?utm_source=gmaps&x=1')).toBe(
      'https://www.clinicasorriso.com.br/?x=1',
    );
  });

  it('drops social, google and aggregator links', () => {
    expect(extractWebsite('https://www.instagram.com/foo')).toBeNull();
    expect(extractWebsite('https://linktr.ee/foo')).toBeNull();
    expect(extractWebsite('https://www.google.com/maps/place/x')).toBeNull();
    expect(extractWebsite('')).toBeNull();
  });

  it('unwraps google redirects', () => {
    expect(extractWebsite('https://www.google.com/url?q=https://loja.com.br/&sa=U')).toBe(
      'https://loja.com.br',
    );
  });

  it('finds the instagram handle and skips posts', () => {
    expect(extractInstagram(fixture.hrefs)).toBe('clinica.sorriso');
    expect(extractInstagram(['https://instagram.com/reel/abc'])).toBeNull();
    expect(extractInstagram([])).toBeNull();
  });
});

describe('numbers and coords', () => {
  it('parses rating and reviews', () => {
    expect(parseRating('4,8')).toBe(4.8);
    expect(parseRating('')).toBeNull();
    expect(parseRating('9')).toBeNull();
    expect(parseReviews('1.234 avaliações')).toBe(1234);
    expect(parseReviews('2,5 mil avaliações')).toBe(2500);
    expect(parseReviews('87')).toBe(87);
    expect(parseReviews('')).toBeNull();
  });

  it('prefers the POI coordinates over the viewport', () => {
    expect(parseCoordsFromUrl(fixture.url)).toEqual({ lat: -22.9056391, lng: -47.0608134 });
    expect(parseCoordsFromUrl('https://www.google.com/maps/place/x/@-22.9,-47.06,17z')).toEqual({
      lat: -22.9,
      lng: -47.06,
    });
    expect(parseCoordsFromUrl('https://www.google.com/maps')).toBeNull();
  });
});

describe('parsePlace', () => {
  it('turns a raw panel into a scraped place', () => {
    expect(parsePlace(fixture)).toEqual({
      name: 'Clínica Sorriso',
      category: 'Odontologia',
      address: 'Rua das Flores, 123 - Centro, Campinas - SP, 13010-000',
      phone: '5519991234567',
      website: 'https://www.clinicasorriso.com.br/?x=1',
      instagram: 'clinica.sorriso',
      rating: 4.8,
      reviews: 1234,
      lat: -22.9056391,
      lng: -47.0608134,
      mapsUrl: fixture.url,
    });
  });

  it('returns null without a name', () => {
    expect(parsePlace({ ...fixture, name: '  ' })).toBeNull();
  });
});

describe('dedupe', () => {
  const base = { name: 'Clínica Sorriso', address: 'Rua das Flores, 123', phone: '5519991234567' };

  it('uses the phone when there is one', () => {
    expect(dedupeKey(base)).toBe('p:5519991234567');
    expect(dedupeKey({ ...base, name: 'Outro nome' })).toBe(dedupeKey(base));
  });

  it('falls back to normalized name and address', () => {
    const a = dedupeKey({ name: 'CLINICA  Sorriso!', address: 'rua das flores 123', phone: null });
    const b = dedupeKey({ name: 'Clínica Sorriso', address: 'Rua das Flores, 123', phone: null });
    expect(a).toBe(b);
    expect(a).toBe('n:clinica sorriso|rua das flores 123');
  });

  it('matches an existing lead through either key', () => {
    const lead = {
      name: 'Clínica Sorriso',
      whatsapp: null,
      phone: '(19) 99123-4567',
      extras: { address: 'Rua das Flores, 123' },
    } as Lead;
    const keys = new Set(leadDedupeKeys(lead));
    expect(dedupeKeys(base).some((key) => keys.has(key))).toBe(true);
    expect(dedupeKeys({ ...base, phone: null }).some((key) => keys.has(key))).toBe(true);
    expect(
      dedupeKeys({ name: 'Outra', address: 'x', phone: null }).some((key) => keys.has(key)),
    ).toBe(false);
  });
});

describe('toLeadInput', () => {
  const place = parsePlace(fixture) as ScrapedPlace;

  it('builds a lead input that the lead form accepts', () => {
    const { input, extras } = toLeadInput(place, job);
    expect(input).toMatchObject({
      name: 'Clínica Sorriso',
      source: 'google-maps',
      sourceUrl: 'https://www.google.com/maps/place/Cl%C3%ADnica+Sorriso/@-22.9,-47.06,17z',
      whatsapp: '5519991234567',
      phone: '(19) 99123-4567',
      instagram: 'clinica.sorriso',
      website: 'https://www.clinicasorriso.com.br/?x=1',
    });
    expect(extras).toMatchObject({
      category: 'Odontologia',
      city: 'Campinas',
      rating: 4.8,
      reviews: 1234,
      lat: -22.9056391,
      lng: -47.0608134,
      scrapeJobId: 'job-1',
    });
    const reparsed = parseLeadInput({
      name: input.name,
      website: input.website ?? '',
      source: input.source,
      sourceUrl: input.sourceUrl ?? '',
      whatsapp: input.whatsapp ?? '',
      email: '',
      phone: input.phone ?? '',
      instagram: input.instagram ?? '',
      previewSlug: '',
      nextStep: '',
      dueDate: '',
      notes: '',
      stage: 'prospectado',
    });
    expect(reparsed.ok).toBe(true);
  });

  it('sets whatsapp only for mobile numbers', () => {
    const landline = { ...place, phone: '551932345678' };
    const { input } = toLeadInput(landline, job);
    expect(input.whatsapp).toBeNull();
    expect(input.phone).toBe('(19) 3234-5678');
  });

  it('survives long names, huge urls and missing fields', () => {
    const long = {
      ...place,
      name: 'x'.repeat(300),
      mapsUrl: `https://www.google.com/maps/place/${'a'.repeat(700)}`,
      website: null,
      phone: null,
    };
    const { input } = toLeadInput(long, job);
    expect(input.name).toHaveLength(120);
    expect(input.sourceUrl).toBe('https://www.google.com/maps?q=-22.9056391,-47.0608134');
    expect(input.phone).toBeNull();
    expect(input.whatsapp).toBeNull();
  });
});

describe('isWorkerOnline', () => {
  it('goes stale after the max age', () => {
    expect(isWorkerOnline(null)).toBe(false);
    expect(isWorkerOnline(1000, 5000)).toBe(true);
    expect(isWorkerOnline(1000, 60_000)).toBe(false);
  });
});
