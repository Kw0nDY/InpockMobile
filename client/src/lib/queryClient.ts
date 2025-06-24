import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const text = await res.text();
      errorMessage = text || res.statusText;
    } catch (parseError) {
      console.warn('Failed to parse error response:', parseError);
      errorMessage = res.statusText || `HTTP ${res.status}`;
    }
    
    // Enhanced error messages for common HTTP status codes
    switch (res.status) {
      case 401:
        throw new Error('401: Unauthorized - Please log in again');
      case 403:
        throw new Error('403: Forbidden - Access denied');
      case 404:
        throw new Error('404: Not Found - The requested resource was not found');
      case 422:
        throw new Error(`422: Validation Error - ${errorMessage}`);
      case 429:
        throw new Error('429: Too Many Requests - Please try again later');
      case 500:
        throw new Error('500: Server Error - Please try again or contact support');
      case 503:
        throw new Error('503: Service Unavailable - The server is temporarily down');
      default:
        throw new Error(`${res.status}: ${errorMessage}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Validate inputs
    if (!method || typeof method !== 'string') {
      throw new Error('Invalid HTTP method provided');
    }
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    
    // Prepare headers
    const headers: Record<string, string> = {};
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    // Prepare request body
    let body: string | undefined;
    if (data) {
      try {
        body = JSON.stringify(data);
      } catch (error) {
        throw new Error('Failed to serialize request data');
      }
    }
    
    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const res = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      body,
      credentials: "include",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    await throwIfResNotOk(res);
    return res;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out - Please check your connection and try again');
    }
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error - Please check your internet connection');
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Make queryClient globally accessible for real-time updates
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
}
