import { type Lead, type LeadFormValues, type LeadInput, parseLeadInput } from '@/lib/admin/leads';
import type { LeadExtras, ScrapeJob } from '@/lib/crm/contract';

export const SCRAPE_DEFAULT_MAX_RESULTS = 40;
export const SCRAPE_MAX_RESULTS = 120;

export const BR_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export type RawPlace = {
  name: string;
  category: string;
  address: string;
  phone: string;
  websiteHref: string;
  hrefs: string[];
  ratingText: string;
  reviewsText: string;
  url: string;
};

export type ScrapedPlace = {
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  rating: number | null;
  reviews: number | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string;
};

export type ScrapeRequest = {
  query: string;
  city: string;
  state: string | null;
  maxResults: number;
};

export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function cleanText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFC')
    .replace(/[\p{Cc}\p{Cf}\p{Co}]|[\u{FE0E}\u{FE0F}]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function normalizeKeyText(value: string | null | undefined): string {
  return stripAccents(cleanText(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function buildSearchQuery(query: string, city: string, state: string | null): string {
  const place = state ? `${cleanText(city)} ${state}` : cleanText(city);
  return `${cleanText(query)} em ${place}`.trim();
}

export function searchUrl(query: string): string {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=pt-BR`;
}

export function clampMaxResults(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return SCRAPE_DEFAULT_MAX_RESULTS;
  return Math.min(Math.floor(parsed), SCRAPE_MAX_RESULTS);
}

export function parseScrapeRequest(
  input: Record<string, unknown>,
): { ok: true; request: ScrapeRequest } | { ok: false; error: string } {
  const niche = cleanText(typeof input.query === 'string' ? input.query : '');
  const city = cleanText(typeof input.city === 'string' ? input.city : '');
  const state = typeof input.state === 'string' ? input.state.trim().toUpperCase() : '';
  if (niche.length < 2 || niche.length > 80)
    return { ok: false, error: 'Informe o nicho (2 a 80 caracteres).' };
  if (city.length < 2 || city.length > 80)
    return { ok: false, error: 'Informe a cidade (2 a 80 caracteres).' };
  if (state !== '' && !(BR_STATES as readonly string[]).includes(state)) {
    return { ok: false, error: 'Escolha um estado da lista.' };
  }
  return {
    ok: true,
    request: {
      query: niche,
      city,
      state: state || null,
      maxResults: clampMaxResults(input.maxResults),
    },
  };
}

export function normalizePhoneBR(raw: string | null | undefined): string | null {
  const text = (raw ?? '').trim();
  let digits = text.replace(/\D/g, '');
  if (!digits) return null;
  if (/^(\+|00)/.test(text) && !/^(\+|00)\s*55/.test(text)) return null;
  if (digits.startsWith('0') && !digits.startsWith('00')) digits = digits.replace(/^0+/, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^55\d{10,11}$/.test(digits)) return null;
  const ddd = Number(digits.slice(2, 4));
  return ddd >= 11 && ddd <= 99 ? digits : null;
}

export function isBrMobile(phone: string | null): boolean {
  return phone !== null && /^55\d{2}9\d{8}$/.test(phone);
}

export function formatPhoneBR(phone: string): string {
  const national = phone.slice(2);
  const ddd = national.slice(0, 2);
  const rest = national.slice(2);
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

const CATEGORY_RULES: [RegExp, string][] = [
  [/dentist|odonto/, 'Odontologia'],
  [/psicolog|psiquiatr|terapeut/, 'Psicologia'],
  [/fisioterap|pilates|quiroprat/, 'Fisioterapia'],
  [/nutri/, 'Nutrição'],
  [/veterin|pet shop|petshop|animais|banho e tosa/, 'Pet'],
  [
    /clinica|medico|medica|consultorio|laboratorio|dermatolog|oftalmolog|ortoped|pediatr|ginecolog|cardiolog|hospital|saude/,
    'Saúde',
  ],
  [
    /estetic|beleza|salao|cabeleir|barbear|manicure|depila|spa|maquiag|sobrancelha/,
    'Beleza e estética',
  ],
  [/academia|crossfit|fitness|musculacao|personal trainer|yoga|ioga/, 'Fitness'],
  [/advoca|escritorio de direito|juridic/, 'Advocacia'],
  [/contabil|contador|contabilidade/, 'Contabilidade'],
  [/imobiliaria|corretor de imoveis|imoveis/, 'Imobiliário'],
  [
    /restaurante|lanchonete|pizzaria|hamburguer|bar |cafeteria|padaria|confeitaria|sorveteria|churrascaria|bistro/,
    'Gastronomia',
  ],
  [/escola|curso|colegio|idioma|ensino|faculdade|creche|educa/, 'Educação'],
  [
    /mecanica|oficina|auto pecas|autopecas|funilaria|lava jato|borracharia|concessionaria|automotiv|veiculos/,
    'Automotivo',
  ],
  [
    /arquitet|engenharia|construcao|construtora|reforma|marcenaria|pintor|eletricista|encanador/,
    'Construção e projetos',
  ],
  [/loja|boutique|moda|roupa|calcado|joalheria|otica|presentes|variedades|magazine/, 'Varejo'],
  [/hotel|pousada|hostel|turismo|agencia de viagens/, 'Turismo e hospedagem'],
  [/fotograf|agencia de|marketing|publicidade|grafica|design/, 'Marketing e design'],
  [/evento|buffet|festa|casamento/, 'Eventos'],
];

export function normalizeCategory(raw: string | null | undefined): string | null {
  const text = cleanText(raw);
  if (!text) return null;
  const key = `${normalizeKeyText(text)} `;
  for (const [pattern, label] of CATEGORY_RULES) {
    if (pattern.test(key)) return label;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const NON_SITE_HOST =
  /(^|\.)(google\.[a-z.]+|goo\.gl|g\.co|googleusercontent\.com|gstatic\.com|withgoogle\.com|instagram\.com|instagr\.am|facebook\.com|fb\.com|fb\.me|whatsapp\.com|wa\.me|wa\.link|tiktok\.com|twitter\.com|x\.com|linkedin\.com|youtube\.com|youtu\.be|linktr\.ee|linktree\.com|beacons\.ai|bio\.site|bio\.link|taplink\.cc|lnk\.bio|allmylinks\.com|ifood\.com\.br|getninjas\.com\.br|doctoralia\.com\.br|tripadvisor\.com(\.br)?|reclameaqui\.com\.br|bit\.ly|tinyurl\.com|t\.co|is\.gd)$/;

const TRACKING_PARAMS = /^(utm_[a-z]+|gclid|fbclid|igsh|igshid|msclkid|mc_cid|mc_eid)$/i;

function hostOf(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function unwrapGoogleRedirect(href: string): string {
  try {
    const url = new URL(href);
    if (/(^|\.)google\.[a-z.]+$/.test(url.hostname) && url.pathname === '/url') {
      return url.searchParams.get('q') ?? url.searchParams.get('url') ?? href;
    }
  } catch {}
  return href;
}

export function extractWebsite(href: string | null | undefined): string | null {
  const value = unwrapGoogleRedirect(cleanText(href));
  if (!/^https?:\/\//i.test(value)) return null;
  const host = hostOf(value);
  if (!host || !host.includes('.') || NON_SITE_HOST.test(host)) return null;
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  const clean = url.toString();
  return clean.length <= 500 ? clean.replace(/\/$/, '') : null;
}

const INSTAGRAM_RESERVED = new Set([
  'p',
  'reel',
  'reels',
  'tv',
  'stories',
  'story',
  'explore',
  'explorar',
  'accounts',
  'direct',
  'about',
  'invites',
  'lite',
]);

export function extractInstagram(hrefs: readonly string[]): string | null {
  for (const raw of hrefs) {
    const host = hostOf(unwrapGoogleRedirect(raw));
    if (!host || !/(^|\.)(instagram\.com|instagr\.am)$/.test(host)) continue;
    const url = new URL(unwrapGoogleRedirect(raw));
    const handle = url.pathname.split('/').filter(Boolean)[0];
    if (!handle || INSTAGRAM_RESERVED.has(handle.toLowerCase())) continue;
    if (/^[A-Za-z0-9._]{1,30}$/.test(handle)) return handle;
  }
  return null;
}

export function parseRating(text: string | null | undefined): number | null {
  const match = cleanText(text).match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = Number.parseFloat(match[1].replace(',', '.'));
  return value > 0 && value <= 5 ? value : null;
}

export function parseReviews(text: string | null | undefined): number | null {
  const clean = cleanText(text);
  if (!clean) return null;
  const match = clean.match(/(\d[\d.,]*)\s*(mil|k)?/i);
  if (!match) return null;
  const multiplier = match[2] ? 1000 : 1;
  const base = match[2]
    ? Number.parseFloat(match[1].replace(',', '.'))
    : Number(match[1].replace(/[.,]/g, ''));
  const count = Math.round(base * multiplier);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

export function parseCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  const poi = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const view = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const match = poi ?? view;
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? { lat, lng } : null;
}

export function cleanAddress(value: string | null | undefined): string | null {
  return cleanText(value) || null;
}

export function parsePlace(raw: RawPlace): ScrapedPlace | null {
  const name = cleanText(raw.name);
  if (!name) return null;
  const coords = parseCoordsFromUrl(raw.url);
  const phone = normalizePhoneBR(raw.phone);
  return {
    name,
    category: normalizeCategory(raw.category),
    address: cleanAddress(raw.address),
    phone,
    website: extractWebsite(raw.websiteHref),
    instagram: extractInstagram(raw.hrefs),
    rating: parseRating(raw.ratingText),
    reviews: parseReviews(raw.reviewsText),
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    mapsUrl: raw.url,
  };
}

export function dedupeKeys(place: Pick<ScrapedPlace, 'name' | 'address' | 'phone'>): string[] {
  const keys: string[] = [];
  const phone = normalizePhoneBR(place.phone);
  if (phone) keys.push(`p:${phone}`);
  keys.push(`n:${normalizeKeyText(place.name)}|${normalizeKeyText(place.address)}`);
  return keys;
}

export function dedupeKey(place: Pick<ScrapedPlace, 'name' | 'address' | 'phone'>): string {
  return dedupeKeys(place)[0];
}

export function leadDedupeKeys(lead: Lead): string[] {
  const phone = normalizePhoneBR(lead.whatsapp) ?? normalizePhoneBR(lead.phone);
  return dedupeKeys({ name: lead.name, address: lead.extras?.address ?? null, phone });
}

export function shortMapsUrl(place: Pick<ScrapedPlace, 'mapsUrl' | 'lat' | 'lng'>): string | null {
  const base = place.mapsUrl.split('/data=')[0].split('?')[0];
  if (base.length <= 500) return base;
  if (place.lat !== null && place.lng !== null)
    return `https://www.google.com/maps?q=${place.lat},${place.lng}`;
  return null;
}

export function toLeadInput(
  place: ScrapedPlace,
  job: Pick<ScrapeJob, 'id' | 'city'>,
): { input: LeadInput; extras: LeadExtras } {
  const phone = normalizePhoneBR(place.phone);
  const values: LeadFormValues = {
    name: place.name.slice(0, 120),
    website: place.website ?? '',
    source: 'google-maps',
    sourceUrl: shortMapsUrl(place) ?? '',
    whatsapp: isBrMobile(phone) && phone ? phone : '',
    email: '',
    phone: phone ? formatPhoneBR(phone) : '',
    instagram: place.instagram ?? '',
    previewSlug: '',
    nextStep: '',
    dueDate: '',
    notes: '',
    stage: 'prospectado',
  };
  let parsed = parseLeadInput(values);
  if (!parsed.ok) {
    const cleared = { ...values };
    for (const field of Object.keys(parsed.errors) as (keyof LeadFormValues)[]) {
      if (field !== 'name') cleared[field] = '';
    }
    parsed = parseLeadInput(cleared);
  }
  const input: LeadInput = parsed.ok ? parsed.input : emptyInput(values.name);
  return {
    input,
    extras: {
      category: place.category,
      address: place.address,
      city: job.city,
      rating: place.rating,
      reviews: place.reviews,
      lat: place.lat,
      lng: place.lng,
      mapsUrl: place.mapsUrl.length <= 2000 ? place.mapsUrl : shortMapsUrl(place),
      scrapeJobId: job.id,
    },
  };
}

function emptyInput(name: string): LeadInput {
  return {
    name,
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
  };
}
