
"use server";

import { randomUUID } from 'crypto';

interface GenerateTarpitConfigDetailsData {
  userId: string;
  name: string;
  description?: string;
}

interface TarpitConfigForClientWrite {
  userId: string;
  name: string;
  description: string;
  pathSegment: string;
  fullUrl: string;
  instanceId?: string;
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
    console.error('Error: NEXT_PUBLIC_TARPIT_BASE_URL is not set in .env');
    return {
      success: false,
      message: 'Server configuration error: Base URL not set.',
    };
  }

  const dockerApiEndpoint = process.env.DOCKER_PROVISIONING_API_ENDPOINT;
  const dockerApiKey = process.env.DOCKER_PROVISIONING_API_KEY;

  if (!dockerApiEndpoint || !dockerApiKey) {
    console.error('Error: Docker provisioning API endpoint or key not configured in .env. Endpoint:', dockerApiEndpoint);
    return {
      success: false,
      message: 'Server configuration error: Docker API details missing.',
    };
  }

  try {
    const pathSegment = randomUUID();
    const fullUrl = `${tarpitBaseUrl}/trap/${pathSegment}`;

    console.log(`Attempting to provision Docker instance via ${dockerApiEndpoint} for path: ${pathSegment}, user: ${userId}, name: ${name}`);
    const provisionResponse = await fetch(dockerApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dockerApiKey}`,
      },
      body: JSON.stringify({
        userId,
        name,
        description: description || '',
        pathSegment,
      }),
    });

    if (!provisionResponse.ok) {
      let errorMsg = `Failed to provision Docker instance via ${dockerApiEndpoint}. Status: ${provisionResponse.status}. URL: ${dockerApiEndpoint}`;
      let userFriendlyMessage = "Provisioning failed. Please try again.";

      if (provisionResponse.status === 409) { // Conflict
        userFriendlyMessage = "Failed to provision: A tarpit with this configuration might already exist or there was a conflict. Please try a slightly different name or try again later.";
      } else if (provisionResponse.status === 402 || provisionResponse.status === 403) { // Payment Required or Forbidden (likely due to limits/subscription)
        try {
          const errorData = await provisionResponse.json();
          userFriendlyMessage = errorData.message || (provisionResponse.status === 402 ? "Payment Required. Please check your subscription." : "Access Denied. Please check your plan limits.");
        } catch (jsonError) {
            userFriendlyMessage = provisionResponse.status === 402 ? "Payment Required. Please check your subscription." : "Access Denied. Please check your plan limits.";
        }
      } else {
         try {
            const errorData = await provisionResponse.json();
            errorMsg += ` - ${errorData.message || 'No additional error message from backend.'}`;
            if (errorData.message) {
                userFriendlyMessage = errorData.message;
            }
          } catch (jsonError) {
            const rawText = await provisionResponse.text().catch(() => 'Could not get raw text response.');
            errorMsg += ` - And failed to parse error response from backend. Raw response (approx): ${rawText.substring(0,200)}`;
          }
      }
      console.error(errorMsg);
      return { success: false, message: userFriendlyMessage };
    }

    const provisionData = await provisionResponse.json();
    console.log('Docker instance provisioned successfully by backend:', provisionData);

    const instanceIdFromBackend = provisionData.containerId || provisionData.containerName || provisionData.instanceId;

    if (!instanceIdFromBackend) {
        console.warn("Backend provisioning response did not include containerId, containerName, or instanceId. instanceId will be undefined in Firestore.");
    }

    const configDetails: TarpitConfigForClientWrite = {
      userId,
      name,
      description: description || '',
      pathSegment,
      fullUrl,
      instanceId: instanceIdFromBackend,
    };

    return {
      success: true,
      message: provisionData.message || 'Docker instance provisioned and configuration details generated!',
      configData: configDetails,
      fullUrl: fullUrl,
    };
  } catch (error) {
    console.error('Error in provisionAndGenerateManagedTarpitConfigDetails:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during provisioning.';
    return { success: false, message: `Provisioning failed: ${errorMessage}` };
  }
}

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
  const dockerApiKey = process.env.DOCKER_PROVISIONING_API_KEY;

  if (!deprovisionApiEndpoint || !dockerApiKey) {
    console.error('Error: Docker de-provisioning API endpoint or key not configured in .env. Endpoint:', deprovisionApiEndpoint);
    return {
      success: false,
      message: 'Server configuration error: Docker de-provisioning API details missing.',
    };
  }

  const containerIdentifierForBackend = instanceId || pathSegment;

  if (!containerIdentifierForBackend) {
    console.error('Deprovisioning error: Missing instanceId and pathSegment. Cannot identify container.');
    return {
      success: false,
      message: 'Missing identifier (instanceId or pathSegment) for de-provisioning.',
    };
  }

  try {
    console.log(`Attempting to de-provision Docker instance via ${deprovisionApiEndpoint}. Body:`, {
        containerName: containerIdentifierForBackend,
        instanceId: instanceId,
        pathSegment: pathSegment,
        userId: userId,
      }
    );
    const response = await fetch(deprovisionApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dockerApiKey}`,
      },
      body: JSON.stringify({
        containerName: containerIdentifierForBackend,
        instanceId: instanceId,
        pathSegment: pathSegment,
        userId: userId,
      }),
    });

    if (!response.ok) {
      let errorMsg = `Failed to de-provision Docker instance from ${deprovisionApiEndpoint}. Status: ${response.status}. URL: ${deprovisionApiEndpoint}`;
      let userFriendlyMessage = "De-provisioning failed. Please try again.";

      if (response.status === 404) {
        userFriendlyMessage = "De-provisioning failed: The tarpit instance was not found on the server. It might have already been removed.";
      }
      
      try {
        const errorData = await response.json();
        errorMsg += ` - ${errorData.message || 'No additional error message from backend.'}`;
        if (errorData.message && response.status !== 404) {
             userFriendlyMessage = errorData.message;
        }
      } catch (jsonError) {
        const rawText = await response.text().catch(() => 'Could not get raw text response.');
        errorMsg += ` - And failed to parse error response from backend. Raw response (approx): ${rawText.substring(0,200)}`;
      }
      console.error(errorMsg);
      return { success: false, message: userFriendlyMessage };
    }

    const responseData = await response.json();
    return {
      success: true,
      message: responseData.message || 'Docker instance de-provisioning initiated successfully.',
    };
  } catch (error) {
    console.error('Error in deprovisionTarpitInstance action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during de-provisioning.';
    return {
      success: false,
      message: `De-provisioning failed: ${errorMessage}`,
    };
  }
}

    