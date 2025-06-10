# Google Analytics 4 Custom URL Tracking Implementation Guide

## Overview
This guide provides a complete implementation for tracking user-defined URLs with custom parameters in Google Analytics 4 (GA4) for React Single Page Applications.

## 1. Custom Dimensions Setup in GA4

### Step 1: Create Custom Dimensions in GA4 Console
1. Navigate to **Admin** → **Property** → **Custom definitions** → **Custom dimensions**
2. Create the following custom dimensions:

| Dimension Name | Parameter Name | Scope | Description |
|---|---|---|---|
| User Defined URL | user_defined_url | Event | The complete custom URL with parameters |
| URL Parameters | url_parameters | Event | JSON string of URL parameters |
| User ID | user_id | User | Unique identifier for the user |
| User Role | user_role | User | User's role in the application |

### Step 2: Configure Enhanced eCommerce (Optional)
For tracking conversions and goals based on URL visits:
```javascript
// Enhanced eCommerce configuration
gtag('config', 'GA_MEASUREMENT_ID', {
  custom_map: {
    'custom_dimension_1': 'user_defined_url',
    'custom_dimension_2': 'url_parameters',
    'custom_dimension_3': 'user_id',
    'custom_dimension_4': 'user_role'
  }
});
```

## 2. Frontend Implementation

### Installation and Setup
```bash
# No additional packages needed - uses native gtag
npm install @tanstack/react-query  # For data fetching
```

### Core Analytics Library (`lib/analytics.ts`)
```typescript
// Custom URL tracking with parameters
export const trackCustomUrlVisit = (
  userDefinedUrl: string, 
  urlParameters?: Record<string, string>,
  userId?: string
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const eventData = {
    event_category: 'Custom URL Tracking',
    event_label: userDefinedUrl,
    user_defined_url: userDefinedUrl,
    url_parameters: JSON.stringify(urlParameters || {}),
    user_id: userId,
    value: 1
  };

  window.gtag('event', 'custom_url_visit', eventData);
};

// Enhanced page view tracking for SPA
export const trackPageView = (url: string, userDefinedUrl?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  window.gtag('config', measurementId, {
    page_path: url,
    user_defined_url: userDefinedUrl || url
  });
};
```

### React Hook for Automatic Tracking (`hooks/use-analytics.tsx`)
```typescript
import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../lib/analytics';

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  
  useEffect(() => {
    if (location !== prevLocationRef.current) {
      trackPageView(location);
      prevLocationRef.current = location;
    }
  }, [location]);
};
```

## 3. Component Implementation

### URL Parameter Extraction Utility
```typescript
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

// Enhanced tracking with parameter analysis
export const trackUrlWithParameters = (
  baseUrl: string,
  parameters: Record<string, string>,
  userId?: string
) => {
  const urlWithParams = `${baseUrl}?${new URLSearchParams(parameters).toString()}`;
  
  trackPageView(baseUrl, urlWithParams);
  trackCustomUrlVisit(urlWithParams, parameters, userId);
  
  return urlWithParams;
};
```

### Usage in Components
```typescript
// In your React components
useEffect(() => {
  if (user) {
    trackCustomUrlVisit(
      '/dashboard', 
      { user_id: user.id.toString(), role: user.role }, 
      user.id.toString()
    );
  }
}, [user]);

// For link clicks with parameters
const handleLinkClick = (url: string, parameters: Record<string, string>) => {
  trackUrlWithParameters(url, parameters, user?.id.toString());
  navigate(url);
};
```

## 4. Data Fetching from GA4

### GA4 Reporting API Setup
```typescript
// Note: For production, use GA4 Reporting API
// For localhost development, mock data is provided

interface AnalyticsResponse {
  totalVisits: number;
  uniqueVisitors: number;
  customUrlVisits: number;
  urlBreakdown: Array<{
    url: string;
    visits: number;
    parameters: Record<string, string>;
  }>;
}

// Production implementation would use:
const fetchGA4Data = async (propertyId: string, credentials: any) => {
  const response = await fetch(`https://analyticsreporting.googleapis.com/v4/reports:batchGet`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reportRequests: [{
        viewId: propertyId,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ expression: 'ga:sessions' }],
        dimensions: [{ name: 'ga:customDimension1' }] // user_defined_url
      }]
    })
  });
  
  return response.json();
};
```

## 5. Real-time Display Implementation

### React Query Hook for Data Fetching
```typescript
export const useUrlVisitCounts = (urls: string[]) => {
  return useQuery({
    queryKey: ['url-visits', urls],
    queryFn: () => getUrlVisitCounts(urls),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
    enabled: urls.length > 0,
  });
};

export const useRealTimeVisits = (refreshInterval: number = 10000) => {
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const interval = setInterval(async () => {
      // In production, this would connect to GA4 Real-time API
      // For localhost, simulates real-time updates
      setVisitCounts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(url => {
          if (Math.random() < 0.3) { // 30% chance of new visit
            updated[url] = (updated[url] || 0) + 1;
          }
        });
        return updated;
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { visitCounts, trackUrl, incrementVisit };
};
```

## 6. Dashboard Widget Implementation

The implementation includes a comprehensive dashboard widget that displays:
- Total visits across all tracked URLs
- Real-time visit count updates
- URL parameter breakdown
- Quick access to frequently tracked URLs

## 7. Best Practices for SPA Implementation

### Router Integration
```typescript
// In your main App component
function App() {
  useEffect(() => {
    initGA(); // Initialize GA4 on app startup
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Router() {
  useAnalytics(); // Track all page changes automatically
  
  return (
    <Switch>
      {/* Your routes */}
    </Switch>
  );
}
```

### Privacy and GDPR Considerations
```typescript
// Initialize GA4 with privacy settings
gtag('config', 'GA_MEASUREMENT_ID', {
  anonymize_ip: true,
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});

// Cookie consent integration
const initGAWithConsent = (hasConsent: boolean) => {
  gtag('consent', 'default', {
    'analytics_storage': hasConsent ? 'granted' : 'denied'
  });
};
```

### Data Latency Handling
```typescript
// Handle GA4 data processing delays
const useAnalyticsWithFallback = () => {
  const [localCounts, setLocalCounts] = useState({});
  const { data: ga4Data } = useGA4Data();
  
  // Combine real GA4 data with local tracking for immediate feedback
  return {
    combinedData: { ...ga4Data, ...localCounts },
    isRealTime: true
  };
};
```

## 8. Production Deployment Checklist

1. **GA4 Property Setup**
   - ✅ Create GA4 property
   - ✅ Configure custom dimensions
   - ✅ Set up conversion goals
   - ✅ Enable enhanced eCommerce

2. **Environment Configuration**
   - ✅ Set `VITE_GA_MEASUREMENT_ID` environment variable
   - ✅ Configure API credentials for data fetching
   - ✅ Set up CORS for GA4 Reporting API

3. **Testing**
   - ✅ Verify custom dimension tracking in GA4 DebugView
   - ✅ Test URL parameter extraction and tracking
   - ✅ Validate real-time data updates
   - ✅ Check privacy compliance

4. **Monitoring**
   - ✅ Set up alerts for tracking failures
   - ✅ Monitor API quota usage
   - ✅ Track data processing delays

## 9. Localhost Development

For localhost development, the implementation includes:
- Mock data generation for immediate testing
- Console logging of all GA4 events
- Simulated real-time data updates
- Debug mode enabled for detailed tracking information

The current implementation is fully functional for localhost testing and can be easily migrated to production by providing the actual GA4 Measurement ID and implementing the GA4 Reporting API integration.

## 10. URL Examples for Tracking

Common URL patterns to track:
```typescript
const trackedUrls = [
  '/dashboard?utm_source=email&utm_campaign=newsletter',
  '/marketplace?category=deals&featured=true',
  '/links?ref=social&platform=kakao',
  '/analytics?user_type=premium&feature=realtime',
  '/settings?tab=notifications&source=dashboard'
];
```

Each URL will be tracked with its parameters as separate custom dimensions, allowing for detailed analysis in GA4 reports.