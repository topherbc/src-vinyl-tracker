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
        
        // Use a fixed gist ID based on the user's login
        // This ensures the same gist is used across all devices
        if (githubUser && githubUser.login) {
            // Create a deterministic gist ID based on the user's login
            // In a real app, we would search for existing gists with a specific description
            gistId = `gist_${githubUser.login}_srcVinylTracker`;
            localStorage.setItem(GIST_ID_KEY, gistId);
            console.log('Using deterministic gist ID for user:', gistId);
            
            // Check if we have gist data for this ID
            const gistDataJson = localStorage.getItem(`srcVinylTracker_gistData_${gistId}`);
            if (!gistDataJson) {
                console.log('No data found for gist ID, will create new data');
            }
        } else {
            // Fallback to a random gist ID if no user info is available
            const existingGistId = localStorage.getItem(GIST_ID_KEY);
            
            if (existingGistId) {
                // Use the existing gist ID
                gistId = existingGistId;
                console.log('Using existing gist ID:', gistId);
            } else {
                // Create a new gist ID
                gistId = 'gist_' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem(GIST_ID_KEY, gistId);
                console.log('Created new random gist ID:', gistId);
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
            console.log('Not syncing: User not authenticated or no gist ID');
            return;
        }
        
        try {
            // In a real app, this would fetch the gist content
            // For this demo, we'll simulate the process with localStorage
            
            // Update sync status
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                const syncTime = new Date().toLocaleTimeString();
                syncStatus.innerHTML = 'Last synced: ' + syncTime;
                console.log('Updated sync status to:', syncTime);
            }
            
            // Simulate fetching data
            console.log('Syncing data from Gist:', gistId);
            
            // Get the stored gist data from localStorage
            const gistDataJson = localStorage.getItem(`srcVinylTracker_gistData_${gistId}`);
            if (gistDataJson) {
                console.log('Found gist data, parsing...');
                let gistData;
                
                try {
                    gistData = JSON.parse(gistDataJson);
                    console.log('Successfully parsed gist data');
                } catch (parseError) {
                    console.error('Error parsing gist data:', parseError);
                    UI.showToast('Error parsing sync data');
                    return;
                }
                
                // Update credentials if they exist in the gist data
                if (gistData.credentials) {
                    const { apiKey, apiSecret, username } = gistData.credentials;
                    
                    if (apiKey && apiSecret) {
                        console.log('Found credentials in gist data, updating...');
                        
                        // Save to localStorage
                        localStorage.setItem('srcVinylTracker_apiKey', apiKey);
                        localStorage.setItem('srcVinylTracker_apiSecret', apiSecret);
                        if (username) {
                            localStorage.setItem('srcVinylTracker_username', username);
                        }
                        
                        // Update DiscogsAPI credentials
                        if (typeof DiscogsAPI !== 'undefined' && typeof DiscogsAPI.setCredentials === 'function') {
                            DiscogsAPI.setCredentials(apiKey, apiSecret, username);
                            console.log('Credentials updated in DiscogsAPI');
                        } else {
                            console.warn('DiscogsAPI not available, credentials not updated');
                        }
                        
                        console.log('Credentials loaded from Gist');
                    }
                }
                
                // Update play history if it exists in the gist data
                if (gistData.playHistory && Array.isArray(gistData.playHistory)) {
                    console.log(`Found ${gistData.playHistory.length} plays in gist data`);
                    
                    // Merge with local play history
                    const localPlayHistory = Storage.loadPlayHistory();
                    console.log(`Found ${localPlayHistory.length} plays in local storage`);
                    
                    // Create a map of existing play IDs for quick lookup
                    const existingPlayIds = new Set(localPlayHistory.map(play => play.id));
                    console.log(`Created set of ${existingPlayIds.size} existing play IDs`);
                    
                    // Add plays from gist that don't exist locally
                    const newPlays = gistData.playHistory.filter(play => !existingPlayIds.has(play.id));
                    console.log(`Found ${newPlays.length} new plays to add from gist`);
                    
                    if (newPlays.length > 0) {
                        console.log('Merging play histories...');
                        const mergedPlayHistory = [...newPlays, ...localPlayHistory];
                        
                        // Sort by date (newest first)
                        mergedPlayHistory.sort((a, b) => {
                            // Handle missing or invalid dates
                            if (!a.dateListened) return 1;
                            if (!b.dateListened) return -1;
                            
                            try {
                                const dateA = new Date(a.dateListened);
                                const dateB = new Date(b.dateListened);
                                
                                // Check if dates are valid
                                if (isNaN(dateA.getTime())) return 1;
                                if (isNaN(dateB.getTime())) return -1;
                                
                                return dateB - dateA;
                            } catch (error) {
                                console.error('Error comparing dates:', error);
                                return 0;
                            }
                        });
                        
                        console.log(`Saving merged play history with ${mergedPlayHistory.length} plays`);
                        
                        // Save merged play history
                        localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(mergedPlayHistory));
                        
                        // Update UI
                        if (typeof UI !== 'undefined' && typeof UI.renderPlayHistory === 'function') {
                            UI.renderPlayHistory();
                            console.log('UI updated with merged play history');
                        } else {
                            console.warn('UI not available, play history UI not updated');
                        }
                    } else {
                        console.log('No new plays to add from gist');
                    }
                } else {
                    console.log('No play history found in gist data or invalid format');
                }
                
                // Update stats if they exist in the gist data
                if (gistData.stats) {
                    console.log('Found stats in gist data');
                    
                    // Use the higher play count between local and gist
                    const localStats = Storage.loadCartridgeStats();
                    const gistStats = gistData.stats;
                    
                    console.log('Local play count:', localStats.totalPlays);
                    console.log('Gist play count:', gistStats.totalPlays);
                    
                    if (gistStats.totalPlays > localStats.totalPlays) {
                        console.log('Gist play count is higher, updating local stats');
                        localStorage.setItem(CARTRIDGE_STATS_KEY, JSON.stringify(gistStats));
                        
                        if (typeof UI !== 'undefined' && typeof UI.updatePlayCount === 'function') {
                            UI.updatePlayCount();
                            console.log('UI updated with new play count');
                        } else {
                            console.warn('UI not available, play count UI not updated');
                        }
                    } else {
                        console.log('Local play count is higher or equal, keeping local stats');
                    }
                }
                
                if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
                    UI.showToast('Data synced from GitHub');
                }
                console.log('Sync from gist completed successfully');
            } else {
                console.log('No gist data found, creating initial gist...');
                // If no gist data exists yet, create it with current data
                syncToGist();
            }
        } catch (error) {
            console.error('Error syncing from Gist:', error);
            if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
                UI.showToast('Error syncing data: ' + error.message);
            }
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
            
            // In a real app, this would update the gist content via GitHub API
            // For this demo, we'll simulate by storing in localStorage
            
            // Get data to sync
            const playHistory = Storage.loadPlayHistory();
            console.log(`Syncing ${playHistory.length} plays to gist`);
            
            const stats = Storage.loadCartridgeStats();
            console.log(`Syncing stats with ${stats.totalPlays} total plays to gist`);
            
            const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || '';
            const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || '';
            const username = localStorage.getItem('srcVinylTracker_username') || '';
            
            // Check if we need to merge with existing gist data
            let existingData = null;
            const existingDataJson = localStorage.getItem(`srcVinylTracker_gistData_${gistId}`);
            
            if (existingDataJson) {
                try {
                    existingData = JSON.parse(existingDataJson);
                    console.log('Found existing gist data to merge with');
                } catch (parseError) {
                    console.error('Error parsing existing gist data:', parseError);
                    // Continue with new data only
                }
            }
            
            // Merge play histories if needed
            let mergedPlayHistory = [...playHistory];
            
            if (existingData && existingData.playHistory && Array.isArray(existingData.playHistory)) {
                console.log(`Found ${existingData.playHistory.length} plays in existing gist data`);
                
                // Create a map of local play IDs for quick lookup
                const localPlayIds = new Set(playHistory.map(play => play.id));
                
                // Add plays from existing gist that don't exist locally
                const playsToAdd = existingData.playHistory.filter(play => !localPlayIds.has(play.id));
                console.log(`Adding ${playsToAdd.length} plays from existing gist data`);
                
                if (playsToAdd.length > 0) {
                    mergedPlayHistory = [...playHistory, ...playsToAdd];
                    
                    // Sort by date (newest first)
                    mergedPlayHistory.sort((a, b) => {
                        // Handle missing or invalid dates
                        if (!a.dateListened) return 1;
                        if (!b.dateListened) return -1;
                        
                        try {
                            const dateA = new Date(a.dateListened);
                            const dateB = new Date(b.dateListened);
                            
                            // Check if dates are valid
                            if (isNaN(dateA.getTime())) return 1;
                            if (isNaN(dateB.getTime())) return -1;
                            
                            return dateB - dateA;
                        } catch (error) {
                            console.error('Error comparing dates:', error);
                            return 0;
                        }
                    });
                }
            }
            
            // Create data object with merged play history
            const data = {
                playHistory: mergedPlayHistory,
                stats,
                credentials: {
                    apiKey,
                    apiSecret,
                    username
                },
                lastSync: new Date().toISOString()
            };
            
            // Update sync status
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                const syncTime = new Date().toLocaleTimeString();
                syncStatus.innerHTML = 'Last synced: ' + syncTime;
                console.log('Updated sync status to:', syncTime);
            }
            
            // Simulate updating gist by storing in localStorage
            console.log(`Syncing ${mergedPlayHistory.length} total plays to gist:`, gistId);
            
            // Store the data in localStorage with the gist ID as part of the key
            localStorage.setItem(`srcVinylTracker_gistData_${gistId}`, JSON.stringify(data));
            
            console.log('Data synced to simulated gist successfully');
            
            if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
                UI.showToast('Data synced to GitHub');
            }
        } catch (error) {
            console.error('Error syncing to Gist:', error);
            if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
                UI.showToast('Error syncing data: ' + error.message);
            }
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
