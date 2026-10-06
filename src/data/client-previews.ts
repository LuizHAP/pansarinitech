export type ClientPreview = {
  slug: string;
  client: string;
  locale: 'pt' | 'en';
};

export const clientPreviews: readonly ClientPreview[] = [];

export function getClientPreview(slug: string): ClientPreview | undefined {
  return clientPreviews.find((preview) => preview.slug === slug);
}
