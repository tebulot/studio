
"use server";

import { randomUUID } from 'crypto';

// Interface for data passed to provisionAndGenerateManagedTarpitConfigDetails
interface GenerateTarpitConfigDetailsData {
  userId: string;
  name: string;
  description?: string;
}

// Interface for the data structure returned by provisionAndGenerateManagedTarpitConfigDetails
// This is what will be written to Firestore by the client
interface TarpitConfigForClientWrite {
  userId: string;
  name: string;
  description: string;
  pathSegment: string;
  fullUrl: string;
  instanceId?: string; // From Docker provisioning API response
}

export async function provisionAndGenerateManagedTarpitConfigDetails(
  data: GenerateTarpitConfigDetailsData
): Promise<{
  success: boolean;
  message: string;
  configData?: TarpitConfigForClientWrite;
  fullUrl?: string;
}> {
  const { userId, name, description } = data;

  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!name) {
    return { success: false, message: 'Tarpit Name is required.' };
  }

  const tarpitBaseUrl = process.env.NEXT_PUBLIC_TARPIT_BASE_URL;
  if (!tarpitBaseUrl) {
    console.error(
      'Error: NEXT_PUBLIC_TARPIT_BASE_URL is not set in .env'
    );
    return {
      success: false,
      message: 'Server configuration error: Base URL not set.',
    };
  }

  const dockerApiEndpoint = process.env.DOCKER_PROVISIONING_API_ENDPOINT;
  const dockerApiKey = process.env.DOCKER_PROVISIONING_API_KEY;

  if (!dockerApiEndpoint || !dockerApiKey) {
    console.error(
      'Error: Docker provisioning API endpoint or key not configured in .env. Endpoint:',
      dockerApiEndpoint
    );
    return {
      success: false,
      message: 'Server configuration error: Docker API details missing.',
    };
  }

  try {
    const pathSegment = randomUUID();
    const fullUrl = `${tarpitBaseUrl}/trap/${pathSegment}`; // Ensure /trap/ prefix or similar as needed

    // Call your backend Docker provisioning API
    console.log(
      `Attempting to provision Docker instance via ${dockerApiEndpoint} for path: ${pathSegment}, user: ${userId}, name: ${name}`
    );
    const provisionResponse = await fetch(dockerApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dockerApiKey}`, // Ensure your backend expects a Bearer token
      },
      body: JSON.stringify({
        userId, // Pass userId to backend
        name,
        description: description || '',
        pathSegment, // Pass pathSegment to backend for routing/config
      }),
    });

    if (!provisionResponse.ok) {
      let errorMsg = `Failed to provision Docker instance via ${dockerApiEndpoint}. Status: ${provisionResponse.status}`;
      try {
        const errorData = await provisionResponse.json();
        errorMsg += ` - ${
          errorData.message || 'No additional error message from backend.'
        }`;
      } catch (jsonError) {
        // If parsing fails, it's useful to see the raw text if available
        const rawText = await provisionResponse
          .text()
          .catch(() => 'Could not get raw text response.');
        errorMsg += ` - And failed to parse error response from backend. Raw response (approx): ${rawText.substring(
          0,
          200
        )}`;
      }
      console.error(errorMsg);
      return { success: false, message: errorMsg };
    }

    const provisionData = await provisionResponse.json(); // Assuming backend returns { success: true, instanceId: '...', ... }
    console.log(
      'Docker instance provisioned successfully by backend:',
      provisionData
    );

    // Prepare data for Firestore write on the client side
    const configDetails: TarpitConfigForClientWrite = {
      userId,
      name,
      description: description || '',
      pathSegment,
      fullUrl,
      instanceId: provisionData.instanceId, // Capture instanceId from backend response
    };

    return {
      success: true,
      message:
        'Docker instance provisioned and configuration details generated!',
      configData: configDetails,
      fullUrl: fullUrl,
    };
  } catch (error) {
    console.error(
      'Error in provisionAndGenerateManagedTarpitConfigDetails:',
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred during provisioning.';
    return { success: false, message: `Provisioning failed: ${errorMessage}` };
  }
}

// Interface for data passed to deprovisionTarpitInstance
interface DeprovisionTarpitData {
  instanceId?: string;
  pathSegment: string;
  userId: string;
}

export async function deprovisionTarpitInstance(
  data: DeprovisionTarpitData
): Promise<{ success: boolean; message: string }> {
  const { instanceId, pathSegment, userId } = data;

  const deprovisionApiEndpoint = process.env.DOCKER_DEPROVISIONING_API_ENDPOINT;
  const dockerApiKey = process.env.DOCKER_PROVISIONING_API_KEY; // Assuming same key for simplicity

  if (!deprovisionApiEndpoint || !dockerApiKey) {
    console.error(
      'Error: Docker de-provisioning API endpoint or key not configured in .env. Endpoint:',
      deprovisionApiEndpoint
    );
    return {
      success: false,
      message:
        'Server configuration error: Docker de-provisioning API details missing.',
    };
  }

  const containerName = instanceId || pathSegment;
  if (!containerName) {
    console.error('Deprovisioning error: Missing instanceId or pathSegment.');
    return {
      success: false,
      message: 'Missing instanceId or pathSegment for de-provisioning.',
    };
  }

  try {
    console.log(
      `Attempting to de-provision Docker instance via ${deprovisionApiEndpoint}. Identifier (containerName): ${containerName} for user: ${userId}`
    );
    const response = await fetch(deprovisionApiEndpoint, {
      method: 'POST', // Changed from DELETE to POST based on backend logs
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dockerApiKey}`,
      },
      body: JSON.stringify({
        containerName: containerName,
        instanceId: instanceId, // Still send original fields for backend flexibility
        pathSegment: pathSegment,
        userId: userId,
      }),
    });

    if (!response.ok) {
      let errorMsg = `Failed to de-provision Docker instance from ${deprovisionApiEndpoint}. Status: ${response.status}. URL: ${deprovisionApiEndpoint}`;
      try {
        const errorData = await response.json();
        errorMsg += ` - ${
          errorData.message || 'No additional error message from backend.'
        }`;
      } catch (jsonError) {
        const rawText = await response
          .text()
          .catch(() => 'Could not get raw text response.');
        errorMsg += ` - And failed to parse error response from backend. Raw response (approx): ${rawText.substring(
          0,
          200
        )}`;
      }
      console.error(errorMsg);
      return { success: false, message: errorMsg };
    }

    const responseData = await response.json();
    return {
      success: true,
      message:
        responseData.message ||
        'Docker instance de-provisioning initiated successfully.',
    };
  } catch (error) {
    console.error('Error in deprovisionTarpitInstance action:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred during de-provisioning.';
    return {
      success: false,
      message: `De-provisioning failed: ${errorMessage}`,
    };
  }
}
