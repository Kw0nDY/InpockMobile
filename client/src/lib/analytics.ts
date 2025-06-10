// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics for localhost development
export const initGA = () => {
  // Use demo measurement ID for localhost development
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-DEMO123456';

  console.log(`Initializing GA4 with ID: ${measurementId} for localhost development`);

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', {
      send_page_view: false, // We'll manually send page views
      debug_mode: true, // Enable debug mode for localhost
      custom_map: {
        'custom_dimension_1': 'user_defined_url'
      }
    });
  `;
  document.head.appendChild(script2);
};

// Track page views with custom URL parameter
export const trackPageView = (url: string, userDefinedUrl?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-DEMO123456';
  
  const eventData: any = {
    page_path: url,
    page_location: `${window.location.origin}${url}`
  };

  // Add custom dimension for user-defined URL if provided
  if (userDefinedUrl) {
    eventData.user_defined_url = userDefinedUrl;
    eventData.custom_dimension_1 = userDefinedUrl;
  }

  console.log('GA4 Page View:', { url, userDefinedUrl, eventData });

  window.gtag('config', measurementId, eventData);
  
  // Also send as a custom event for better tracking
  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: `${window.location.origin}${url}`,
    page_path: url,
    user_defined_url: userDefinedUrl || url,
    custom_dimension_1: userDefinedUrl || url
  });
};

// Track custom URL visits with enhanced parameters
export const trackCustomUrlVisit = (
  userDefinedUrl: string, 
  urlParameters?: Record<string, string>,
  userId?: string
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const eventData: any = {
    event_category: 'Custom URL Tracking',
    event_label: userDefinedUrl,
    user_defined_url: userDefinedUrl,
    custom_dimension_1: userDefinedUrl,
    value: 1
  };

  // Add URL parameters as custom dimensions
  if (urlParameters) {
    Object.entries(urlParameters).forEach(([key, value], index) => {
      eventData[`url_param_${key}`] = value;
      eventData[`custom_dimension_${index + 2}`] = `${key}:${value}`;
    });
  }

  // Add user ID if available
  if (userId) {
    eventData.user_id = userId;
  }

  console.log('GA4 Custom URL Visit:', eventData);

  window.gtag('event', 'custom_url_visit', eventData);
};

// Track events with custom dimensions
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number,
  customDimensions?: Record<string, string>
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const eventData: any = {
    event_category: category,
    event_label: label,
    value: value,
  };

  // Add custom dimensions
  if (customDimensions) {
    Object.assign(eventData, customDimensions);
  }

  console.log('GA4 Event:', { action, eventData });

  window.gtag('event', action, eventData);
};

// Enhanced URL tracking for SPA routing
export const trackUrlWithParameters = (
  baseUrl: string,
  parameters: Record<string, string>,
  userId?: string
) => {
  const urlWithParams = `${baseUrl}?${new URLSearchParams(parameters).toString()}`;
  
  // Track as both page view and custom event
  trackPageView(baseUrl, urlWithParams);
  trackCustomUrlVisit(urlWithParams, parameters, userId);
  
  return urlWithParams;
};

// Utility to extract URL parameters for tracking
export const extractUrlParameters = (url: string): Record<string, string> => {
  try {
    const urlObj = new URL(url, window.location.origin);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch (error) {
    console.warn('Failed to extract URL parameters:', error);
    return {};
  }
};

// Analytics data fetching utilities (for localhost development)
export const getAnalyticsData = async (userDefinedUrl?: string) => {
  // For localhost development, return mock data structure
  // In production, this would integrate with GA4 Reporting API
  
  console.log('Fetching analytics data for localhost development');
  
  const mockData = {
    totalVisits: Math.floor(Math.random() * 1000) + 100,
    uniqueVisitors: Math.floor(Math.random() * 500) + 50,
    customUrlVisits: userDefinedUrl ? Math.floor(Math.random() * 100) + 10 : 0,
    timeRange: '7d',
    lastUpdated: new Date().toISOString()
  };
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockData;
};

export interface UrlVisitData {
  url: string;
  visits: number;
  uniqueVisitors: number;
  lastVisit: string;
  parameters?: Record<string, string>;
}

// Get visit counts for multiple URLs (localhost development)
export const getUrlVisitCounts = async (urls: string[]): Promise<UrlVisitData[]> => {
  console.log('Fetching visit counts for URLs:', urls);
  
  // Mock data for localhost development
  const mockVisitData: UrlVisitData[] = urls.map(url => ({
    url,
    visits: Math.floor(Math.random() * 200) + 20,
    uniqueVisitors: Math.floor(Math.random() * 100) + 10,
    lastVisit: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    parameters: extractUrlParameters(url)
  }));
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return mockVisitData;
};