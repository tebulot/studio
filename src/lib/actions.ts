
"use server";

import { db } from '@/lib/firebase/clientApp'; // Not ideal for server actions, but works for client-side SDK style
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { randomUUID } from 'crypto';

interface AddTarpitConfigData {
  userId: string;
  name: string;
  description?: string;
}

export async function addManagedTarpitConfig(data: AddTarpitConfigData): Promise<{ success: boolean; message: string, url?: string }> {
  const { userId, name, description } = data;

  if (!userId) {
    return { success: false, message: "User not authenticated." };
  }
  if (!name) {
    return { success: false, message: "Tarpit Name is required." };
  }

  const tarpitBaseUrl = process.env.NEXT_PUBLIC_TARPIT_BASE_URL;
  if (!tarpitBaseUrl) {
    console.error("Error: NEXT_PUBLIC_TARPIT_BASE_URL is not set in .env");
    return { success: false, message: "Server configuration error: Base URL not set." };
  }

  try {
    const pathSegment = randomUUID();
    const fullUrl = `${tarpitBaseUrl}/trap/${pathSegment}`;

    await addDoc(collection(db, "tarpit_configs"), {
      userId,
      name,
      description: description || "",
      pathSegment,
      fullUrl,
      createdAt: serverTimestamp(),
      status: "active",
    });

    return { success: true, message: "Managed URL added successfully!", url: fullUrl };
  } catch (error) {
    console.error("Error adding managed URL to Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to add managed URL: ${errorMessage}` };
  }
}
