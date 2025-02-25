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
     * Start GitHub device flow authentication
     */
    const login = async () => {
        if (!GITHUB_CLIENT_ID) {
            UI.showToast('GitHub Client ID not configured. Please set up a GitHub OAuth app.');
            return;
        }
        
        try {
            UI.showToast('Starting GitHub authentication...');
            
            // Start the device flow
            const deviceCodeUrl = 'https://github.com/login/device/code';
            const deviceCodeResponse = await fetch(deviceCodeUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    scope: GITHUB_SCOPE
                })
            });
            
            if (!deviceCodeResponse.ok) {
                throw new Error(`Device code request failed: ${deviceCodeResponse.status}`);
            }
            
            const deviceData = await deviceCodeResponse.json();
            const deviceCode = deviceData.device_code;
            const userCode = deviceData.user_code;
            const verificationUri = deviceData.verification_uri;
            const interval = deviceData.interval || 5;
            
            // Show the user code and verification URI
            const authModal = document.createElement('dialog');
            authModal.innerHTML = `
                <div style="padding: 20px; max-width: 500px;">
                    <h3>Complete GitHub Authentication</h3>
                    <p>Please copy this code and paste it at the GitHub verification page:</p>
                    <div style="font-size: 24px; font-weight: bold; margin: 15px 0; text-align: center; letter-spacing: 2px;">
                        ${userCode}
                    </div>
                    <p>Then click the button below to open GitHub:</p>
                    <div style="display: flex; justify-content: center; margin: 15px 0;">
                        <button id="open-github-btn" style="padding: 10px 15px; background: #2ea44f; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Open GitHub Verification
                        </button>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        After completing verification on GitHub, this window will automatically close.
                    </p>
                </div>
            `;
            document.body.appendChild(authModal);
            
            // Use the showModal method if available, otherwise use a polyfill
            if (typeof authModal.showModal === 'function') {
                authModal.showModal();
            } else {
                authModal.style.display = 'block';
                authModal.style.position = 'fixed';
                authModal.style.top = '50%';
                authModal.style.left = '50%';
                authModal.style.transform = 'translate(-50%, -50%)';
                authModal.style.zIndex = '1000';
                authModal.style.background = 'white';
                authModal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                authModal.style.borderRadius = '8px';
            }
            
            // Add event listener to the button
            const openGitHubBtn = document.getElementById('open-github-btn');
            if (openGitHubBtn) {
                openGitHubBtn.addEventListener('click', () => {
                    window.open(verificationUri, '_blank');
                });
            }
            
            // Poll for the access token
            let accessToken = null;
            const maxAttempts = 30; // 30 attempts * 5 seconds = 2.5 minutes max
            let attempts = 0;
            
            while (!accessToken && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, interval * 1000));
                
                try {
                    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            client_id: GITHUB_CLIENT_ID,
                            device_code: deviceCode,
                            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                        })
                    });
                    
                    const tokenData = await tokenResponse.json();
                    
                    if (tokenData.access_token) {
                        accessToken = tokenData.access_token;
                        // Close the modal
                        if (typeof authModal.close === 'function') {
                            authModal.close();
                        } else {
                            authModal.style.display = 'none';
                            if (authModal.parentNode) {
                                authModal.parentNode.removeChild(authModal);
                            }
                        }
                        break;
                    } else if (tokenData.error === 'authorization_pending') {
                        // Still waiting for user to authorize
                        console.log('Waiting for user authorization...');
                    } else if (tokenData.error === 'slow_down') {
                        // GitHub is asking us to slow down our polling
                        console.log('Slowing down polling...');
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait an extra 5 seconds
                    } else if (tokenData.error) {
                        throw new Error(`Token error: ${tokenData.error_description || tokenData.error}`);
                    }
                } catch (error) {
                    console.error('Error polling for token:', error);
                    // Continue polling despite errors
                }
                
                attempts++;
            }
            
            // If we didn't get an access token after all attempts
            if (!accessToken) {
                // Close the modal if it's still open
                if (typeof authModal.close === 'function') {
                    authModal.close();
                } else {
                    authModal.style.display = 'none';
                    if (authModal.parentNode) {
                        authModal.parentNode.removeChild(authModal);
                    }
                }
                throw new Error('Authentication timed out. Please try again.');
            }
            
            // Save token (encrypted)
            githubToken = accessToken;
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
            console.error('Error during GitHub authentication:', error);
            UI.showToast('Authentication failed: ' + error.message);
        }
    };
    
    // The exchangeCodeForToken function has been removed as we now use the device flow directly in the login function
    
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
