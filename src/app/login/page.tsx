"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/utils/firebase";
import LoginForm from "@/components/login-form";
// Poderíamos adicionar um componente de Spinner para um feedback visual melhor
// import { Spinner } from "@/components/ui/spinner"; 

/**
 * Mapeia códigos de erro do Firebase para mensagens amigáveis ao usuário.
 * Isso centraliza o tratamento de erros e facilita a adição de novas mensagens.
 * @param error - O objeto de erro retornado pelo Firebase.
 * @returns Uma string com a mensagem de erro para o usuário.
 */
const getFriendlyErrorMessage = (error: any): string => {
  // O código 'auth/invalid-credential' é o novo padrão do Firebase para senhas erradas,
  // emails não encontrados, etc.
  if (error?.code === "auth/invalid-credential") {
    return "E-mail ou senha inválidos. Por favor, verifique e tente novamente.";
  }
  // Um fallback para outros erros inesperados.
  return "Ocorreu um erro inesperado. Tente novamente mais tarde.";
};

export default function LoginPage() {
  // --- Hooks e Contexto ---
  const { currentUser, loading: isContextLoading } = useAppContext();
  const router = useRouter();

  // --- Estados do Componente ---
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Efeito de Redirecionamento ---
  // Se o usuário já estiver logado (contexto carregado e usuário existente),
  // ele é redirecionado para o dashboard.
  useEffect(() => {
    if (!isContextLoading && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, isContextLoading, router]);

  // --- Manipulador de Login ---
  async function handleLogin(email: string, password: string) {
    setIsFormLoading(true);
    setErrorMessage(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Sucesso! O redirecionamento será tratado pelo useEffect acima
      // quando o 'currentUser' do contexto for atualizado.
      // Isso desacopla a ação de login do redirecionamento.
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setErrorMessage(friendlyMessage);
    } finally {
      setIsFormLoading(false);
    }
  }

  // --- Renderização ---

  // 1. Exibe um loader enquanto o contexto verifica o estado de autenticação.
  // Isso previne um "flash" da tela de login para usuários já logados.
  if (isContextLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {/* <Spinner size="large" /> Substituir por um componente de loading visual */}
        <span className="text-lg text-muted-foreground">Verificando sessão...</span>
      </div>
    );
  }

  // 2. Renderiza o formulário de login se o usuário não estiver autenticado.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoginForm
        onLogin={handleLogin}
        loading={isFormLoading}
        error={errorMessage ?? undefined}
      />
    </div>
  );
}