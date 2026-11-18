import { CampaignForm } from '@/components/admin/campaign-form';
import { requireAdmin } from '@/lib/admin/auth';

export default async function NewCampaignPage() {
  await requireAdmin();
  return (
    <main className="mx-auto flex max-w-3xl min-w-0 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <a href="/admin/campanhas" className="text-sm text-muted-foreground hover:underline">
          Campanhas
        </a>
        <h1 className="text-2xl font-semibold">Nova campanha</h1>
      </header>
      <CampaignForm />
    </main>
  );
}
