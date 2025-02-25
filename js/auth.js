/**
 * SRC Vinyl Tracker - Authentication Module
 * Handles GitHub OAuth authentication and Gist storage
 */

const Auth = (() => {
    // GitHub OAuth configuration
    const GITHUB_CLIENT_ID = 'Ov23liIXunXN3Fu1LHlf'; // You'll need to create a GitHub OAuth app and add your client ID here
    const GITHUB_REDIRECT_URI = window.location.origin + window.location.pathname;
    const GITHUB_SCOPE = 'gist';
    const GITHUB_API_URL = 'https://api.github.com';
    
    // Storage keys
    const TOKEN_KEY = 'srcVinylTracker_githubToken';
    const USER_KEY = 'srcVinylTracker_githubUser';
    const GIST_ID_KEY = 'srcVinylTracker_gistId';
    const PKCE_VERIFIER_KEY = 'srcVinylTracker_pkceVerifier';
    const OAUTH_STATE_KEY = 'srcVinylTracker_oauthState';
    const PLAY_HISTORY_KEY = 'srcVinylTracker_playHistory';
    const CARTRIDGE_STATS_KEY = 'srcVinylTracker_cartridgeStats';
    
    // State
    let isAuthenticated = false;
    let githubToken = '';
    let githubUser = null;
    let gistId = '';
    
    /**
     * Generate a random string for PKCE and state parameters
     * @param {Number} length - Length of the random string
     * @returns {String} - Random string
     */
    const generateRandomString = (length = 32) => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let text = '';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };
    
    /**
     * Generate a code challenge from a code verifier (for PKCE)
     * @param {String} codeVerifier - Code verifier
     * @returns {Promise<String>} - Code challenge
     */
    const generateCodeChallenge = async (codeVerifier) => {
        // Convert the code verifier to a Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        
        // Hash the code verifier using SHA-256
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        
        // Convert the hash to base64-url format
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    };
    
    /**
     * Encrypt sensitive data before storing
     * @param {String} data - Data to encrypt
     * @returns {String} - Encrypted data
     */
    const encryptData = (data) => {
        // Simple encryption for demo purposes
        // In a production app, use a more secure encryption method
        return btoa(data);
    };
    
    /**
     * Decrypt sensitive data after retrieving
     * @param {String} encryptedData - Encrypted data
     * @returns {String} - Decrypted data
     */
    const decryptData = (encryptedData) => {
        // Simple decryption for demo purposes
        try {
            return atob(encryptedData);
        } catch (error) {
            console.error('Error decrypting data:', error);
            return '';
        }
    };
    
    /**
     * Initialize authentication
     * Check if user is already logged in
     */
    const init = () => {
        // Check for GitHub auth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
            // Verify state to prevent CSRF attacks
            const storedState = localStorage.getItem(OAUTH_STATE_KEY);
            
            if (state !== storedState) {
                console.error('OAuth state mismatch');
                UI.showToast('Authentication failed: Invalid state parameter');
                return;
            }
            
            // Remove code and state from URL to prevent sharing
            const newUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);
            
            // Exchange code for token
            exchangeCodeForToken(code);
            return;
        }
        
        // Check if already authenticated
        const encryptedToken = localStorage.getItem(TOKEN_KEY);
        if (encryptedToken) {
            githubToken = decryptData(encryptedToken);
        }
        
        const userJson = localStorage.getItem(USER_KEY);
        gistId = localStorage.getItem(GIST_ID_KEY);
        
        if (githubToken && userJson) {
            try {
                githubUser = JSON.parse(userJson);
                isAuthenticated = true;
                
                // Update UI
                updateAuthUI();
                
                // Sync data if we have a gist ID
                if (gistId) {
                    syncFromGist();
                }
            } catch (error) {
                console.error('Error parsing GitHub user data:', error);
                logout(); // Clear invalid data
            }
        }
    };
    
    /**
     * Start GitHub OAuth flow with PKCE
     */
    const login = async () => {
        if (!GITHUB_CLIENT_ID) {
            UI.showToast('GitHub Client ID not configured. Please set up a GitHub OAuth app.');
            return;
        }
        
        try {
            // Generate PKCE code verifier and challenge
            const codeVerifier = generateRandomString(64);
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            
            // Store code verifier for later use
            localStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
            
            // Generate random state for security
            const state = generateRandomString(32);
            localStorage.setItem(OAUTH_STATE_KEY, state);
            
            // Redirect to GitHub OAuth with PKCE
            const authUrl = new URL('https://github.com/login/oauth/authorize');
            authUrl.searchParams.append('client_id', GITHUB_CLIENT_ID);
            authUrl.searchParams.append('redirect_uri', GITHUB_REDIRECT_URI);
            authUrl.searchParams.append('scope', GITHUB_SCOPE);
            authUrl.searchParams.append('state', state);
            authUrl.searchParams.append('code_challenge', codeChallenge);
            authUrl.searchParams.append('code_challenge_method', 'S256');
            
            window.location.href = authUrl.toString();
        } catch (error) {
            console.error('Error starting OAuth flow:', error);
            UI.showToast('Error starting authentication: ' + error.message);
        }
    };
    
    /**
     * Exchange OAuth code for token using CORS proxy
     * @param {String} code - OAuth code from GitHub
     */
    const exchangeCodeForToken = async (code) => {
        try {
            // Get the code verifier from localStorage
            const codeVerifier = localStorage.getItem(PKCE_VERIFIER_KEY);
            if (!codeVerifier) {
                throw new Error('Code verifier not found');
            }
            
            // Clear the code verifier from localStorage
            localStorage.removeItem(PKCE_VERIFIER_KEY);
            localStorage.removeItem(OAUTH_STATE_KEY);
            
            // Use a CORS proxy to exchange the code for a token
            // For GitHub Pages deployment, we'll use a public CORS proxy service
            // In a production app, you would use your own server or a more secure proxy
            const tokenUrl = 'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token';
            
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    code: code,
                    redirect_uri: GITHUB_REDIRECT_URI,
                    code_verifier: codeVerifier
                })
            });
            
            if (!response.ok) {
                throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(`Token exchange error: ${data.error_description || data.error}`);
            }
            
            if (!data.access_token) {
                throw new Error('No access token received');
            }
            
            // Save token (encrypted)
            githubToken = data.access_token;
            localStorage.setItem(TOKEN_KEY, encryptData(githubToken));
            
            // Get user info
            await fetchUserInfo();
            
            // Check if user has a gist for this app
            await findOrCreateGist();
            
            // Update UI
            isAuthenticated = true;
            updateAuthUI();
            
            // Sync data
            await syncFromGist();
            
            // Show success message
            UI.showToast('Successfully logged in with GitHub!');
            
            // Check if Discogs authentication is needed
            if (typeof DiscogsAuth !== 'undefined' && !DiscogsAuth.isAuthenticated()) {
                // If not authenticated with Discogs, prompt the user
                App.promptForDiscogsAuth();
            }
        } catch (error) {
            console.error('Error exchanging code for token:', error);
            UI.showToast('Authentication failed: ' + error.message);
        }
    };
    
    /**
     * Fetch GitHub user info using the access token
     */
    const fetchUserInfo = async () => {
        try {
            const response = await fetch(`${GITHUB_API_URL}/user`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
            }
            
            githubUser = await response.json();
            localStorage.setItem(USER_KEY, JSON.stringify(githubUser));
            
            console.log('Fetched GitHub user info:', githubUser.login);
        } catch (error) {
            console.error('Error fetching GitHub user info:', error);
            throw error;
        }
    };
    
    /**
     * Find existing gist or create a new one
     */
    const findOrCreateGist = async () => {
        if (!githubUser || !githubUser.login) {
            throw new Error('User info not available');
        }
        
        try {
            // First, search for existing gists with our app's identifier
            const gistDescription = 'SRC Vinyl Tracker Data';
            let existingGist = null;
            
            // Fetch user's gists
            const response = await fetch(`${GITHUB_API_URL}/users/${githubUser.login}/gists`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch gists: ${response.status} ${response.statusText}`);
            }
            
            const gists = await response.json();
            
            // Look for a gist with our description
            existingGist = gists.find(gist => gist.description === gistDescription);
            
            if (existingGist) {
                // Use the existing gist
                gistId = existingGist.id;
                localStorage.setItem(GIST_ID_KEY, gistId);
                console.log('Found existing gist:', gistId);
            } else {
                // Create a new gist
                const createResponse = await fetch(`${GITHUB_API_URL}/gists`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        description: gistDescription,
                        public: false,
                        files: {
                            'vinyl-tracker-data.json': {
                                content: JSON.stringify({
                                    playHistory: [],
                                    stats: { totalPlays: 0 },
                                    lastSync: new Date().toISOString()
                                })
                            }
                        }
                    })
                });
                
                if (!createResponse.ok) {
                    throw new Error(`Failed to create gist: ${createResponse.status} ${createResponse.statusText}`);
                }
                
                const newGist = await createResponse.json();
                gistId = newGist.id;
                localStorage.setItem(GIST_ID_KEY, gistId);
                console.log('Created new gist:', gistId);
            }
        } catch (error) {
            console.error('Error finding/creating gist:', error);
            throw error;
        }
    };
    
    /**
     * Logout user
     */
    const logout = () => {
        // Clear auth data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        
        // Keep gist ID for future logins
        
        // Reset state
        isAuthenticated = false;
        githubToken = '';
        githubUser = null;
        
        // Update UI
        updateAuthUI();
        
        // Show message
        UI.showToast('Logged out successfully');
    };
    
    /**
     * Update UI based on authentication state
     */
    const updateAuthUI = () => {
        const loginButton = document.getElementById('github-login-button');
        const userInfo = document.getElementById('github-user-info');
        const syncStatus = document.getElementById('sync-status');
        
        if (!loginButton || !userInfo || !syncStatus) {
            return; // Elements not found
        }
        
        if (isAuthenticated && githubUser) {
            // Show user info
            loginButton.classList.add('hidden');
            userInfo.classList.remove('hidden');
            userInfo.innerHTML = `
                <img src="${githubUser.avatar_url}" alt="${githubUser.name || githubUser.login}" class="user-avatar">
                <span>${githubUser.name || githubUser.login}</span>
                <button id="github-logout-button" class="text-button">Logout</button>
            `;
            
            // Add logout event listener
            const logoutButton = document.getElementById('github-logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', logout);
            }
            
            // Show sync status
            syncStatus.classList.remove('hidden');
        } else {
            // Show login button
            loginButton.classList.remove('hidden');
            userInfo.classList.add('hidden');
            syncStatus.classList.add('hidden');
        }
    };
    
    /**
     * Sync data from GitHub Gist
     */
    const syncFromGist = async () => {
        if (!isAuthenticated || !gistId) {
            console.log('Not syncing: User not authenticated or no gist ID');
            return;
        }
        
        try {
            // Update sync status to show we're syncing
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = 'Syncing...';
            }
            
            // Fetch the gist content
            const response = await fetch(`${GITHUB_API_URL}/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch gist: ${response.status} ${response.statusText}`);
            }
            
            const gistData = await response.json();
            
            // Check if the gist has our data file
            if (!gistData.files || !gistData.files['vinyl-tracker-data.json']) {
                console.log('No vinyl tracker data found in gist, creating initial data');
                await syncToGist();
                return;
            }
            
            // Get the content of our data file
            const fileContent = gistData.files['vinyl-tracker-data.json'].content;
            let data;
            
            try {
                data = JSON.parse(fileContent);
                console.log('Successfully parsed gist data');
            } catch (parseError) {
                console.error('Error parsing gist data:', parseError);
                UI.showToast('Error parsing sync data');
                return;
            }
            
            // Update Discogs credentials if they exist in the gist data
            if (data.discogsAuth && typeof DiscogsAuth !== 'undefined') {
                console.log('Found Discogs credentials in gist data');
                DiscogsAuth.setCredentialsFromGist(data.discogsAuth);
            }
            
            // Update local storage with data from gist
            if (typeof Storage !== 'undefined' && typeof Storage.updateFromGist === 'function') {
                Storage.updateFromGist(data);
            } else {
                console.warn('Storage module not available or missing updateFromGist function');
            }
            
            // Update UI
            if (typeof UI !== 'undefined') {
                if (typeof UI.renderPlayHistory === 'function') {
                    UI.renderPlayHistory();
                }
                
                if (typeof UI.updatePlayCount === 'function') {
                    UI.updatePlayCount();
                }
            }
            
            // Update sync status
            if (syncStatus) {
                const syncTime = new Date().toLocaleTimeString();
                syncStatus.innerHTML = 'Last synced: ' + syncTime;
                console.log('Updated sync status to:', syncTime);
            }
            
            UI.showToast('Data synced from GitHub');
            console.log('Sync from gist completed successfully');
        } catch (error) {
            console.error('Error syncing from Gist:', error);
            
            // Update sync status to show error
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = 'Sync failed';
            }
            
            UI.showToast('Error syncing data: ' + error.message);
        }
    };
    
    /**
     * Sync data to GitHub Gist
     */
    const syncToGist = async () => {
        if (!isAuthenticated || !gistId) {
            console.log('Not syncing to gist: User not authenticated or no gist ID');
            return;
        }
        
        try {
            console.log('Starting sync to gist...');
            
            // Update sync status to show we're syncing
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = 'Syncing...';
            }
            
            // Get data to sync
            const playHistory = Storage.loadPlayHistory();
            console.log(`Syncing ${playHistory.length} plays to gist`);
            
            const stats = Storage.loadCartridgeStats();
            console.log(`Syncing stats with ${stats.totalPlays} total plays to gist`);
            
            // Get Discogs credentials if available
            let discogsAuth = null;
            if (typeof DiscogsAuth !== 'undefined' && DiscogsAuth.isAuthenticated()) {
                discogsAuth = DiscogsAuth.getCredentialsForGist();
            }
            
            // First, fetch the current gist to check if we need to merge data
            let currentGistData = null;
            let currentPlayHistory = [];
            
            try {
                const response = await fetch(`${GITHUB_API_URL}/gists/${gistId}`, {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const gistData = await response.json();
                    
                    if (gistData.files && gistData.files['vinyl-tracker-data.json']) {
                        const fileContent = gistData.files['vinyl-tracker-data.json'].content;
                        currentGistData = JSON.parse(fileContent);
                        
                        if (currentGistData.playHistory && Array.isArray(currentGistData.playHistory)) {
                            currentPlayHistory = currentGistData.playHistory;
                        }
                    }
                }
            } catch (fetchError) {
                console.warn('Error fetching current gist data:', fetchError);
                // Continue with local data only
            }
            
            // Use Storage module to merge play histories if available
            let mergedPlayHistory;
            if (typeof Storage !== 'undefined' && typeof Storage.mergePlayHistories === 'function') {
                mergedPlayHistory = Storage.mergePlayHistories(playHistory, currentPlayHistory);
            } else {
                // Fallback to simple merge
                mergedPlayHistory = [...playHistory];
                
                if (currentPlayHistory.length > 0) {
                    // Create a map of local play IDs for quick lookup
                    const localPlayIds = new Set(playHistory.map(play => play.id));
                    
                    // Add plays from current gist that don't exist locally
                    const playsToAdd = currentPlayHistory.filter(play => !localPlayIds.has(play.id));
                    
                    if (playsToAdd.length > 0) {
                        mergedPlayHistory = [...playHistory, ...playsToAdd];
                        
                        // Sort by date (newest first)
                        mergedPlayHistory.sort((a, b) => {
                            if (!a.dateListened) return 1;
                            if (!b.dateListened) return -1;
                            
                            try {
                                return new Date(b.dateListened) - new Date(a.dateListened);
                            } catch (error) {
                                return 0;
                            }
                        });
                    }
                }
            }
            
            // Create data object with merged play history
            const data = {
                playHistory: mergedPlayHistory,
                stats,
                lastSync: new Date().toISOString()
            };
            
            // Add Discogs OAuth tokens if available
            if (discogsAuth) {
                data.discogsAuth = discogsAuth;
            }
            
            // Update the gist
            const updateResponse = await fetch(`${GITHUB_API_URL}/gists/${gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    files: {
                        'vinyl-tracker-data.json': {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });
            
            if (!updateResponse.ok) {
                throw new Error(`Failed to update gist: ${updateResponse.status} ${updateResponse.statusText}`);
            }
            
            // Update sync status
            if (syncStatus) {
                const syncTime = new Date().toLocaleTimeString();
                syncStatus.innerHTML = 'Last synced: ' + syncTime;
                console.log('Updated sync status to:', syncTime);
            }
            
            console.log(`Synced ${mergedPlayHistory.length} total plays to gist:`, gistId);
            UI.showToast('Data synced to GitHub');
        } catch (error) {
            console.error('Error syncing to Gist:', error);
            
            // Update sync status to show error
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = 'Sync failed';
            }
            
            UI.showToast('Error syncing data: ' + error.message);
        }
    };
    
    /**
     * Check if user is authenticated
     * @returns {Boolean} - True if authenticated
     */
    const isUserAuthenticated = () => {
        return isAuthenticated;
    };
    
    /**
     * Get GitHub user info
     * @returns {Object|null} - GitHub user info or null if not authenticated
     */
    const getUser = () => {
        return githubUser;
    };
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        login,
        logout,
        syncToGist,
        syncFromGist,
        isUserAuthenticated,
        getUser
    };
})();
