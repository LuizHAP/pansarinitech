import { ScraperPanel } from '@/components/admin/scraper/scraper-panel';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/admin/auth';
import { readScrapeOverview } from '@/lib/crm/scrape-store';

export default async function ScraperPage() {
  await requireAdmin();
  const overview = await readScrapeOverview();

  return (
    <main className="mx-auto flex max-w-4xl min-w-0 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Buscar leads no Google Maps</h1>
          <p className="text-sm text-muted-foreground">
            A busca roda no worker local e os negócios novos entram em Leads como Prospectado.
          </p>
        </div>
        <div>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/leads">Voltar aos leads</a>
          </Button>
        </div>
      </header>
      <ScraperPanel initial={overview} />
    </main>
  );
}
