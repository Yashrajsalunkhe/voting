import { apiRequest } from '@/lib/queryClient';

/**
 * Helper function for Admin API calls that returns parsed JSON instead of Response
 */
export async function adminApiRequest<T>(
  method: string,
  url: string,
  data?: unknown | undefined,
  adminKey?: string
): Promise<T> {
  const headers: Record<string, string> = {};
  
  // Use relative URLs with Vite's proxy
  const fullUrl = url;
  
  if (adminKey) {
    headers['X-Admin-Key'] = adminKey;
  }
  
  try {
    const response = await apiRequest(method, fullUrl, data, headers);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error("Server returned non-JSON response:", text);
      throw new Error("Server returned an invalid response. Expected JSON but got: " + 
        (text.length > 100 ? text.substring(0, 100) + '...' : text));
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error("Admin API request failed:", error);
    throw error;
  }
}
