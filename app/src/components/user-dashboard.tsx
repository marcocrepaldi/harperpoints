"use client";

import { useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function UserDashboard() {
  const { currentUser, pointsHistory, loading } = useAppContext();

  const effectiveBalance = useMemo(() => {
    if (!currentUser) return 0;

    let balance = currentUser.totalPoints;
    const quota = currentUser.distributableQuota;

    if (quota && quota.expiresAt && quota.remaining > 0) {
      if (new Date() > new Date(quota.expiresAt)) {
        balance -= quota.remaining;
      }
    }
    return balance;
  }, [currentUser]);

  const userTransactions = useMemo(() => {
    if (!currentUser) return [];
    return pointsHistory
      .filter(tx => tx.userId === currentUser.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentUser, pointsHistory]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-lg text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto my-8 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>Seu Saldo</span>
          <span className="text-primary text-4xl font-bold tracking-tight">
            {effectiveBalance.toLocaleString("pt-BR")} ✨
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="font-bold mb-4 text-lg">Seu Histórico de Transações</h3>
        <div className="max-h-96 overflow-y-auto rounded-lg border">
          <ul className="divide-y">
            {userTransactions.length > 0 ? (
              userTransactions.map(tx => (
                <li key={tx.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span
                    className={`font-bold text-lg ${
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </span>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-muted-foreground">
                Nenhuma transação encontrada no seu histórico.
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
