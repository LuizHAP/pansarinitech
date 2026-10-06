'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type LoginState, login } from '@/lib/admin/actions';
import { useActionState } from 'react';

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-user" className="text-sm font-medium">
          Usuário
        </label>
        <Input id="admin-user" name="user" autoComplete="username" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-password" className="text-sm font-medium">
          Senha
        </label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        Entrar
      </Button>
    </form>
  );
}
