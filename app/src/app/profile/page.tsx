"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/context/app-context";
import Link from "next/link";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/utils/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

// --- Imports de UI ---
import { Button } from "@/components/ui/button";
// 'CardFooter' foi removido da linha abaixo pois não estava em uso.
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";

// Função para obter as iniciais do nome
const getInitials = (name: string | undefined): string => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function ProfilePage() {
  const { currentUser, updateUserProfile, refreshData } = useAppContext();
  
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  // Função para atualizar o nome do perfil
  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !name.trim() || name.trim() === currentUser.name) return;

    setIsLoading(true);
    toast.info("Salvando alterações...");
    try {
      await updateUserProfile(name.trim());
    } catch (error) { // 'error' é usado aqui para depuração
      toast.error("Não foi possível salvar as alterações.");
      console.error("Erro ao atualizar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, name, updateUserProfile]);

  // Função para fazer o upload da foto
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setIsUploading(true);
    toast.info("Enviando nova foto...");

    try {
      const storage = getStorage();
      const photoRef = ref(storage, `profile-pictures/${currentUser.id}`);
      
      const uploadResult = await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(uploadResult.ref);
      
      const userDocRef = doc(db, "users", currentUser.id);
      await updateDoc(userDocRef, { photoURL });

      toast.success("Avatar atualizado com sucesso!");
      await refreshData();
    } catch (error) { // 'error' é usado aqui para depuração
      toast.error("Erro ao enviar a foto.");
      console.error("Erro no upload:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [currentUser, refreshData]);

  // Função para redefinir a senha
  const handlePasswordReset = useCallback(async () => {
    if (!currentUser?.email) return toast.error("E-mail não encontrado.");
    
    setIsSendingEmail(true);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast.success("E-mail de redefinição enviado!", { description: "Verifique sua caixa de entrada e spam." });
    } catch { // A variável 'error' foi removida aqui pois não estava em uso
      toast.error("Não foi possível enviar o e-mail.");
    } finally {
      setIsSendingEmail(false);
    }
  }, [currentUser?.email]);
  
  if (!currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-muted/40 p-4 pt-8 md:pt-12">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="size-4" /> Voltar para o Dashboard
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais aqui.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-24 w-24 cursor-pointer" onClick={() => !isUploading && fileInputRef.current?.click()}>
                  <AvatarImage src={currentUser.photoURL} alt={currentUser.name} />
                  <AvatarFallback className="text-3xl">{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
                <div className="pointer-events-none absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground">
                  <Camera className="size-4" />
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/png, image/jpeg" onChange={handlePhotoUpload} disabled={isUploading} />
              </div>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading || isUploading} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={currentUser.email} disabled />
              </div>
              <Button type="submit" disabled={isLoading || isUploading} className="w-full sm:w-auto">
                {isUploading ? "Enviando foto..." : isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Gerencie suas configurações de segurança.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handlePasswordReset} disabled={isSendingEmail}>
              {isSendingEmail ? "Enviando e-mail..." : "Alterar Senha"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}