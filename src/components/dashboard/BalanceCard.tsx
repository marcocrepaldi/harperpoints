"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
// 1. Importando o CountUp para a animação
import CountUp from "react-countup";

interface BalanceCardProps {
  balance: number;
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function BalanceCard({ 
  balance, 
  title = "Meu Saldo",
  description = "Total de pontos disponíveis para uso.",
  icon: Icon 
}: BalanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {Icon && <Icon className="size-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-5xl font-bold tracking-tighter text-primary">
            {/* 2. Usando o componente CountUp para animar o número */}
            <CountUp
              end={balance}
              duration={1.5} // Duração da animação em segundos
              separator="."  // Separador de milhar
              decimal=","    // Separador decimal
            />
          </div>
          {/* 3. Adicionando o emoji ao lado do número */}
          <span className="text-4xl">🏆</span>
        </div>
      </CardContent>
    </Card>
  );
}