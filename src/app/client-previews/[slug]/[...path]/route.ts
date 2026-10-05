import { servePreviewAsset } from '@/lib/client-preview-source';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; path: string[] }> },
) {
  const { slug, path } = await params;
  return servePreviewAsset(slug, path, request.headers.get('if-none-match'));
}
