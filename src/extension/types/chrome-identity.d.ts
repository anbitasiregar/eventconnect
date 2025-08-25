// Add type definitions for Chrome Identity API
declare namespace chrome.identity {
    interface GetAuthTokenResult {
      token?: string;
    }
    
    interface GetAuthTokenDetails {
      interactive?: boolean;
      account?: chrome.identity.AccountInfo;
      scopes?: string[];
    }
    
    function getAuthToken(details: GetAuthTokenDetails): Promise<GetAuthTokenResult | string>;
    function removeCachedAuthToken(details: { token: string }): Promise<void>;
  }