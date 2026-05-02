// src/data/contact.ts — CONTACT-01..04
// Email is the public-facing portfolio address.
// LinkedIn + GitHub URLs are public canonical handles. Resume PDFs are locale-correct
// public-relative paths the schema validates as ending in .pdf.
import { type Contact, ContactSchema } from './schemas';

export const contact: Contact = {
  email: 'lpansarini@gmail.com',
  linkedin: 'https://linkedin.com/in/luizpansarini',
  github: 'https://github.com/LuizHAP',
  resumePdf: {
    en: '/Luiz-Pansarini-Resume.pdf',
    pt: '/Luiz-Pansarini-Curriculo.pdf',
  },
  mailtoSubject: {
    en: 'Portfolio inquiry — [your name]',
    pt: 'Contato via portfolio — [seu nome]',
  },
};

ContactSchema.parse(contact);
