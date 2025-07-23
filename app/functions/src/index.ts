import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const transferPoints = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado para realizar esta operação.");
  }

  const { receiverId, amount, description } = request.data;
  const senderId = request.auth.uid;

  if (!(typeof receiverId === "string" && receiverId.length > 0) || !(typeof amount === "number" && amount > 0)) {
    throw new HttpsError("invalid-argument", "Os dados enviados são inválidos.");
  }
  if (senderId === receiverId) {
    throw new HttpsError("invalid-argument", "Você não pode transferir pontos para si mesmo.");
  }

  const senderDocRef = db.collection("users").doc(senderId);
  const receiverDocRef = db.collection("users").doc(receiverId);
  let receiverName = "";

  try {
    await db.runTransaction(async (transaction) => {
      const senderDoc = await transaction.get(senderDocRef);
      const receiverDoc = await transaction.get(receiverDocRef);

      if (!senderDoc.exists || !receiverDoc.exists) {
        throw new HttpsError("not-found", "Usuário não encontrado.");
      }

      const senderData = senderDoc.data()!;
      const receiverData = receiverDoc.data()!;
      receiverName = receiverData.name;

      if ((senderData.totalPoints ?? 0) < amount) {
        throw new HttpsError("failed-precondition", "Saldo insuficiente.");
      }

      const quotaRemaining = senderData.distributableQuota?.remaining ?? 0;
      const pointsDeductedFromQuota = Math.min(amount, quotaRemaining);
      const senderUpdates = {
        totalPoints: senderData.totalPoints - amount,
        distributableQuota: {
          ...senderData.distributableQuota,
          remaining: quotaRemaining - pointsDeductedFromQuota,
        },
      };
      const receiverUpdates = {
        totalPoints: (receiverData.totalPoints ?? 0) + amount,
      };

      const timestamp = new Date().toISOString();
      const sentEntry = {
        userId: senderId, userName: senderData.name, amount: -amount,
        type: "sent", isQuota: false, date: timestamp,
        description: `Transferência para ${receiverData.name}. ${description || ""}`.trim(),
      };
      const receivedEntry = {
        userId: receiverId, userName: receiverData.name, amount: amount,
        type: "received", isQuota: false, date: timestamp,
        description: `Recebido de ${senderData.name}. ${description || ""}`.trim(),
      };
      
      transaction.update(senderDocRef, senderUpdates);
      transaction.update(receiverDocRef, receiverUpdates);
      transaction.set(db.collection("points").doc(), sentEntry);
      transaction.set(db.collection("points").doc(), receivedEntry);
    });

    return { success: true, message: `Pontos transferidos para ${receiverName} com sucesso!` };
  } catch (error: any) {
    logger.error("Erro na transação de pontos:", error);
    if (error instanceof HttpsError) {
      throw error;
    } else {
      throw new HttpsError("internal", "Ocorreu um erro interno ao transferir os pontos.");
    }
  }
});

// --- NOVA FUNÇÃO ADICIONADA ---
export const grantPoints = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }

  const callerUid = request.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  
  if (callerDoc.data()?.role !== "administrador") {
    throw new HttpsError("permission-denied", "Esta ação requer privilégios de administrador.");
  }

  const { userId, amount, description, isQuota } = request.data;
  if (!(typeof userId === "string" && userId.length > 0) || !(typeof amount === "number" && amount > 0)) {
    throw new HttpsError("invalid-argument", "Dados inválidos.");
  }

  const targetUserDocRef = db.collection("users").doc(userId);

  try {
    const targetUserDoc = await targetUserDocRef.get();
    if (!targetUserDoc.exists) {
      throw new HttpsError("not-found", "Usuário alvo não encontrado.");
    }
    const targetUserData = targetUserDoc.data()!;

    const userUpdates: { [key: string]: any } = {
      totalPoints: (targetUserData.totalPoints ?? 0) + amount,
    };

    if (isQuota) {
      userUpdates.distributableQuota = {
        total: amount,
        remaining: amount,
        expiresAt: new Date(new Date().getFullYear(), 11, 10).toISOString(),
      };
    }

    const newPointsEntry = {
      userId: userId,
      userName: targetUserData.name,
      amount: amount,
      type: "admin_grant",
      isQuota: isQuota,
      date: new Date().toISOString(),
      description: description || "Concessão de pontos pelo administrador.",
    };

    await targetUserDocRef.update(userUpdates);
    await db.collection("points").add(newPointsEntry);
    
    return { success: true, message: `Pontos concedidos para ${targetUserData.name}!` };

  } catch (error: any) {
    logger.error("Erro ao conceder pontos:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Ocorreu um erro interno ao conceder pontos.");
  }
});

// --- ADICIONE ESTA NOVA FUNÇÃO NO FINAL DO ARQUIVO ---
export const updateUserProfile = onCall({ region: "southamerica-east1" }, async (request) => {
  // 1. Segurança: Garante que o usuário está autenticado
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado para atualizar o perfil.");
  }

  // 2. Validação: Pega os dados enviados pelo app e o ID do usuário logado
  const { name } = request.data;
  const uid = request.auth.uid;

  // Garante que o nome é uma string válida e não vazia
  if (!(typeof name === "string" && name.trim().length > 0)) {
    throw new HttpsError("invalid-argument", "O nome fornecido é inválido.");
  }

  // 3. Lógica de Atualização
  const userDocRef = db.collection("users").doc(uid);

  try {
    // Atualiza apenas o campo 'name' no documento do usuário
    await userDocRef.update({
      name: name.trim(),
    });
    
    // 4. Retorno de Sucesso
    return { success: true, message: "Perfil atualizado com sucesso!" };

  } catch (error: any) {
    logger.error("Erro ao atualizar perfil:", error);
    throw new HttpsError("internal", "Ocorreu um erro ao salvar suas alterações.");
  }
});
// --- ADICIONE ESTA NOVA FUNÇÃO NO FINAL DO ARQUIVO ---
export const updateUserByAdmin = onCall({ region: "southamerica-east1" }, async (request) => {
  // 1. Segurança: Verifica se o usuário que está chamando a função é um administrador
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }
  
  const callerUid = request.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  
  if (callerDoc.data()?.role !== "administrador") {
    throw new HttpsError("permission-denied", "Esta ação requer privilégios de administrador.");
  }

  // 2. Validação dos Dados: Pega os dados enviados pelo app
  const { userId, name, role } = request.data;

  if (!(typeof userId === "string" && userId.length > 0) ||
      !(typeof name === "string" && name.trim().length > 0) ||
      !["administrador", "colaborador"].includes(role)) {
    throw new HttpsError("invalid-argument", "Os dados fornecidos são inválidos.");
  }

  // 3. Lógica de Atualização
  const targetUserDocRef = db.collection("users").doc(userId);

  try {
    // Atualiza os campos 'name' e 'role' no documento do usuário alvo
    await targetUserDocRef.update({
      name: name.trim(),
      role: role,
    });
    
    // 4. Retorno de Sucesso
    return { success: true, message: "Usuário atualizado com sucesso!" };

  } catch (error: any) {
    logger.error("Erro ao atualizar usuário pelo admin:", error);
    throw new HttpsError("internal", "Ocorreu um erro ao salvar as alterações do usuário.");
  }
});
export const registerUser = onCall({ region: "southamerica-east1" }, async (request) => {
  const { name, email, password } = request.data;

  // 1. Validação dos dados recebidos
  if (!(name && email && password)) {
    throw new HttpsError("invalid-argument", "Nome, e-mail e senha são obrigatórios.");
  }

  try {
    // 2. VERIFICAÇÃO DA WHITELIST
    const whitelistQuery = db.collection("whitelistedEmails").where("email", "==", email);
    const whitelistSnapshot = await whitelistQuery.get();

    if (whitelistSnapshot.empty) {
      // Se o e-mail não foi encontrado na lista, bloqueia o cadastro
      throw new HttpsError("permission-denied", "Este e-mail não está autorizado a se cadastrar.");
    }
    
    // 3. CRIA O USUÁRIO NA AUTENTICAÇÃO (usando o Admin SDK)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });
    
    // 4. CRIA O DOCUMENTO DO USUÁRIO NO FIRESTORE
    const userDocRef = db.collection("users").doc(userRecord.uid);
    await userDocRef.set({
      name: name,
      email: email,
      role: "colaborador",
      totalPoints: 0,
      distributableQuota: {
        total: 0,
        remaining: 0,
        expiresAt: null,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Retorno de Sucesso
    return { success: true, message: "Usuário cadastrado com sucesso!" };

  } catch (error: any) {
    logger.error("Erro no cadastro de usuário:", error);
    if (error instanceof HttpsError) {
      throw error; // Repassa erros específicos que já definimos
    }
    if (error.code === 'auth/email-already-exists') {
        throw new HttpsError("already-exists", "Este e-mail já está em uso.");
    }
    // Lança um erro genérico para outras falhas
    throw new HttpsError("internal", "Ocorreu um erro interno ao criar o usuário.");
  }
});