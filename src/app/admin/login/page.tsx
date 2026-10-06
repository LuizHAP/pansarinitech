import { LoginForm } from '@/components/admin/login-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { assertAdminEnabled } from '@/lib/admin/auth';

export default async function AdminLoginPage() {
  await assertAdminEnabled();

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl font-semibold">Admin</h1>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
