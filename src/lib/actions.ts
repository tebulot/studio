
"use server";

import { db } from '@/lib/firebase/clientApp';
import { serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { randomUUID } from 'crypto';

interface AddTarpitConfigServerData {
  userId: string;
  name: string;
  description?: string;
}

interface TarpitConfigForFirestore {
  userId: string;
  name: string;
  description: string;
  pathSegment: string;
  fullUrl: string;
  createdAt: any; // Will be serverTimestamp
  updatedAt?: any; // Will be serverTimestamp
  status: "active" | "inactive";
}


export async function generateManagedTarpitConfigDetails(data: AddTarpitConfigServerData): Promise<{ success: boolean; message: string; configData?: Omit<TarpitConfigForFirestore, 'status' | 'createdAt'> & {status: "active"} , fullUrl?: string }> {
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

    const configDetails: Omit<TarpitConfigForFirestore, 'status' | 'createdAt'> & {status: "active"} = {
      userId,
      name,
      description: description || "",
      pathSegment,
      fullUrl,
      status: "active",
    };

    return { success: true, message: "Configuration details generated successfully!", configData: configDetails, fullUrl: fullUrl };
  } catch (error) {
    console.error("Error generating managed URL details:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to generate URL details: ${errorMessage}` };
  }
}

interface UpdateTarpitConfigData {
  docId: string;
  name: string;
  description?: string;
  userId: string; // For security validation if needed, though rules should primarily handle this
}

export async function updateManagedTarpitConfig(data: UpdateTarpitConfigData): Promise<{ success: boolean; message: string }> {
  const { docId, name, description, userId } = data;

  if (!docId) {
    return { success: false, message: "Document ID is required." };
  }
  if (!name) {
    return { success: false, message: "Tarpit Name is required." };
  }
  // Basic check, Firestore rules are the primary enforcer
  if (!userId) {
    return { success: false, message: "User ID is required for validation." };
  }

  try {
    const docRef = doc(db, "tarpit_configs", docId);
    // Potentially fetch doc first to ensure userId matches if not relying solely on rules for this server action's check
    await updateDoc(docRef, {
      name: name,
      description: description || "",
      updatedAt: serverTimestamp(),
    });
    return { success: true, message: "Managed URL updated successfully!" };
  } catch (error) {
    console.error("Error updating managed URL:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message: `Failed to update managed URL: ${errorMessage}` };
  }
}

interface DeleteTarpitConfigData {
  docId: string;
  userId: string; // For security validation if needed
}

export async function deleteManagedTarpitConfig(data: DeleteTarpitConfigData): Promise<{ success: boolean; message: string }> {
  const { docId, userId } = data;

  if (!docId) {
    return { success: false, message: "Document ID is required." };
  }
  // Basic check
  if (!userId) {
     return { success: false, message: "User ID is required for validation." };
  }

  try {
    const docRef = doc(db, "tarpit_configs", docId);
    // Potentially fetch doc first to ensure userId matches if not relying solely on rules for this server action's check
    await deleteDoc(docRef);
    return { success: true, message: "Managed URL deleted successfully!" };
  } catch (error) {
    console.error("Error deleting managed URL:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message: `Failed to delete managed URL: ${errorMessage}` };
  }
}
