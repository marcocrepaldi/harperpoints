import { db } from "./firebase";
import { addDoc, collection, Timestamp, getDocs, query, where } from "firebase/firestore";

export type PointType = "emit" | "transfer";

export type PointTx = {
  id?: string;
  type: PointType;
  from: string;
  to: string;
  amount: number;
  createdAt: Timestamp;
  description?: string;
  expiresAt?: Timestamp;
};

export async function emitPoints({
  from,
  to,
  amount,
  description,
}: {
  from: string;
  to: string;
  amount: number;
  description?: string;
}) {
  const doc: PointTx = {
    type: "emit",
    from,
    to,
    amount,
    createdAt: Timestamp.now(),
    description: description || "",
  };
  await addDoc(collection(db, "points"), doc);
}

export async function transferPoints({
  from,
  to,
  amount,
  description,
}: {
  from: string;
  to: string;
  amount: number;
  description?: string;
}) {
  const doc: PointTx = {
    type: "transfer",
    from,
    to,
    amount,
    createdAt: Timestamp.now(),
    description: description || "",
  };
  await addDoc(collection(db, "points"), doc);
}

export async function getUserPoints(uid: string): Promise<PointTx[]> {
  const q = query(collection(db, "points"), where("to", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PointTx[];
}
