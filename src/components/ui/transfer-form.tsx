"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/app-context";
import { db } from "@/utils/firebase";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type UserOption = {
  uid: string;
  email: string;
};

export function TransferForm({ saldo, onTransfer }: { saldo: number, onTransfer: () => void }) {
  const { user } = useAppContext();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      if (!user) return;
      const snap = await getDocs(collection(db, "users"));
      const opts: UserOption[] = [];
      snap.forEach(doc => {
        if (doc.id !== user.uid) { // não mostra ele mesmo
          const data = doc.data();
          opts.push({ uid: doc.id, email: data.email });
        }
      });
      setUsers(opts);
    }
    fetchUsers();
  }, [user]);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!user) return;
    if (!to || !amount) {
      setMsg("Selecione o colega e a quantidade de pontos.");
      return;
    }
    const pontos = Number(amount);
    if (isNaN(pontos) || pontos <= 0) {
      setMsg("Quantidade inválida.");
      return;
    }
    if (pontos > saldo) {
      setMsg("Saldo insuficiente.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "points"), {
        type: "transfer",
        from: user.uid,
        to,
        amount: pontos,
        createdAt: Timestamp.now(),
        description,
      });
      setMsg("Pontos enviados com sucesso!");
      setTo("");
      setAmount("");
      setDescription("");
      onTransfer?.(); // Para atualizar a lista
    } catch (e: any) {
      setMsg("Erro ao transferir pontos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4 mt-8" onSubmit={handleTransfer}>
      <div>
        <Label>Transferir para</Label>
        <Select value={to} onValueChange={setTo}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um colega" />
          </SelectTrigger>
          <SelectContent>
            {users.map(opt => (
              <SelectItem key={opt.uid} value={opt.uid}>
                {opt.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Quantidade de pontos</Label>
        <Input
          type="number"
          min={1}
          max={saldo}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
        />
        <div className="text-xs text-muted-foreground mt-1">
          Saldo disponível: {saldo}
        </div>
      </div>
      <div>
        <Label>Descrição (opcional)</Label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Motivo da transferência (opcional)"
          rows={2}
        />
      </div>
      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
      <Button type="submit" disabled={loading || !to || !amount || Number(amount) > saldo}>
        {loading ? "Enviando..." : "Transferir pontos"}
      </Button>
    </form>
  );
}
