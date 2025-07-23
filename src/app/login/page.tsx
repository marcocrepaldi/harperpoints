"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { auth } from "@/utils/firebase";
import LoginForm from "@/components/login-form";

/**
 * Mapeia códigos de erro do Firebase para mensagens amigáveis.
 * @param error - O objeto de erro retornado pelo Firebase.
 * @returns Uma string com a mensagem de erro para o usuário.
 */
const getFriendlyErrorMessage = (error: unknown): string => {
  // Verifica se o erro é uma instância de AuthError do Firebase
  if (error instanceof Error && 'code' in error) {
    const firebaseError = error as AuthError;
    if (firebaseError.code === "auth/invalid-credential") {
      return "E-mail ou senha inválidos. Por favor, verifique e tente novamente.";
    }
  }
  // Mensagem genérica para outros tipos de erro
  return "Ocorreu um erro inesperado. Tente novamente mais tarde.";
};

export default function LoginPage() {
  const { currentUser, loading: isContextLoading } = useAppContext();
  const router = useRouter();

  const [isFormLoading, setIsFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Efeito para redirecionar o usuário se já estiver logado
  useEffect(() => {
    if (!isContextLoading && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, isContextLoading, router]);

  // Função de login memorizada com useCallback
  const handleLogin = useCallback(async (email: string, password: string) => {
    setIsFormLoading(true);
    setErrorMessage(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O redirecionamento será tratado pelo useEffect acima quando o currentUser mudar
    } catch (error: unknown) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setErrorMessage(friendlyMessage);
    } finally {
      setIsFormLoading(false);
    }
  }, []); // Nenhuma dependência, a função não precisa ser recriada

  // Renderiza um estado de carregamento enquanto o contexto é verificado
  if (isContextLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-lg text-muted-foreground">Verificando sessão...</span>
      </div>
    );
  }

  // Renderiza o formulário de login
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