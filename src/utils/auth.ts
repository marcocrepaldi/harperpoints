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
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Ocorreu um erro inesperado ao fazer login.");
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
    const functions = getFunctions(app, "southamerica-east1");
    const registerUserCallable = httpsCallable(functions, "registerUser");

    await registerUserCallable({ name, email, password });

    return await login(email, password);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Ocorreu um erro inesperado ao registrar o usuário.");
  }
}
