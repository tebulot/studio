
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
  instanceId?: string; 
  createdAt: any; 
  updatedAt?: any; 
  status: "active" | "inactive";
}

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

    console.log(`Attempting to provision Docker instance for path: ${pathSegment}, user: ${userId}, name: ${name}`);
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
    console.log("Docker instance provisioned successfully by backend:", provisionData);

    const configDetails: Omit<TarpitConfigForFirestore, 'status' | 'createdAt' | 'instanceId'> & { status: "active", instanceId?: string } = {
      userId,
      name,
      description: description || "",
      pathSegment,
      fullUrl, 
      instanceId: provisionData.instanceId, 
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


interface DeprovisionTarpitData {
  instanceId?: string;
  pathSegment: string;
  userId: string;
}

export async function deprovisionTarpitInstance(data: DeprovisionTarpitData): Promise<{ success: boolean; message: string }> {
  const { instanceId, pathSegment, userId } = data;

  const deprovisionApiEndpoint = process.env.DOCKER_DEPROVISIONING_API_ENDPOINT;
  const dockerApiKey = process.env.DOCKER_PROVISIONING_API_KEY;

  if (!deprovisionApiEndpoint || !dockerApiKey) {
    console.error("Error: Docker de-provisioning API endpoint or key not configured in .env");
    return { success: false, message: "Server configuration error: Docker de-provisioning API details missing." };
  }

  // Your backend might require instanceId, pathSegment, or userId for identification/authorization
  const identifier = instanceId || pathSegment; 
  if (!identifier) {
    return { success: false, message: "Missing instanceId or pathSegment for de-provisioning." };
  }

  try {
    console.log(`Attempting to de-provision Docker instance: ${identifier} for user: ${userId}`);
    const response = await fetch(deprovisionApiEndpoint, { // Use the specific deprovisioning endpoint
      method: 'DELETE', // Or 'POST', depending on your API design
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dockerApiKey}`,
      },
      // Send the identifier that your backend expects.
      // If method is DELETE, you might send it as a query param or in the path if your API is designed that way.
      // For now, assuming body for POST/DELETE.
      body: JSON.stringify({ 
        instanceId: instanceId, // Send instanceId if available
        pathSegment: pathSegment, // Always send pathSegment as a fallback or additional identifier
        userId: userId // Good for backend to verify ownership or log
      }),
    });

    if (!response.ok) {
      let errorMsg = `Failed to de-provision Docker instance. Status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg += ` - ${errorData.message || 'No additional error message from backend.'}`;
      } catch (jsonError) {
        errorMsg += ` - And failed to parse error response from backend.`;
      }
      console.error(errorMsg);
      return { success: false, message: errorMsg };
    }

    // const responseData = await response.json(); // if your backend returns a body on DELETE success
    // console.log("Docker instance de-provisioned successfully by backend:", responseData);
    return { success: true, message: "Docker instance de-provisioned successfully." };

  } catch (error) {
    console.error("Error in deprovisionTarpitInstance action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during de-provisioning.";
    return { success: false, message: `De-provisioning failed: ${errorMessage}` };
  }
}
