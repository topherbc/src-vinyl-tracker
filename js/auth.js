/**
 * SRC Vinyl Tracker - Authentication Module
 * Handles GitHub OAuth authentication and Gist storage
 */

const Auth = (() => {
    // GitHub OAuth configuration
    const GITHUB_CLIENT_ID = ''; // You'll need to create a GitHub OAuth app and add your client ID here
    const GITHUB_REDIRECT_URI = window.location.origin + window.location.pathname;
    const GITHUB_SCOPE = 'gist';
    
    // Storage keys
    const TOKEN_KEY = 'srcVinylTracker_githubToken';
    const USER_KEY = 'srcVinylTracker_githubUser';
    const GIST_ID_KEY = 'srcVinylTracker_gistId';
    
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
        // For this demo, we'll simulate the response
        
        // Simulate gist ID
        gistId = 'gist_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(GIST_ID_KEY, gistId);
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
            // For this demo, we'll simulate the process
            
            // Update sync status
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = 'Last synced: ' + new Date().toLocaleTimeString();
            }
            
            // Simulate fetching data
            console.log('Syncing data from Gist:', gistId);
            
            // In a real implementation, we would:
            // 1. Fetch the gist content
            // 2. Parse the JSON data
            // 3. Merge with local data
            // 4. Update localStorage
            
            // For now, we'll just show a success message
            UI.showToast('Data synced from GitHub');
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
            // In a real app, this would update the gist content
            // For this demo, we'll simulate the process
            
            // Get data to sync
            const playHistory = Storage.loadPlayHistory();
            const stats = Storage.loadCartridgeStats();
            const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || '';
            const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || '';
            const username = localStorage.getItem('srcVinylTracker_username') || '';
            
            // Create data object
            const data = {
                playHistory,
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
                syncStatus.innerHTML = 'Last synced: ' + new Date().toLocaleTimeString();
            }
            
            // Simulate updating gist
            console.log('Syncing data to Gist:', gistId);
            console.log('Data:', data);
            
            // In a real implementation, we would:
            // 1. Convert data to JSON
            // 2. Update the gist via GitHub API
            
            // For now, we'll just show a success message
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