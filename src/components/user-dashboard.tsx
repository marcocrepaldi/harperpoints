"use client";

import { useMemo } from "react";
// 1. Importando tudo o que precisamos do nosso contexto central
import { useAppContext, PointsData } from "@/context/app-context";

// 2. Componentes da UI continuam os mesmos
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function UserDashboard() {
  // 3. Obtendo todos os dados e o estado de carregamento do contexto
  const { currentUser, users, pointsHistory, loading } = useAppContext();

  // 4. Calculando o saldo efetivo usando useMemo para performance
  // Esta lógica é idêntica à que já implementamos, garantindo consistência.
  const effectiveBalance = useMemo(() => {
    if (!currentUser) return 0;
  
    let balance = currentUser.totalPoints;
    const quota = currentUser.distributableQuota;
  
    // Se a meta de distribuição obrigatória expirou, subtrai o saldo restante dela
    if (quota && quota.expiresAt && quota.remaining > 0) {
      if (new Date() > new Date(quota.expiresAt)) {
        balance -= quota.remaining;
      }
    }
    return balance;
  }, [currentUser]); // Só recalcula quando 'currentUser' muda

  // 5. Filtrando o histórico de transações específico deste usuário a partir do histórico global
  const userTransactions = useMemo(() => {
    if (!currentUser) return [];
    return pointsHistory
      .filter(tx => tx.userId === currentUser.id) // Pega apenas transações do usuário logado
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Garante a ordem
  }, [currentUser, pointsHistory]); // Recalcula se o usuário ou o histórico geral mudarem

  // 6. Usando o estado de 'loading' do contexto global
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-lg text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  // Guarda para o caso de o contexto carregar mas não encontrar um usuário
  if (!currentUser) {
    return null; 
  }

  // 7. A renderização do componente agora é mais limpa e direta
  return (
    <Card className="w-full max-w-2xl mx-auto my-8 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>Seu Saldo</span>
          <span className="text-primary text-4xl font-bold tracking-tight">
            {effectiveBalance.toLocaleString('pt-BR')} ✨
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="font-bold mb-4 text-lg">Seu Histórico de Transações</h3>
        <div className="max-h-96 overflow-y-auto rounded-lg border">
          <ul className="divide-y">
            {userTransactions.length > 0 ? (
              userTransactions.map(tx => {
                // Para exibir o nome de quem enviou/recebeu, enriquecemos a transação
                // Esta lógica pode ser expandida conforme a complexidade do 'tx.description'
                return (
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
                );
              })
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