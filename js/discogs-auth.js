/**
 * SRC Vinyl Tracker - Discogs Authentication Module
 * Handles Discogs API key authentication and user identity
 */

const DiscogsAuth = (() => {
    // Storage keys
    const API_KEY_KEY = 'srcVinylTracker_discogsApiKey';
    const USERNAME_KEY = 'srcVinylTracker_discogsUsername';
    
    // State
    let apiKey = null;
    let username = null;
    
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
     * Set Discogs API credentials
     * @param {String} key - Discogs API key
     * @param {String} user - Discogs username
     * @returns {Promise<Boolean>} - True if credentials are valid
     */
    const setCredentials = async (key, user) => {
        if (!key) {
            return false;
        }
        
        try {
            // Validate credentials by making a test API call
            const isValid = await validateCredentials(key, user);
            
            if (isValid) {
                // Save credentials
                apiKey = key;
                username = user;
                
                // Save to localStorage (encrypted)
                localStorage.setItem(API_KEY_KEY, encryptData(apiKey));
                if (username) {
                    localStorage.setItem(USERNAME_KEY, username);
                }
                
                // Update Discogs API module
                if (typeof DiscogsAPI !== 'undefined') {
                    DiscogsAPI.setApiKey(apiKey, username);
                }
                
                // Sync to GitHub Gist if authenticated
                if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
                    Auth.syncToGist();
                }
                
                // Update UI
                updateAuthUI();
                
                return true;
            } else {
                UI.showToast('Invalid Discogs API credentials');
                return false;
            }
        } catch (error) {
            console.error('Error setting Discogs credentials:', error);
            UI.showToast('Error validating Discogs credentials: ' + error.message);
            return false;
        }
    };
    
    /**
     * Validate Discogs API credentials
     * @param {String} key - Discogs API key
     * @param {String} user - Discogs username
     * @returns {Promise<Boolean>} - True if credentials are valid
     */
    const validateCredentials = async (key, user) => {
        try {
            // If no username provided, just check if the API key is valid
            if (!user) {
                const response = await fetch('https://api.discogs.com/database/search?q=test&type=release&per_page=1', {
                    headers: {
                        'Authorization': `Discogs token=${key}`,
                        'User-Agent': 'SRCVinylTracker/1.0'
                    }
                });
                
                return response.ok;
            }
            
            // If username is provided, check if it exists and the API key has access
            const response = await fetch(`https://api.discogs.com/users/${user}`, {
                headers: {
                    'Authorization': `Discogs token=${key}`,
                    'User-Agent': 'SRCVinylTracker/1.0'
                }
            });
            
            if (!response.ok) {
                return false;
            }
            
            // Check if we can access the user's collection
            const collectionResponse = await fetch(`https://api.discogs.com/users/${user}/collection/folders`, {
                headers: {
                    'Authorization': `Discogs token=${key}`,
                    'User-Agent': 'SRCVinylTracker/1.0'
                }
            });
            
            return collectionResponse.ok;
        } catch (error) {
            console.error('Error validating Discogs credentials:', error);
            return false;
        }
    };
    
    /**
     * Load credentials from localStorage
     * @returns {Boolean} - True if credentials were loaded successfully
     */
    const loadCredentials = () => {
        const encryptedKey = localStorage.getItem(API_KEY_KEY);
        
        if (encryptedKey) {
            try {
                apiKey = decryptData(encryptedKey);
                username = localStorage.getItem(USERNAME_KEY);
                
                // Update Discogs API module
                if (typeof DiscogsAPI !== 'undefined') {
                    DiscogsAPI.setApiKey(apiKey, username);
                }
                
                return true;
            } catch (error) {
                console.error('Error loading Discogs credentials:', error);
                return false;
            }
        }
        
        return false;
    };
    
    /**
     * Get credentials for storing in GitHub Gist
     * @returns {Object} - Credential data for GitHub Gist
     */
    const getCredentialsForGist = () => {
        if (apiKey) {
            return {
                apiKey: encryptData(apiKey),
                username,
                timestamp: Date.now()
            };
        }
        
        return null;
    };
    
    /**
     * Set credentials from GitHub Gist
     * @param {Object} credentialData - Credential data from GitHub Gist
     * @returns {Boolean} - True if credentials were set successfully
     */
    const setCredentialsFromGist = (credentialData) => {
        if (credentialData && credentialData.apiKey) {
            try {
                apiKey = decryptData(credentialData.apiKey);
                username = credentialData.username;
                
                // Save to localStorage
                localStorage.setItem(API_KEY_KEY, encryptData(apiKey));
                if (username) {
                    localStorage.setItem(USERNAME_KEY, username);
                }
                
                // Update Discogs API module
                if (typeof DiscogsAPI !== 'undefined') {
                    DiscogsAPI.setApiKey(apiKey, username);
                }
                
                // Update UI
                updateAuthUI();
                
                console.log('Discogs credentials loaded from Gist');
                return true;
            } catch (error) {
                console.error('Error setting credentials from Gist:', error);
                return false;
            }
        }
        
        return false;
    };
    
    /**
     * Check if authenticated with Discogs
     * @returns {Boolean} - True if authenticated
     */
    const isAuthenticated = () => {
        return !!apiKey;
    };
    
    /**
     * Get API key for API requests
     * @returns {String|null} - API key or null if not authenticated
     */
    const getApiKey = () => {
        return apiKey;
    };
    
    /**
     * Update the UI to reflect authentication state
     */
    const updateAuthUI = () => {
        // Update the auth form in the credentials modal if it exists
        const modal = document.getElementById('discogs-auth-modal');
        if (modal) {
            const apiKeyInput = modal.querySelector('#discogs-api-key');
            const usernameInput = modal.querySelector('#discogs-username');
            const saveButton = modal.querySelector('#save-discogs-credentials');
            const statusText = modal.querySelector('.auth-status');
            
            if (apiKeyInput && usernameInput) {
                if (isAuthenticated()) {
                    // Show the current values
                    apiKeyInput.value = apiKey;
                    if (username) {
                        usernameInput.value = username;
                    }
                    
                    // Update status text
                    if (statusText) {
                        statusText.textContent = `✓ Connected to Discogs${username ? ` as ${username}` : ''}`;
                        statusText.classList.add('success-text');
                        statusText.style.display = 'block';
                    }
                    
                    // Update save button
                    if (saveButton) {
                        saveButton.textContent = 'Update Credentials';
                    }
                } else {
                    // Clear the inputs
                    apiKeyInput.value = '';
                    usernameInput.value = '';
                    
                    // Update status text
                    if (statusText) {
                        statusText.textContent = 'Not connected to Discogs';
                        statusText.classList.remove('success-text');
                        statusText.style.display = 'block';
                    }
                    
                    // Update save button
                    if (saveButton) {
                        saveButton.textContent = 'Connect to Discogs';
                    }
                }
            }
        }
    };
    
    /**
     * Initialize the module
     */
    const init = () => {
        // Try to load credentials from localStorage
        if (loadCredentials()) {
            // Update UI if credentials were loaded
            updateAuthUI();
        } else {
            // If not in localStorage, try to load from Gist via Auth module
            if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
                // The Auth module will call setCredentialsFromGist if credentials are found in the Gist
                console.log('Checking for Discogs credentials in GitHub Gist...');
            }
        }
    };
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        setCredentials,
        isAuthenticated,
        getApiKey,
        updateAuthUI,
        getUsername: () => username,
        getCredentialsForGist,
        setCredentialsFromGist,
        validateCredentials
    };
})();
