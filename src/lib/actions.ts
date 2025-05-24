
"use server";

import { db } from '@/lib/firebase/clientApp';
import { serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { randomUUID } from 'crypto';

interface GenerateTarpitConfigDetailsData {
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
  instanceId?: string; // Optional: if your backend returns an ID for the Docker instance
  createdAt: any; // Will be serverTimestamp
  updatedAt?: any; // Will be serverTimestamp
  status: "active" | "inactive";
}

// This action now includes calling your backend Docker provisioning API
export async function provisionAndGenerateManagedTarpitConfigDetails(data: GenerateTarpitConfigDetailsData): Promise<{ 
  success: boolean; 
  message: string; 
  configData?: Omit<TarpitConfigForFirestore, 'status' | 'createdAt' | 'instanceId'> & { status: "active", instanceId?: string };
  fullUrl?: string 
}> {
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

  const dockerApiEndpoint = process.env.DOCKER_PROVISIONING_API_ENDPOINT;
  const dockerApiKey = process.env.DOCKER_PROVISIONING_API_KEY;

  if (!dockerApiEndpoint || !dockerApiKey) {
    console.error("Error: Docker provisioning API endpoint or key not configured in .env");
    return { success: false, message: "Server configuration error: Docker API details missing." };
  }

  try {
    const pathSegment = randomUUID();
    const fullUrl = `${tarpitBaseUrl}/trap/${pathSegment}`;

    // Step 1: Call your backend Docker provisioning API
    console.log(`Attempting to provision Docker instance for path: ${pathSegment}, user: ${userId}`);
    const provisionResponse = await fetch(dockerApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dockerApiKey}`,
      },
      body: JSON.stringify({
        userId,
        name,
        description: description || "",
        pathSegment, 
        // You might want to send other config details your backend needs
      }),
    });

    if (!provisionResponse.ok) {
      let errorMsg = `Failed to provision Docker instance. Status: ${provisionResponse.status}`;
      try {
        const errorData = await provisionResponse.json();
        errorMsg += ` - ${errorData.message || 'No additional error message from backend.'}`;
      } catch (jsonError) {
        errorMsg += ` - And failed to parse error response from backend.`;
      }
      console.error(errorMsg);
      return { success: false, message: errorMsg };
    }

    const provisionData = await provisionResponse.json();
    // Assuming your backend returns at least { success: true, instanceId: "...", ... }
    // And that it handles the reverse proxy setup for the fullUrl to point to the new container.

    console.log("Docker instance provisioned successfully by backend:", provisionData);

    // Step 2: Prepare data for Firestore write (which will happen client-side)
    const configDetails: Omit<TarpitConfigForFirestore, 'status' | 'createdAt' | 'instanceId'> & { status: "active", instanceId?: string } = {
      userId,
      name,
      description: description || "",
      pathSegment,
      fullUrl, // This URL should now be active via your reverse proxy
      instanceId: provisionData.instanceId, // Store instanceId if your backend provides it
      status: "active",
    };

    return { 
      success: true, 
      message: "Docker instance provisioned and configuration details generated!", 
      configData: configDetails, 
      fullUrl: fullUrl 
    };

  } catch (error) {
    console.error("Error in provisionAndGenerateManagedTarpitConfigDetails:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during provisioning.";
    return { success: false, message: `Provisioning failed: ${errorMessage}` };
  }
}


interface UpdateTarpitConfigData {
  docId: string;
  name: string;
  description?: string;
  userId: string; 
}

// updateManagedTarpitConfig and deleteManagedTarpitConfig are removed from here
// as CUD operations are now handled client-side in UrlList.tsx to ensure
// client's Firebase auth context is used for Firestore security rules.
// If you later need server-side logic for update/delete that also interacts
// with your Docker API (e.g., to de-provision), you would re-add them here.

// Kept original generateManagedTarpitConfigDetails for reference or if needed separately.
// It's now effectively replaced by provisionAndGenerateManagedTarpitConfigDetails for the form.
export async function generateManagedTarpitConfigDetails_Legacy(data: GenerateTarpitConfigDetailsData): Promise<{ success: boolean; message: string; configData?: Omit<TarpitConfigForFirestore, 'status' | 'createdAt'> & {status: "active"} , fullUrl?: string }> {
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
