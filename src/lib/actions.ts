
"use server";

import { db } from '@/lib/firebase/clientApp'; // db is still needed for serverTimestamp if we were to use it here.
import { serverTimestamp } from 'firebase/firestore'; // Keep for potential future use or if constructing complex objects
import { randomUUID } from 'crypto';

interface AddTarpitConfigServerData {
  userId: string;
  name: string;
  description?: string;
}

// Define the shape of the data returned by the action, which will be written to Firestore by the client
interface TarpitConfigForFirestore {
  userId: string;
  name: string;
  description: string;
  pathSegment: string;
  fullUrl: string;
  // createdAt will be handled client-side with serverTimestamp for consistency or by Firestore itself
  status: "active";
}


export async function generateManagedTarpitConfigDetails(data: AddTarpitConfigServerData): Promise<{ success: boolean; message: string; configData?: Omit<TarpitConfigForFirestore, 'status'> & {status: "active"} , fullUrl?: string }> {
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

    // Data to be returned to the client for Firestore write
    const configDetails: Omit<TarpitConfigForFirestore, 'status'> & {status: "active"} = {
      userId,
      name,
      description: description || "",
      pathSegment,
      fullUrl,
      status: "active", // Default status
    };

    return { success: true, message: "Configuration details generated successfully!", configData: configDetails, fullUrl: fullUrl };
  } catch (error) {
    console.error("Error generating managed URL details:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to generate URL details: ${errorMessage}` };
  }
}

