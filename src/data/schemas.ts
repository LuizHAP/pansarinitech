// src/data/schemas.ts — Phase 2 Wave 2 (D-03)
// Bilingual content validation. Every {en, pt} field must be non-empty;
// build-time gate (`pnpm verify:data`) enforces shape across all data modules.
import { z } from 'zod';

const Bilingual = <T extends z.ZodTypeAny>(value: T) => z.object({ en: value, pt: value });

export const LocaleStringSchema = Bilingual(z.string().min(1, 'Empty translation'));
export const LocaleArrayStringSchema = Bilingual(z.array(z.string().min(1)).min(1));

// Hero — career-arc value prop + headshot alt text + 2-CTA scaffold consumed by hero.tsx.
export const HeroSchema = z.object({
  name: z.string().min(1),
  role: LocaleStringSchema, // "Principal Software Engineer · Brazil"
  valueProp: LocaleStringSchema, // 2-3 sentence career arc copy
  photoAlt: LocaleStringSchema, // A11Y-05 — alt text on the headshot
});
export type Hero = z.infer<typeof HeroSchema>;

// About — 2-8 paragraph bilingual bio + Now-cadence statement.
export const AboutSchema = z.object({
  paragraphs: Bilingual(z.array(z.string().min(1)).min(2).max(8)),
  cadence: LocaleStringSchema, // "I update /now every quarter."
});
export type About = z.infer<typeof AboutSchema>;

// Career timeline — 5 reverse-chronological roles with optional pivot:true marker.
export const RoleSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1), // proper noun, not translated
  role: LocaleStringSchema,
  period: z.object({
    start: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM'),
    end: z.union([z.string().regex(/^\d{4}-\d{2}$/), z.literal('present')]),
  }),
  bullets: LocaleArrayStringSchema,
  pivot: z.boolean().optional(), // CAREER-03 — UAUBox 2019 IT-to-Engineering marker
});
export type Role = z.infer<typeof RoleSchema>;

// Skills — 7 categories per SKILLS-01; daily flag highlights the daily-use stack.
export const SkillCategorySchema = z.object({
  id: z.enum(['frontend', 'mobile', 'backend', 'testing', 'cloud', 'databases', 'tools']),
  label: LocaleStringSchema,
  items: z
    .array(
      z.object({
        name: z.string().min(1), // proper noun (e.g., "Next.js"), not translated
        daily: z.boolean().optional(), // SKILLS-02 — daily-use highlight
        icon: z.string().optional(), // Iconify slug e.g. "logos:nextjs-icon"
        mono: z.string().optional(), // text fallback for badges without an icon
        textBadge: z.boolean().optional(), // render mono text pill instead of icon
      }),
    )
    .min(1),
});
export type SkillCategory = z.infer<typeof SkillCategorySchema>;

// Now — three subsections + machine-readable lastUpdated date.
export const NowSchema = z.object({
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  workingOn: LocaleStringSchema,
  reading: LocaleStringSchema,
  side: LocaleStringSchema,
});
export type NowContent = z.infer<typeof NowSchema>;

// Contact — email + LinkedIn + GitHub URLs + locale-correct resume PDF paths
// + locale-aware mailto subject. URLs validated by zod's .url(); PDFs must be
// public-relative and end in .pdf.
export const ContactSchema = z.object({
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url(),
  resumePdf: z.object({
    en: z.string().regex(/^\/.*\.pdf$/), // public-relative, e.g. /Luiz-Pansarini-Resume.pdf
    pt: z.string().regex(/^\/.*\.pdf$/),
  }),
  mailtoSubject: LocaleStringSchema,
});
export type Contact = z.infer<typeof ContactSchema>;
