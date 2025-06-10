// Clear all analytics data to prevent automatic visitor increments
export const clearAllAnalyticsData = () => {
  try {
    localStorage.removeItem('localhost_analytics_data');
    console.log('Analytics data cleared');
  } catch (error) {
    console.warn('Failed to clear analytics data:', error);
  }
};

// Initialize clean analytics data structure
export const initCleanAnalytics = () => {
  const cleanData = {
    visits: {},
    users: [],
    sessions: [],
    lastUpdated: new Date().toISOString()
  };
  
  try {
    localStorage.setItem('localhost_analytics_data', JSON.stringify(cleanData));
    console.log('Clean analytics data initialized');
  } catch (error) {
    console.warn('Failed to initialize clean analytics:', error);
  }
};