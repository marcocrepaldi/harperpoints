// Arquivo: app/register/page.tsx (ou onde sua página estiver)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // 1. Importando o Link do Next.js
import { register } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"; // 2. Importando CardDescription

export default function RegisterPage() {
  const [name, setName] = useState(""); // 3. Adicionando estado para o nome
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 4. Passando o nome para a função de registro
      await register(name, email, password);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Primeiro Acesso</CardTitle>
          {/* 5. Adicionando uma descrição para melhor UX */}
          <CardDescription>Crie sua conta para começar a usar o Harper Points.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* 6. Adicionando o campo de Nome no formulário */}
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome e sobrenome"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.nome@harper.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
            <div className="text-center text-sm text-muted-foreground pt-2">
              Já tem uma conta?{" "}
              {/* 7. Usando o componente Link para navegação */}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Faça login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}