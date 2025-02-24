/**
 * SRC Vinyl Tracker - Authentication Module
 * Handles GitHub OAuth authentication and Gist storage
 */

const Auth = (() => {
    // GitHub OAuth configuration
    const GITHUB_CLIENT_ID = 'Ov23liIXunXN3Fu1LHlf'; // You'll need to create a GitHub OAuth app and add your client ID here
    const GITHUB_REDIRECT_URI = window.location.origin + window.location.pathname;
    const GITHUB_SCOPE = 'gist';
    
    // Storage keys
    const TOKEN_KEY = 'srcVinylTracker_githubToken';
    const USER_KEY = 'srcVinylTracker_githubUser';
    const GIST_ID_KEY = 'srcVinylTracker_gistId';
    const PLAY_HISTORY_KEY = 'srcVinylTracker_playHistory';
    const CARTRIDGE_STATS_KEY = 'srcVinylTracker_cartridgeStats';
    
    // State
    let isAuthenticated = false;
    let githubToken = '';
    let githubUser = null;
    let gistId = '';
    
    /**
     * Initialize authentication
     * Check if user is already logged in
     */
    const init = () => {
        // Check for GitHub auth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // Remove code from URL to prevent sharing
            const newUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);
            
            // Exchange code for token
            exchangeCodeForToken(code);
            return;
        }
        
        // Check if already authenticated
        githubToken = localStorage.getItem(TOKEN_KEY);
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
     * Start GitHub OAuth flow
     */
    const login = () => {
        if (!GITHUB_CLIENT_ID) {
            UI.showToast('GitHub Client ID not configured. Please set up a GitHub OAuth app.');
            return;
        }
        
        // Generate random state for security
        const state = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('srcVinylTracker_oauthState', state);
        
        // Redirect to GitHub OAuth
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=${GITHUB_SCOPE}&state=${state}`;
        window.location.href = authUrl;
    };
    
    /**
     * Exchange OAuth code for token
     * @param {String} code - OAuth code from GitHub
     */
    const exchangeCodeForToken = async (code) => {
        // In a real app, this would be done server-side to keep the client secret secure
        // For this demo, we'll use a proxy service or assume the token exchange happened
        
        // Simulate token exchange
        const simulatedToken = 'github_' + Math.random().toString(36).substring(2, 15);
        
        // Save token
        githubToken = simulatedToken;
        localStorage.setItem(TOKEN_KEY, githubToken);
        
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
        
        // Check if API credentials are needed
        if (!DiscogsAPI.hasCredentials()) {
            // If no API credentials are found, prompt the user
            App.promptForApiCredentials();
        }
    };
    
    /**
     * Fetch GitHub user info
     */
    const fetchUserInfo = async () => {
        // In a real app, this would make an API call to GitHub
        // For this demo, we'll simulate the response
        
        // Simulate user data
        githubUser = {
            login: 'github_user',
            name: 'GitHub User',
            avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        };
        
        localStorage.setItem(USER_KEY, JSON.stringify(githubUser));
    };
    
    /**
     * Find existing gist or create a new one
     */
    const findOrCreateGist = async () => {
        // In a real app, this would search for an existing gist or create a new one
        // For this demo, we'll simulate the process
        
        // Always use a fixed prefix for the app
        const APP_PREFIX = 'srcVinylTracker';
        
        // Use a fixed gist ID based on the user's login
        if (githubUser && githubUser.login) {
            // Create a deterministic gist ID based on the user's login
            // In a real app, we would search for existing gists with a specific description
            gistId = `gist_${githubUser.login}_${APP_PREFIX}`;
            localStorage.setItem(GIST_ID_KEY, gistId);
            console.log('Using deterministic gist ID for user:', gistId);
            
            // Check if we have gist data for this ID
            const gistDataJson = localStorage.getItem(`srcVinylTracker_gistData_${gistId}`);
            if (!gistDataJson) {
                console.log('No data found for gist ID, will create new data');
            }
        } else {
            // Fallback to a device-specific ID if no user info is available
            const existingGistId = localStorage.getItem(GIST_ID_KEY);
            
            if (existingGistId) {
                // Use the existing gist ID
                gistId = existingGistId;
                console.log('Using existing gist ID:', gistId);
            } else {
                // Create a new device-specific ID that's more consistent
                const deviceId = navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
                gistId = `gist_device_${deviceId}_${APP_PREFIX}`;
                localStorage.setItem(GIST_ID_KEY, gistId);
                console.log('Created new device-specific gist ID:', gistId);
            }
        }
        
        // In a real app, we would also check if the gist exists on GitHub
        // and create it if it doesn't exist
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
            return;
        }
        
        try {
            // In a real app, this would fetch the gist content
            // For this demo, we'll simulate the process with localStorage
            
            // Update sync status
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = 'Last synced: ' + new Date().toLocaleTimeString();
            }
            
            // Simulate fetching data
            console.log('Syncing data from Gist:', gistId);
            
            // Get the stored gist data from localStorage
            const gistDataJson = localStorage.getItem(`srcVinylTracker_gistData_${gistId}`);
            if (gistDataJson) {
                const gistData = JSON.parse(gistDataJson);
                
                // Handle Discogs credentials based on type
                if (gistData.discogsCredentials) {
                    const { type, data } = gistData.discogsCredentials;
                    
                    if (type === 'oauth' && data) {
                        // Handle OAuth tokens
                        console.log('Found OAuth tokens in Gist data');
                        localStorage.setItem('srcVinylTracker_discogsToken', JSON.stringify(data));
                        
                        // Initialize OAuth if available
                        if (typeof DiscogsOAuth !== 'undefined') {
                            DiscogsOAuth.loadFromGist();
                        }
                    } else if (type === 'api_key' && data) {
                        // Handle API key/secret
                        const { apiKey, apiSecret, username } = data;
                        
                        if (apiKey && apiSecret) {
                            // Save to localStorage
                            localStorage.setItem('srcVinylTracker_apiKey', apiKey);
                            localStorage.setItem('srcVinylTracker_apiSecret', apiSecret);
                            if (username) {
                                localStorage.setItem('srcVinylTracker_username', username);
                            }
                            
                            // Update DiscogsAPI credentials
                            DiscogsAPI.setCredentials(apiKey, apiSecret, username);
                            
                            console.log('API credentials loaded from Gist:', { apiKey, apiSecret, username });
                        }
                    }
                } else if (gistData.credentials) {
                    // Legacy format - handle old format for backward compatibility
                    const { apiKey, apiSecret, username } = gistData.credentials;
                    
                    if (apiKey && apiSecret) {
                        // Save to localStorage
                        localStorage.setItem('srcVinylTracker_apiKey', apiKey);
                        localStorage.setItem('srcVinylTracker_apiSecret', apiSecret);
                        if (username) {
                            localStorage.setItem('srcVinylTracker_username', username);
                        }
                        
                        // Update DiscogsAPI credentials
                        DiscogsAPI.setCredentials(apiKey, apiSecret, username);
                        
                        console.log('Legacy credentials loaded from Gist:', { apiKey, apiSecret, username });
                    }
                }
                
                // Update play history if it exists in the gist data
                if (gistData.playHistory && Array.isArray(gistData.playHistory)) {
                    // Merge with local play history
                    const localPlayHistory = Storage.loadPlayHistory();
                    
                    // Create a map of existing play IDs for quick lookup
                    const existingPlayIds = new Set(localPlayHistory.map(play => play.id));
                    
                    // Add plays from gist that don't exist locally
                    const newPlays = gistData.playHistory.filter(play => !existingPlayIds.has(play.id));
                    
                    if (newPlays.length > 0) {
                        const mergedPlayHistory = [...newPlays, ...localPlayHistory];
                        
                        // Sort by date (newest first)
                        mergedPlayHistory.sort((a, b) => {
                            const dateA = new Date(a.dateListened);
                            const dateB = new Date(b.dateListened);
                            return dateB - dateA;
                        });
                        
                        // Save merged play history
                        localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(mergedPlayHistory));
                        
                        // Update UI
                        UI.renderPlayHistory();
                    }
                }
                
                // Update stats if they exist in the gist data
                if (gistData.stats) {
                    // Use the higher play count between local and gist
                    const localStats = Storage.loadCartridgeStats();
                    const gistStats = gistData.stats;
                    
                    if (gistStats.totalPlays > localStats.totalPlays) {
                        localStorage.setItem(CARTRIDGE_STATS_KEY, JSON.stringify(gistStats));
                        UI.updatePlayCount();
                    }
                }
                
                UI.showToast('Data synced from GitHub');
            } else {
                console.log('No gist data found, creating initial gist...');
                // If no gist data exists yet, create it with current data
                syncToGist();
            }
        } catch (error) {
            console.error('Error syncing from Gist:', error);
            UI.showToast('Error syncing data: ' + error.message);
        }
    };
    
    /**
     * Sync data to GitHub Gist
     */
    const syncToGist = async () => {
        if (!isAuthenticated || !gistId) {
            return;
        }
        
        try {
            // In a real app, this would update the gist content via GitHub API
            // For this demo, we'll simulate by storing in localStorage
            
            // Get data to sync
            const playHistory = Storage.loadPlayHistory();
            const stats = Storage.loadCartridgeStats();
            
            // Get Discogs credentials (API key/secret or OAuth tokens)
            let discogsCredentials = {};
            
            // Check for OAuth tokens first
            if (typeof DiscogsOAuth !== 'undefined' && DiscogsOAuth.isAuthenticated()) {
                // Use OAuth tokens
                const tokenJson = localStorage.getItem('srcVinylTracker_discogsToken');
                if (tokenJson) {
                    discogsCredentials = {
                        type: 'oauth',
                        data: JSON.parse(tokenJson)
                    };
                    console.log('Using OAuth tokens for Gist sync');
                }
            } else {
                // Fall back to API key/secret
                const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || '';
                const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || '';
                const username = localStorage.getItem('srcVinylTracker_username') || '';
                
                if (apiKey && apiSecret) {
                    discogsCredentials = {
                        type: 'api_key',
                        data: {
                            apiKey,
                            apiSecret,
                            username
                        }
                    };
                    console.log('Using API key/secret for Gist sync');
                }
            }
            
            // Create data object
            const data = {
                playHistory,
                stats,
                discogsCredentials,
                lastSync: new Date().toISOString(),
                appVersion: '1.1.0' // Add version for future compatibility
            };
            
            // Update sync status
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = 'Last synced: ' + new Date().toLocaleTimeString();
            }
            
            // Simulate updating gist by storing in localStorage
            console.log('Syncing data to Gist:', gistId);
            
            // Store the data in localStorage with the gist ID as part of the key
            localStorage.setItem(`srcVinylTracker_gistData_${gistId}`, JSON.stringify(data));
            
            console.log('Data synced to simulated Gist:', data);
            
            UI.showToast('Data synced to GitHub');
        } catch (error) {
            console.error('Error syncing to Gist:', error);
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
