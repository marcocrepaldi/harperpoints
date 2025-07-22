"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query } from "firebase/firestore";
import { getApp } from "firebase/app"; 
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "@/utils/firebase";
import { toast } from "sonner";

// --- Tipos de Dados ---
export interface DistributableQuota {
  total: number;
  remaining: number;
  expiresAt: string | null;
}
export interface AppUser {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: "administrador" | "colaborador";
  totalPoints: number;
  distributableQuota: DistributableQuota;
}
export interface PointsData {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: "received" | "sent" | "admin_grant";
  isQuota: boolean;
  date: string;
  description: string;
}

// --- Interface do Contexto ---
interface AppContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  pointsHistory: PointsData[];
  isAdmin: boolean;
  loading: boolean;
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;
  grantPoints: (userId: string, amount: number, description: string, isQuota: boolean) => Promise<void>;
  transferPoints: (receiverId: string, amount: number, description: string) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  updateUserByAdmin: (userId: string, name: string, role: "administrador" | "colaborador") => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsData[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => currentUser?.role === 'administrador', [currentUser]);

  const refreshData = useCallback(async () => {
    try {
      const [usersSnapshot, pointsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "users"))),
        getDocs(query(collection(db, "points")))
      ]);

      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppUser[];
      const allPoints = pointsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PointsData[];

      setUsers(allUsers);
      setPointsHistory(allPoints);

      if (auth.currentUser) {
        const loggedInUser = allUsers.find(u => u.id === auth.currentUser!.uid) || null;
        setCurrentUser(loggedInUser);
      }
    } catch (error) {
      console.error("Erro ao buscar dados da aplicação:", error);
      toast.error("Não foi possível carregar os dados do sistema.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await refreshData();
      } else {
        setCurrentUser(null);
        setUsers([]);
        setPointsHistory([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [refreshData]);

  const logout = async (): Promise<void> => await signOut(auth);

  const grantPoints = async (userId: string, amount: number, description: string, isQuota: boolean): Promise<void> => {
    try {
      const app = getApp();
      const functions = getFunctions(app, 'southamerica-east1');
      const grantPointsCallable = httpsCallable(functions, 'grantPoints');
      
      toast.info("Processando concessão de pontos...");
      const result = await grantPointsCallable({ userId, amount, description, isQuota });
      const data = result.data as { success: boolean, message: string };

      if (data.success) {
        toast.success(data.message);
        await refreshData();
      }
    } catch (error: any) {
      console.error("Erro ao chamar a Cloud Function grantPoints:", error);
      toast.error(error.message || "Ocorreu um erro ao conceder os pontos.");
    }
  };

  const transferPoints = async (receiverId: string, amount: number, description: string): Promise<void> => {
    try {
      const app = getApp();
      const functions = getFunctions(app, 'southamerica-east1');
      const transferPointsCallable = httpsCallable(functions, 'transferPoints');
      
      toast.info("Processando transferência...");
      const result = await transferPointsCallable({ receiverId, amount, description });
      const data = result.data as { success: boolean, message: string };

      if (data.success) {
        toast.success(data.message);
        await refreshData();
      }
    } catch (error: any) {
      console.error("Erro ao chamar a Cloud Function transferPoints:", error);
      toast.error(error.message || "Ocorreu um erro na transferência.");
    }
  };
  
  const updateUserProfile = async (name: string): Promise<void> => {
    try {
        const app = getApp();
        const functions = getFunctions(app, 'southamerica-east1');
        const updateUserCallable = httpsCallable(functions, 'updateUserProfile');

        toast.info("Atualizando perfil...");
        const result = await updateUserCallable({ name });
        const data = result.data as { success: boolean, message: string };

        if (data.success) {
            toast.success(data.message);
            await refreshData();
        }
    } catch (error: any) {
        console.error("Erro ao chamar a Cloud Function updateUserProfile:", error);
        toast.error(error.message || "Ocorreu um erro ao atualizar o perfil.");
    }
  };
  
  const updateUserByAdmin = async (userId: string, name: string, role: "administrador" | "colaborador"): Promise<void> => {
    try {
      const app = getApp();
      const functions = getFunctions(app, 'southamerica-east1');
      const updateUserCallable = httpsCallable(functions, 'updateUserByAdmin');

      toast.info(`Atualizando perfil de ${name}...`);
      
      const result = await updateUserCallable({ userId, name, role });
      const data = result.data as { success: boolean, message: string };

      if (data.success) {
        toast.success(data.message);
        await refreshData();
      }
    } catch (error: any) {
      console.error("Erro ao chamar a Cloud Function updateUserByAdmin:", error);
      toast.error(error.message || "Ocorreu um erro ao atualizar o usuário.");
    }
  };

  const value = {
    currentUser, users, pointsHistory, isAdmin, loading,
    logout, grantPoints, transferPoints, updateUserProfile,
    refreshData, updateUserByAdmin,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext deve ser usado dentro de um AppProvider");
  }
  return context;
};