/**
 * EventConnect Extension Content Script
 * Minimal page detection for event-related sites
 */

// MVP: Just detect if we're on an event-planning related site
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Basic keyword detection in hostname
    const isEventSite = window.location.hostname.includes('venue') || 
                       window.location.hostname.includes('catering') ||
                       window.location.hostname.includes('wedding') ||
                       window.location.hostname.includes('event') ||
                       window.location.hostname.includes('party');
    
    // Store basic page context for future use
    chrome.storage.local.set({
      currentPageContext: {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        isEventRelated: isEventSite,
        timestamp: Date.now()
      }
    }).catch(error => {
      console.error('Failed to store page context:', error);
    });
    
    // Log detection for development
    if (isEventSite) {
      console.log('EventConnect: Event-related site detected');
    }
  } catch (error) {
    console.error('EventConnect content script error:', error);
  }
});
