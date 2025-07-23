"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PointsData } from "@/context/app-context";
// 1. Importando ícones para uma melhor identificação visual
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

// 2. A interface agora aceita um 'title' opcional para tornar o componente reutilizável
interface TransactionsHistoryProps {
  history: PointsData[];
  title?: string;
  maxHeight?: string; // Prop opcional para controlar a altura máxima
}

export function TransactionsHistory({ 
  history, 
  title = "Meu Histórico de Transações", // 3. Valor padrão para o título
  maxHeight = 'max-h-96' // Valor padrão para a altura
}: TransactionsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {/* 4. Adicionado um container com scroll para listas longas */}
      <CardContent className={`${maxHeight} overflow-y-auto pr-2`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operação</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            )}
            {history.map(tx => {
              const isCredit = tx.amount > 0;
              return (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* 5. Ícone de entrada ou saída para clareza imediata */}
                      <div className={`rounded-full p-1.5 ${isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isCredit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        {/* 6. Formatação de data mais limpa */}
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${isCredit ? 'text-green-700' : 'text-red-700'}`}>
                    {isCredit ? `+${tx.amount.toLocaleString('pt-BR')}` : tx.amount.toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}