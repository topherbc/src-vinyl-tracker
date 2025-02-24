/**
 * SRC Vinyl Tracker - Discogs OAuth Module
 * Handles OAuth authentication with Discogs
 */

const DiscogsOAuth = (() => {
    // Discogs OAuth configuration - these are application credentials, not user credentials
    // They should be set in config.js by the developer, not entered by the user
    const CONSUMER_KEY = typeof Config !== 'undefined' && Config.DISCOGS_CONSUMER_KEY ? 
        Config.DISCOGS_CONSUMER_KEY : 'YOUR_CONSUMER_KEY';
    const CALLBACK_URL = window.location.origin + window.location.pathname;
    
    // OAuth endpoints
    const AUTHORIZE_URL = 'https://www.discogs.com/oauth/authorize';
    
    // Storage keys
    const TOKEN_KEY = 'srcVinylTracker_discogsToken';
    const USERNAME_KEY = 'srcVinylTracker_discogsUsername';
    
    // State
    let accessToken = null;
    let username = null;
    
    /**
     * Start OAuth flow
     * In a real implementation, this would redirect to Discogs for authentication
     * For this demo, we'll simulate the process
     */
    const login = () => {
        // Generate a random state for security
        const state = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('srcVinylTracker_oauthState', state);
        
        // In a real implementation, we would:
        // 1. Get a request token from Discogs (server-side)
        // 2. Redirect to the authorization page
        
        // For this demo, we'll simulate the process
        console.log(`In a real implementation, we would redirect to: ${AUTHORIZE_URL}`);
        console.log('Using callback URL:', CALLBACK_URL);
        
        // Simulate the OAuth flow
        simulateOAuthFlow();
    };
    
    /**
     * Simulate OAuth flow for demo purposes
     * In a real implementation, this would be handled by the OAuth callback
     */
    const simulateOAuthFlow = () => {
        // Simulate a successful OAuth flow
        console.log('Simulating OAuth flow...');
        
        // Simulate getting user info and access token
        accessToken = 'simulated_access_token_' + Math.random().toString(36).substring(2, 10);
        username = 'discogs_user_' + Math.random().toString(36).substring(2, 5);
        
        // Save to localStorage
        saveTokens();
        
        // Sync to GitHub Gist if authenticated
        if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
            syncToGist();
        }
        
        // Show success message
        if (typeof UI !== 'undefined') {
            UI.showToast(`Successfully authenticated with Discogs as ${username}!`);
        }
        
        // Close the modal if it's open
        const modal = document.getElementById('api-credentials-modal');
        if (modal) {
            modal.close();
        }
        
        // Refresh the UI to show the authenticated state
        updateAuthUI();
    };
    
    /**
     * Handle OAuth callback
     */
    const handleCallback = () => {
        // Get the verifier from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const oauthVerifier = urlParams.get('oauth_verifier');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('srcVinylTracker_oauthState');
        
        // Verify state to prevent CSRF attacks
        if (state !== storedState) {
            console.error('OAuth state mismatch');
            return;
        }
        
        if (oauthVerifier) {
            // In a real implementation, we would exchange the verifier for an access token
            // For this demo, we'll simulate the process
            
            // Simulate getting an access token
            accessToken = 'simulated_access_token';
            accessTokenSecret = 'simulated_access_token_secret';
            
            // Save to localStorage
            saveTokens();
            
            // Sync to GitHub Gist if authenticated
            if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
                syncToGist();
            }
            
            // Redirect to the main page
            window.location.href = window.location.origin + window.location.pathname;
        }
    };
    
    /**
     * Save tokens to localStorage
     */
    const saveTokens = () => {
        const tokenData = {
            accessToken,
            username,
            timestamp: Date.now()
        };
        
        localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
        if (username) {
            localStorage.setItem(USERNAME_KEY, username);
        }
    };
    
    /**
     * Load tokens from localStorage
     */
    const loadTokens = () => {
        const tokenJson = localStorage.getItem(TOKEN_KEY);
        
        if (tokenJson) {
            try {
                const tokenData = JSON.parse(tokenJson);
                accessToken = tokenData.accessToken;
                username = tokenData.username || localStorage.getItem(USERNAME_KEY);
                return true;
            } catch (error) {
                console.error('Error parsing Discogs token data:', error);
                return false;
            }
        }
        
        return false;
    };
    
    /**
     * Sync tokens to GitHub Gist
     */
    const syncToGist = () => {
        if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
            // Get current gist data
            const gistId = localStorage.getItem('srcVinylTracker_gistId');
            const gistDataJson = localStorage.getItem(`srcVinylTracker_gistData_${gistId}`);
            
            if (gistDataJson) {
                try {
                    const gistData = JSON.parse(gistDataJson);
                    
                    // Update with OAuth tokens
                    gistData.discogsAuth = {
                        accessToken,
                        username,
                        timestamp: Date.now()
                    };
                    
                    // Save back to localStorage
                    localStorage.setItem(`srcVinylTracker_gistData_${gistId}`, JSON.stringify(gistData));
                    
                    console.log('Discogs OAuth tokens synced to Gist');
                } catch (error) {
                    console.error('Error syncing Discogs OAuth tokens to Gist:', error);
                }
            }
        }
    };
    
    /**
     * Load tokens from GitHub Gist
     */
    const loadFromGist = () => {
        if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
            // Get current gist data
            const gistId = localStorage.getItem('srcVinylTracker_gistId');
            const gistDataJson = localStorage.getItem(`srcVinylTracker_gistData_${gistId}`);
            
            if (gistDataJson) {
                try {
                    const gistData = JSON.parse(gistDataJson);
                    
                    // Check if OAuth tokens exist in gist data
                    if (gistData.discogsAuth) {
                        accessToken = gistData.discogsAuth.accessToken;
                        username = gistData.discogsAuth.username;
                        
                        // Save to localStorage
                        saveTokens();
                        
                        // Update UI
                        updateAuthUI();
                        
                        console.log('Discogs OAuth tokens loaded from Gist');
                        return true;
                    }
                } catch (error) {
                    console.error('Error loading Discogs OAuth tokens from Gist:', error);
                }
            }
        }
        
        return false;
    };
    
    /**
     * Check if authenticated with Discogs
     */
    const isAuthenticated = () => {
        return !!accessToken;
    };
    
    /**
     * Get authorization header for API requests
     */
    const getAuthHeader = () => {
        if (accessToken) {
            return `OAuth oauth_token="${accessToken}"`;
        }
        
        return null;
    };
    
    /**
     * Update the UI to reflect authentication state
     */
    const updateAuthUI = () => {
        // Update the OAuth button in the credentials modal if it exists
        const modal = document.getElementById('api-credentials-modal');
        if (modal) {
            const oauthButton = modal.querySelector('#discogs-oauth-button');
            const successText = modal.querySelector('.success-text');
            
            if (oauthButton) {
                if (isAuthenticated()) {
                    oauthButton.classList.add('success');
                    oauthButton.textContent = 'Connected with Discogs';
                    
                    // Add success text if it doesn't exist
                    if (!successText) {
                        const successElement = document.createElement('p');
                        successElement.className = 'success-text';
                        successElement.textContent = `✓ Successfully authenticated as ${username || 'Discogs User'}`;
                        oauthButton.parentNode.appendChild(successElement);
                    } else {
                        successText.textContent = `✓ Successfully authenticated as ${username || 'Discogs User'}`;
                        successText.style.display = 'block';
                    }
                    
                    // Hide the API key input section
                    const apiKeySection = modal.querySelector('.auth-option:nth-child(2)');
                    if (apiKeySection) {
                        apiKeySection.style.opacity = '0.5';
                    }
                } else {
                    oauthButton.classList.remove('success');
                    oauthButton.textContent = 'Log in with Discogs';
                    
                    // Hide success text if it exists
                    if (successText) {
                        successText.style.display = 'none';
                    }
                }
            }
        }
    };
    
    /**
     * Initialize the module
     */
    const init = () => {
        // Check if we're on the callback page
        if (window.location.search.includes('oauth_verifier')) {
            handleCallback();
            return;
        }
        
        // Try to load tokens from localStorage
        if (loadTokens()) {
            // Update UI if tokens were loaded
            updateAuthUI();
        } else {
            // If not in localStorage, try to load from Gist
            loadFromGist();
        }
    };
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        login,
        isAuthenticated,
        getAuthHeader,
        loadFromGist,
        updateAuthUI,
        getUsername: () => username
    };
})();
