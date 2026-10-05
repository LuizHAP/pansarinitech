export type ClientPreview = {
  slug: string;
  client: string;
  locale: 'pt' | 'en';
};

export const clientPreviews: readonly ClientPreview[] = [
  { slug: 'exemplo', client: 'Cliente Exemplo', locale: 'pt' },
  { slug: 'heris-clinica-medica', client: 'Héris Clínica Médica', locale: 'pt' },
];

export function getClientPreview(slug: string): ClientPreview | undefined {
  return clientPreviews.find((preview) => preview.slug === slug);
}
