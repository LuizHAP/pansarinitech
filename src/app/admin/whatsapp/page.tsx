import { WhatsappApp } from '@/components/admin/whatsapp/whatsapp-app';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/admin/auth';
import { digits } from '@/lib/crm/wa';

export default async function WhatsappPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string | string[] }>;
}) {
  await requireAdmin();
  const { phone } = await searchParams;
  const initialPhone = digits(Array.isArray(phone) ? phone[0] : phone) || null;

  return (
    <main className="mx-auto flex max-w-7xl min-w-0 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">WhatsApp</h1>
        <Button asChild variant="outline" size="sm">
          <a href="/admin/leads">Leads</a>
        </Button>
      </header>
      <WhatsappApp initialPhone={initialPhone} />
    </main>
  );
}
