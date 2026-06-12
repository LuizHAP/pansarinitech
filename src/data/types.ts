// src/data/types.ts — Phase 13 CASE-24, CASE-25, CASE-26
// Pure TypeScript types extracted from schemas.ts to break Zod → client chain.
// This file has ZERO Zod imports — safe for client-side consumption.
// Zod is only used in schemas.ts for server-side validation.
export type Role = {
  id: string;
  company: string;
  role: { en: string; pt: string };
  period: {
    start: string;
    end: string | 'present';
  };
  bullets: string[];
  pivot?: boolean;
};
