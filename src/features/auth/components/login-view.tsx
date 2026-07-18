"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginView({ from }: { from?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/auth/login", { password });
      router.push(from && from.startsWith("/") ? from : "/");
      router.refresh();
    } catch {
      setError("Contraseña incorrecta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-app flex min-h-screen items-center justify-center px-4">
      <Card className="glass w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="bg-gradient-brand mb-2 flex size-12 items-center justify-center rounded-2xl text-white">
            <Lock className="size-5" />
          </div>
          <CardTitle className="text-xl">Watchvault</CardTitle>
          <CardDescription>Ingresá la contraseña para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input
              type="password"
              autoFocus
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error ? true : undefined}
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting || !password}>
              {submitting ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
