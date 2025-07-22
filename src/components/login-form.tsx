"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  className,
  onLogin,
  loading = false,
  error,
  ...props
}: React.ComponentProps<"form"> & {
  onLogin?: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (onLogin) {
      await onLogin(email, password);
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Acesse sua conta</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Digite seu e-mail abaixo para acessar sua conta
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Senha</Label>
            <button
              type="button"
              className="ml-auto text-sm underline-offset-4 hover:underline"
              tabIndex={-1}
              disabled
              style={{ opacity: 0.5, pointerEvents: "none" }}
            >
              Esqueceu sua senha?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Não tem uma conta?{" "}
        <a
          href="/register"
          className="underline underline-offset-4"
        >
          Cadastre-se
        </a>
      </div>
    </form>
  );
}

export default LoginForm;