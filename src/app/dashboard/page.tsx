"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { AppUser, PointsData } from "@/context/app-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Imports de UI ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// --- Função Auxiliar ---
const getInitials = (name: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.toUpperCase().slice(0, 2);
};

// --- Componente Principal ---
export default function DashboardPage() {
  const {
    currentUser, users, pointsHistory, isAdmin, loading, logout,
    grantPoints, transferPoints, updateUserByAdmin,
  } = useAppContext();
  const router = useRouter();

  // --- Estados ---
  const [selectedUserForAction, setSelectedUserForAction] = useState<string | null>(null);
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [isQuota, setIsQuota] = useState(false);
  const [isAddPointsDialogOpen, setIsAddPointsDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [historyModalUser, setHistoryModalUser] = useState<AppUser | null>(null);
  
  // Novos estados para o modal de edição
  const [editModalUser, setEditModalUser] = useState<AppUser | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedRole, setEditedRole] = useState<"administrador" | "colaborador">("colaborador");

  // --- Hooks e Handlers ---
  useEffect(() => {
    if (!loading && !currentUser) router.push("/");
  }, [currentUser, loading, router]);

  // Efeito para popular o formulário de edição quando um usuário é selecionado
  useEffect(() => {
    if (editModalUser) {
      setEditedName(editModalUser.name);
      setEditedRole(editModalUser.role);
    }
  }, [editModalUser]);

  const effectiveBalance = useMemo(() => {
    if (!currentUser) return 0;
    let balance = currentUser.totalPoints ?? 0;
    const quota = currentUser.distributableQuota;
    if (quota?.expiresAt && new Date() > new Date(quota.expiresAt)) {
      balance -= quota.remaining;
    }
    return balance;
  }, [currentUser]);
  
  const calculateEffectiveBalanceForUser = (user: AppUser): number => {
    let balance = user.totalPoints ?? 0;
    const quota = user.distributableQuota;
    if (quota?.expiresAt && new Date() > new Date(quota.expiresAt)) {
      balance -= quota.remaining;
    }
    return balance;
  };

  const handleGrantPoints = async () => {
    if (!selectedUserForAction || !pointsAmount || pointsAmount <= 0) {
      toast.error("Selecione um colaborador e uma quantidade de pontos válida.");
      return;
    }
    setIsLoadingAction(true);
    await grantPoints(selectedUserForAction, pointsAmount, description, isQuota);
    setIsLoadingAction(false);
    setIsAddPointsDialogOpen(false);
  };
  
  const handleTransferPoints = async () => {
    if (!selectedUserForAction || !pointsAmount || pointsAmount <= 0) {
      toast.error("Preencha todos os campos corretamente.");
      return;
    }
    if (effectiveBalance < pointsAmount) {
      toast.error("Saldo insuficiente para realizar a transferência.");
      return;
    }
    setIsLoadingAction(true);
    await transferPoints(selectedUserForAction, pointsAmount, description);
    setIsLoadingAction(false);
    setIsTransferDialogOpen(false);
  };

  const handleUpdateUser = async () => {
    if (!editModalUser) return;
    setIsLoadingAction(true);
    await updateUserByAdmin(editModalUser.id, editedName, editedRole);
    setIsLoadingAction(false);
    setEditModalUser(null);
  };

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-lg text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Harper Points</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.photoURL} alt={currentUser.name} />
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Meu Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {!isAdmin && currentUser.distributableQuota?.remaining > 0 && (
          <Card className="mb-6 border-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <p className="font-bold text-blue-800">Você tem uma Meta de Distribuição Ativa!</p>
              <p className="text-blue-700">Você ainda precisa distribuir <strong>{currentUser.distributableQuota.remaining}</strong> pontos.</p>
              {currentUser.distributableQuota.expiresAt && (<p className="mt-1 text-sm text-blue-600">Prazo final: <strong>{new Date(currentUser.distributableQuota.expiresAt).toLocaleDateString('pt-BR')}</strong>.</p>)}
            </CardContent>
          </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Meu Saldo</CardTitle>
              <p className="text-sm text-muted-foreground">Total de pontos disponíveis para uso.</p>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold tracking-tighter text-primary">{effectiveBalance.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          {isAdmin ? (
            <Dialog open={isAddPointsDialogOpen} onOpenChange={setIsAddPointsDialogOpen}>
              <DialogTrigger asChild><Button className="w-full">Adicionar Pontos a Colaborador</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Pontos</DialogTitle>
                  <DialogDescription>Conceda pontos a um colaborador.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Select onValueChange={setSelectedUserForAction}><SelectTrigger><SelectValue placeholder="Selecione um colaborador" /></SelectTrigger>
                    <SelectContent>{users.filter(u => u.id !== currentUser.id).map(u => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="Quantidade de pontos" onChange={e => setPointsAmount(Number(e.target.value))} min={1} />
                  <Input placeholder="Descrição (opcional)" onChange={e => setDescription(e.target.value)} />
                  <div className="flex items-center space-x-2"><Checkbox id="is-quota" checked={isQuota} onCheckedChange={(c) => setIsQuota(Boolean(c))}/><Label htmlFor="is-quota">Meta de distribuição obrigatória</Label></div>
                </div>
                <DialogFooter><Button onClick={handleGrantPoints} disabled={isLoadingAction}>{isLoadingAction ? 'Adicionando...' : 'Adicionar Pontos'}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
              <DialogTrigger asChild><Button className="w-full" disabled={effectiveBalance <= 0}>Transferir Pontos</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Transferir Pontos</DialogTitle>
                  <DialogDescription>Envie pontos para um colega como reconhecimento.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Select onValueChange={setSelectedUserForAction}><SelectTrigger><SelectValue placeholder="Selecione um colega" /></SelectTrigger>
                    <SelectContent>{users.filter(u => u.id !== currentUser.id).map(u => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="Quantidade" onChange={e => setPointsAmount(Number(e.target.value))} min={1} max={effectiveBalance}/>
                  <Input placeholder="Motivo da transferência (opcional)" onChange={e => setDescription(e.target.value)} />
                </div>
                <DialogFooter><Button onClick={handleTransferPoints} disabled={isLoadingAction}>{isLoadingAction ? 'Transferindo...' : 'Transferir'}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>Meu Histórico de Transações</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Operação</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pointsHistory.filter(tx => tx.userId === currentUser.id).length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="h-24 text-center text-muted-foreground">Nenhuma transação no seu histórico.</TableCell></TableRow>
                  ) : (
                    pointsHistory.filter(tx => tx.userId === currentUser.id).map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell><p className="font-medium">{tx.description}</p><p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleString('pt-BR')}</p></TableCell>
                        <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{tx.amount > 0 ? `+${tx.amount}` : tx.amount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-8">
          <Dialog open={!!historyModalUser} onOpenChange={(isOpen) => !isOpen && setHistoryModalUser(null)}>
            <DialogContent className="sm:max-w-6xl">{/* Conteúdo do Histórico */}</DialogContent>
          </Dialog>

          <Dialog open={!!editModalUser} onOpenChange={(isOpen) => !isOpen && setEditModalUser(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>Altere as informações do colaborador abaixo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nome completo</Label>
                  <Input id="edit-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Papel</Label>
                  <Select value={editedRole} onValueChange={(value) => setEditedRole(value as any)}>
                    <SelectTrigger id="edit-role"><SelectValue placeholder="Selecione um papel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colaborador">Colaborador</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditModalUser(null)}>Cancelar</Button>
                <Button onClick={handleUpdateUser} disabled={isLoadingAction}>{isLoadingAction ? "Salvando..." : "Salvar Alterações"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader><CardTitle>Visão Geral dos Colaboradores</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead className="w-[400px]">Colaborador</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead className="text-right w-[80px]">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.filter(u => u.id !== currentUser.id).map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={user.photoURL} alt={user.name} /><AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge>Ativo</Badge></TableCell>
                      <TableCell className="text-right font-mono">{calculateEffectiveBalanceForUser(user).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setHistoryModalUser(user)}>Ver Histórico</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setEditModalUser(user)}>Editar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}