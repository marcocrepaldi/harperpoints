// Arquivo: src/utils/auth.ts (versão final)

import { signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { auth } from "@/utils/firebase";

/**
 * Realiza o login de um usuário com e-mail e senha.
 */
export async function login(email: string, password: string) {
  if (!email || !password) {
    throw new Error("E-mail e senha são obrigatórios.");
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Chama a Cloud Function para registrar um novo usuário de forma segura,
 * com verificação de whitelist no backend.
 */
export async function register(name: string, email: string, password: string) {
  if (!name || !email || !password) {
    throw new Error("Todos os campos são obrigatórios.");
  }

  try {
    const app = getApp();
    // Aponta para a região correta das suas funções
    const functions = getFunctions(app, 'southamerica-east1');
    const registerUserCallable = httpsCallable(functions, 'registerUser');

    // Chama a função de backend com os dados do formulário
    await registerUserCallable({ name, email, password });

    // Após o cadastro bem-sucedido, faz o login automaticamente
    return await login(email, password);
    
  } catch (error: any) {
    // Repassa o erro da Cloud Function para ser exibido na tela
    throw error;
  }
}