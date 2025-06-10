// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Analytics for localhost development - No external GA4 needed
export const initGA = () => {
  console.log('Initializing localhost analytics tracking system');

  // Create a local analytics system instead of GA4
  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  // Mock gtag function for localhost development
  window.gtag = function(...args: any[]) {
    window.dataLayer.push(args);
    console.log('Analytics Event:', args);
  };

  console.log('Local analytics system ready for localhost development');
};

// Track page views with localhost URLs (does NOT count as URL visit)
export const trackPageView = (url: string, userDefinedUrl?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const trackingUrl = userDefinedUrl || url;
  const localhostUrl = `http://localhost:5000${trackingUrl}`;
  
  // DO NOT record visit automatically - only track page view for analytics
  // recordVisit should only be called when user explicitly clicks a tracked URL
  
  const eventData = {
    page_path: url,
    page_location: localhostUrl,
    user_defined_url: trackingUrl,
    localhost_url: localhostUrl
  };

  console.log('Localhost Page View:', { url, trackingUrl, eventData });

  window.gtag('event', 'page_view', eventData);
};

// Track custom URL visits with localhost parameters
export const trackCustomUrlVisit = (
  userDefinedUrl: string, 
  urlParameters?: Record<string, string>,
  userId?: string
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const localhostUrl = userDefinedUrl.startsWith('http') ? userDefinedUrl : `http://localhost:5000${userDefinedUrl}`;
  
  // Record the visit with parameters in local storage
  recordVisit(userDefinedUrl, userId, urlParameters);
  
  const eventData: any = {
    event_category: 'Localhost URL Tracking',
    event_label: userDefinedUrl,
    user_defined_url: userDefinedUrl,
    localhost_url: localhostUrl,
    value: 1
  };

  if (urlParameters) {
    eventData.url_parameters = urlParameters;
  }

  if (userId) {
    eventData.user_id = userId;
  }

  console.log('Localhost URL Visit:', eventData);

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

// Enhanced URL tracking for localhost SPA routing
export const trackUrlWithParameters = (
  baseUrl: string,
  parameters: Record<string, string>,
  userId?: string
) => {
  const urlWithParams = `${baseUrl}?${new URLSearchParams(parameters).toString()}`;
  const localhostUrl = `http://localhost:5000${urlWithParams}`;
  
  trackPageView(baseUrl, urlWithParams);
  trackCustomUrlVisit(urlWithParams, parameters, userId);
  
  return localhostUrl;
};

// Extract URL parameters for localhost tracking
export const extractUrlParameters = (url: string): Record<string, string> => {
  try {
    const urlObj = new URL(url, 'http://localhost:5000');
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

// Local storage for localhost analytics tracking
const ANALYTICS_KEY = 'localhost_analytics_data';

interface LocalAnalyticsData {
  visits: Record<string, number>;
  users: string[];
  sessions: Array<{
    url: string;
    timestamp: string;
    userId?: string;
    parameters?: Record<string, string>;
  }>;
  lastUpdated: string;
}

const getLocalAnalytics = (): LocalAnalyticsData => {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load analytics data:', error);
  }
  
  return {
    visits: {},
    users: [],
    sessions: [],
    lastUpdated: new Date().toISOString()
  };
};

const saveLocalAnalytics = (data: LocalAnalyticsData) => {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save analytics data:', error);
  }
};

export const recordVisit = (url: string, userId?: string, parameters?: Record<string, string>) => {
  const analytics = getLocalAnalytics();
  
  // Record visit count
  analytics.visits[url] = (analytics.visits[url] || 0) + 1;
  
  // Record unique user
  if (userId && !analytics.users.includes(userId)) {
    analytics.users.push(userId);
  }
  
  // Record session
  analytics.sessions.push({
    url,
    timestamp: new Date().toISOString(),
    userId,
    parameters
  });
  
  saveLocalAnalytics(analytics);
};

export const getAnalyticsData = async (userDefinedUrl?: string) => {
  const analytics = getLocalAnalytics();
  
  const totalVisits = Object.values(analytics.visits).reduce((sum, count) => sum + count, 0);
  const uniqueVisitors = analytics.users.length;
  const customUrlVisits = userDefinedUrl ? (analytics.visits[userDefinedUrl] || 0) : 0;
  
  return {
    totalVisits,
    uniqueVisitors,
    customUrlVisits,
    timeRange: 'localhost session',
    lastUpdated: analytics.lastUpdated
  };
};

export interface UrlVisitData {
  url: string;
  visits: number;
  uniqueVisitors: number;
  lastVisit: string;
  parameters?: Record<string, string>;
}

// Get visit counts for multiple URLs from local storage
export const getUrlVisitCounts = async (urls: string[]): Promise<UrlVisitData[]> => {
  const analytics = getLocalAnalytics();
  
  const visitData: UrlVisitData[] = urls.map(url => {
    const visits = analytics.visits[url] || 0;
    const userSessions = analytics.sessions.filter(session => session.url === url);
    const uniqueUsers = new Set(userSessions.map(session => session.userId).filter(Boolean));
    const lastVisit = userSessions.length > 0 
      ? userSessions[userSessions.length - 1].timestamp 
      : new Date().toISOString();
    
    return {
      url,
      visits,
      uniqueVisitors: uniqueUsers.size,
      lastVisit,
      parameters: extractUrlParameters(url)
    };
  });
  
  return visitData;
};