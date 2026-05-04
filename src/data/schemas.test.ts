// src/data/schemas.test.ts — Phase 01 Plan 02 (100% coverage on Zod schemas)
import { describe, expect, it } from 'vitest';
import {
  AboutSchema,
  ContactSchema,
  HeroSchema,
  LocaleArrayStringSchema,
  LocaleStringSchema,
  NowSchema,
  RoleSchema,
  SkillCategorySchema,
} from './schemas';

describe('LocaleStringSchema', () => {
  it('accepts non-empty {en, pt}', () => {
    expect(LocaleStringSchema.safeParse({ en: 'A', pt: 'B' }).success).toBe(true);
  });

  it('rejects empty string on en', () => {
    expect(LocaleStringSchema.safeParse({ en: '', pt: 'B' }).success).toBe(false);
  });

  it('rejects empty string on pt', () => {
    expect(LocaleStringSchema.safeParse({ en: 'A', pt: '' }).success).toBe(false);
  });

  it('rejects missing locale key (only en present)', () => {
    expect(LocaleStringSchema.safeParse({ en: 'A' }).success).toBe(false);
  });

  it('rejects missing locale key (only pt present)', () => {
    expect(LocaleStringSchema.safeParse({ pt: 'B' }).success).toBe(false);
  });
});

describe('LocaleArrayStringSchema', () => {
  it('accepts non-empty arrays in both locales', () => {
    expect(LocaleArrayStringSchema.safeParse({ en: ['item1'], pt: ['item2'] }).success).toBe(true);
  });

  it('accepts multiple items in both locales', () => {
    expect(LocaleArrayStringSchema.safeParse({ en: ['a', 'b'], pt: ['c', 'd'] }).success).toBe(
      true,
    );
  });

  it('rejects empty array on en', () => {
    expect(LocaleArrayStringSchema.safeParse({ en: [], pt: ['item'] }).success).toBe(false);
  });

  it('rejects empty array on pt', () => {
    expect(LocaleArrayStringSchema.safeParse({ en: ['item'], pt: [] }).success).toBe(false);
  });

  it('rejects array containing an empty string', () => {
    expect(LocaleArrayStringSchema.safeParse({ en: [''], pt: ['item'] }).success).toBe(false);
  });
});

describe('HeroSchema', () => {
  const validHero = {
    name: 'Luiz Pansarini',
    role: { en: 'Principal Software Engineer', pt: 'Engenheiro de Software Principal' },
    valueProp: { en: 'Building great things', pt: 'Construindo coisas incríveis' },
    photoAlt: { en: 'Luiz headshot', pt: 'Foto de perfil de Luiz' },
  };

  it('accepts a fully valid hero object', () => {
    expect(HeroSchema.safeParse(validHero).success).toBe(true);
  });

  it('rejects when photoAlt is missing', () => {
    const { photoAlt: _dropped, ...noPhotoAlt } = validHero;
    expect(HeroSchema.safeParse(noPhotoAlt).success).toBe(false);
  });

  it('rejects when name is empty string', () => {
    expect(HeroSchema.safeParse({ ...validHero, name: '' }).success).toBe(false);
  });

  it('rejects when role en is empty', () => {
    expect(HeroSchema.safeParse({ ...validHero, role: { en: '', pt: 'valid' } }).success).toBe(
      false,
    );
  });
});

describe('AboutSchema', () => {
  it('accepts paragraphs with exactly 2 items in each locale', () => {
    expect(
      AboutSchema.safeParse({
        paragraphs: { en: ['Para 1', 'Para 2'], pt: ['Para 1 pt', 'Para 2 pt'] },
        cadence: { en: 'Every quarter', pt: 'Todo trimestre' },
      }).success,
    ).toBe(true);
  });

  it('accepts paragraphs with 8 items (max) in each locale', () => {
    const eightItems = Array.from({ length: 8 }, (_, i) => `Para ${i + 1}`);
    expect(
      AboutSchema.safeParse({
        paragraphs: { en: eightItems, pt: eightItems },
        cadence: { en: 'Every quarter', pt: 'Todo trimestre' },
      }).success,
    ).toBe(true);
  });

  it('rejects with only 1 paragraph (covers .min(2))', () => {
    expect(
      AboutSchema.safeParse({
        paragraphs: { en: ['Only one'], pt: ['Só um'] },
        cadence: { en: 'Every quarter', pt: 'Todo trimestre' },
      }).success,
    ).toBe(false);
  });

  it('rejects with 9 paragraphs (covers .max(8))', () => {
    const nineItems = Array.from({ length: 9 }, (_, i) => `Para ${i + 1}`);
    expect(
      AboutSchema.safeParse({
        paragraphs: { en: nineItems, pt: nineItems },
        cadence: { en: 'Every quarter', pt: 'Todo trimestre' },
      }).success,
    ).toBe(false);
  });
});

describe('RoleSchema', () => {
  const validRole = {
    id: 'machinery-partner',
    company: 'Machinery Partner',
    role: { en: 'Principal Software Engineer', pt: 'Engenheiro de Software Principal' },
    period: { start: '2023-01', end: '2023-12' },
    bullets: { en: ['Led architecture'], pt: ['Liderou arquitetura'] },
  };

  it('accepts valid period with YYYY-MM start and YYYY-MM end', () => {
    expect(
      RoleSchema.safeParse({ ...validRole, period: { start: '2019-04', end: '2023-12' } }).success,
    ).toBe(true);
  });

  it("accepts period.end = 'present' (literal branch)", () => {
    expect(
      RoleSchema.safeParse({ ...validRole, period: { start: '2023-04', end: 'present' } }).success,
    ).toBe(true);
  });

  it('accepts pivot: true (optional field set)', () => {
    expect(RoleSchema.safeParse({ ...validRole, pivot: true }).success).toBe(true);
  });

  it('accepts without pivot field (optional)', () => {
    expect(RoleSchema.safeParse(validRole).success).toBe(true);
  });

  it("rejects period.start = '2019-4' (regex fail — not zero-padded)", () => {
    expect(
      RoleSchema.safeParse({ ...validRole, period: { start: '2019-4', end: '2023-12' } }).success,
    ).toBe(false);
  });

  it("rejects period.end = 'soon' (union fail — neither YYYY-MM nor 'present')", () => {
    expect(
      RoleSchema.safeParse({ ...validRole, period: { start: '2019-04', end: 'soon' } }).success,
    ).toBe(false);
  });

  it('rejects empty id', () => {
    expect(RoleSchema.safeParse({ ...validRole, id: '' }).success).toBe(false);
  });
});

describe('SkillCategorySchema', () => {
  const validCategory = {
    id: 'frontend' as const,
    label: { en: 'Frontend', pt: 'Frontend' },
    items: [{ name: 'Next.js' }],
  };

  it("accepts valid id 'frontend' with minimal item", () => {
    expect(SkillCategorySchema.safeParse(validCategory).success).toBe(true);
  });

  it('accepts item with ALL optional fields populated', () => {
    expect(
      SkillCategorySchema.safeParse({
        ...validCategory,
        items: [
          {
            name: 'Next.js',
            daily: true,
            icon: 'logos:nextjs-icon',
            mono: 'Next.js',
            textBadge: true,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts all valid enum ids: 'mobile', 'backend', 'testing', 'cloud', 'databases', 'tools'", () => {
    for (const id of ['mobile', 'backend', 'testing', 'cloud', 'databases', 'tools'] as const) {
      expect(SkillCategorySchema.safeParse({ ...validCategory, id }).success).toBe(true);
    }
  });

  it("rejects id 'invalid' (enum miss)", () => {
    expect(SkillCategorySchema.safeParse({ ...validCategory, id: 'invalid' }).success).toBe(false);
  });

  it('rejects empty items array (covers .min(1))', () => {
    expect(SkillCategorySchema.safeParse({ ...validCategory, items: [] }).success).toBe(false);
  });
});

describe('NowSchema', () => {
  const validNow = {
    lastUpdated: '2026-05-03',
    workingOn: { en: 'Building portfolio', pt: 'Construindo portfolio' },
    reading: { en: 'A book', pt: 'Um livro' },
    side: { en: 'Side project', pt: 'Projeto paralelo' },
  };

  it("accepts lastUpdated '2026-05-03' (YYYY-MM-DD format)", () => {
    expect(NowSchema.safeParse(validNow).success).toBe(true);
  });

  it("rejects lastUpdated '2026-5-3' (regex requires zero-padding)", () => {
    expect(NowSchema.safeParse({ ...validNow, lastUpdated: '2026-5-3' }).success).toBe(false);
  });

  it("rejects lastUpdated '2026-05' (missing day)", () => {
    expect(NowSchema.safeParse({ ...validNow, lastUpdated: '2026-05' }).success).toBe(false);
  });
});

describe('ContactSchema', () => {
  const validContact = {
    email: 'luiz@example.com',
    linkedin: 'https://linkedin.com/in/luiz',
    github: 'https://github.com/luiz',
    resumePdf: {
      en: '/Luiz-Pansarini-Resume.pdf',
      pt: '/Luiz-Pansarini-Curriculo.pdf',
    },
    mailtoSubject: {
      en: 'Hello from your portfolio',
      pt: 'Olá do seu portfolio',
    },
  };

  it('accepts valid email + linkedin URL + github URL + pdf paths + mailtoSubject', () => {
    expect(ContactSchema.safeParse(validContact).success).toBe(true);
  });

  it("rejects email 'not-an-email'", () => {
    expect(ContactSchema.safeParse({ ...validContact, email: 'not-an-email' }).success).toBe(false);
  });

  it("rejects linkedin 'not-a-url'", () => {
    expect(ContactSchema.safeParse({ ...validContact, linkedin: 'not-a-url' }).success).toBe(false);
  });

  it("rejects github 'not-a-url'", () => {
    expect(ContactSchema.safeParse({ ...validContact, github: 'not-a-url' }).success).toBe(false);
  });

  it("rejects resumePdf.en '/wrong.txt' (not ending in .pdf)", () => {
    expect(
      ContactSchema.safeParse({
        ...validContact,
        resumePdf: { en: '/wrong.txt', pt: '/ok.pdf' },
      }).success,
    ).toBe(false);
  });

  it("rejects resumePdf.en 'no-leading-slash.pdf' (no leading /)", () => {
    expect(
      ContactSchema.safeParse({
        ...validContact,
        resumePdf: { en: 'no-leading-slash.pdf', pt: '/ok.pdf' },
      }).success,
    ).toBe(false);
  });

  it("rejects resumePdf.pt '/wrong.txt'", () => {
    expect(
      ContactSchema.safeParse({
        ...validContact,
        resumePdf: { en: '/ok.pdf', pt: '/wrong.txt' },
      }).success,
    ).toBe(false);
  });
});
