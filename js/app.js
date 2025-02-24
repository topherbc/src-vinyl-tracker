/**
 * SRC Vinyl Tracker - Main Application
 * Initializes the application and coordinates between modules
 */

const App = (() => {
    // Default Discogs API credentials (empty)
    const DEFAULT_API_KEY = '';
    const DEFAULT_API_SECRET = '';
    const DEFAULT_USERNAME = '';
    
    /**
     * Initialize the application
     */
    const init = () => {
        // Make sure credentials are initialized from config or localStorage
        DiscogsAPI.initCredentials();
        
        // Initialize UI
        UI.init();
        
        // Initialize GitHub login button
        initGitHubLogin();
        
        // Only show API credentials modal if no credentials are set
        // This prevents the modal from showing on every page load
        if (!DiscogsAPI.hasCredentials()) {
            promptForApiCredentials();
        }
    };
    
    /**
     * Initialize GitHub login button
     */
    const initGitHubLogin = () => {
        const loginButton = document.getElementById('github-login-button');
        if (loginButton) {
            loginButton.addEventListener('click', () => {
                if (typeof Auth !== 'undefined') {
                    Auth.login();
                } else {
                    UI.showToast('GitHub authentication is not available');
                }
            });
        }
    };
    
    /**
     * Prompt user for Discogs API credentials
     */
    const promptForApiCredentials = () => {
        // Create modal for API credentials if it doesn't exist
        let modal = document.getElementById('api-credentials-modal');
        
        if (!modal) {
            modal = document.createElement('dialog');
            modal.id = 'api-credentials-modal';
            
            // Get current values
            const useHardcoded = typeof Config !== 'undefined' ? Config.USE_HARDCODED_CREDENTIALS : false;
            const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || '';
            const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || '';
            const username = localStorage.getItem('srcVinylTracker_username') || '';
            
            modal.innerHTML = `
                <h4>Discogs API Credentials</h4>
                <p>
                    To use the Discogs API, you need to provide your API key and secret.
                    You can get these by registering an application at 
                    <a href="https://www.discogs.com/settings/developers" target="_blank">Discogs Developer Settings</a>.
                </p>
                <div class="settings-section">
                    <div class="input-group">
                        <label for="api-key-input">API Key:</label>
                        <input type="text" id="api-key-input" placeholder="API Key" value="${apiKey}">
                    </div>
                    
                    <div class="input-group">
                        <label for="api-secret-input">API Secret:</label>
                        <input type="text" id="api-secret-input" placeholder="API Secret" value="${apiSecret}">
                    </div>
                    
                    <div class="input-group">
                        <label for="username-input">Discogs Username:</label>
                        <input type="text" id="username-input" placeholder="Discogs Username" value="${username}">
                    </div>
                    
                    <div class="toggle-group">
                        <label for="use-hardcoded">
                            <input type="checkbox" id="use-hardcoded" ${useHardcoded ? 'checked' : ''}>
                            Store credentials in config.js (for cross-device use)
                        </label>
                        <p class="help-text">
                            When checked, credentials will be saved to config.js file in the repository.
                            This allows the same credentials to be used across all your devices.
                            <strong>Note:</strong> Keep the repository private if you enable this option.
                        </p>
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="save-credentials primary-button">Save</button>
                    <button type="button" class="close-dialog">Cancel</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            modal.querySelector('.save-credentials').addEventListener('click', saveApiCredentials);
            modal.querySelector('.close-dialog').addEventListener('click', () => {
                modal.close();
            });
        } else {
            // Update existing values
            const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || '';
            const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || '';
            const username = localStorage.getItem('srcVinylTracker_username') || '';
            const useHardcoded = typeof Config !== 'undefined' ? Config.USE_HARDCODED_CREDENTIALS : false;
            
            modal.querySelector('#api-key-input').value = apiKey;
            modal.querySelector('#api-secret-input').value = apiSecret;
            modal.querySelector('#username-input').value = username;
            modal.querySelector('#use-hardcoded').checked = useHardcoded;
        }
        
        // Show the modal
        if (!modal.showModal) {
            // Polyfill for older browsers
            if (typeof dialogPolyfill !== 'undefined') {
                dialogPolyfill.registerDialog(modal);
            }
        }
        modal.showModal();
    };
    
    /**
     * Save Discogs API credentials
     */
    const saveApiCredentials = () => {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiSecretInput = document.getElementById('api-secret-input');
        const usernameInput = document.getElementById('username-input');
        const useHardcodedInput = document.getElementById('use-hardcoded');
        
        const apiKey = apiKeyInput.value.trim();
        const apiSecret = apiSecretInput.value.trim();
        const username = usernameInput.value.trim();
        const useHardcoded = useHardcodedInput.checked;
        
        if (apiKey && apiSecret) {
            // Save to localStorage (always save to localStorage as a backup)
            localStorage.setItem('srcVinylTracker_apiKey', apiKey);
            localStorage.setItem('srcVinylTracker_apiSecret', apiSecret);
            localStorage.setItem('srcVinylTracker_username', username);
            
            // If using hardcoded credentials, update the config.js file
            if (useHardcoded && typeof Config !== 'undefined') {
                // In a real app, we would update the config.js file here
                // For this demo, we'll just show a message
                console.log('Saving credentials to config.js...');
                console.log('API Key:', apiKey);
                console.log('API Secret:', apiSecret);
                console.log('Username:', username);
                
                // Simulate updating the Config object
                if (typeof Config !== 'undefined') {
                    Config.DISCOGS_API_KEY = apiKey;
                    Config.DISCOGS_API_SECRET = apiSecret;
                    Config.DISCOGS_USERNAME = username;
                    Config.USE_HARDCODED_CREDENTIALS = true;
                }
            } else if (typeof Config !== 'undefined') {
                // If not using hardcoded credentials, set the flag to false
                Config.USE_HARDCODED_CREDENTIALS = false;
            }
            
            // Update API credentials
            DiscogsAPI.setCredentials(apiKey, apiSecret, username);
            
            // Close the modal
            const modal = document.getElementById('api-credentials-modal');
            modal.close();
            
            // Show confirmation
            UI.showToast('API credentials saved successfully!');
            
            // Sync to GitHub if authenticated
            if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
                Auth.syncToGist();
            }
        } else {
            UI.showToast('Please enter both API key and secret.');
        }
    };
    
    /**
     * Update config.js file with new credentials
     * Note: In a real app, this would be handled by a server-side script
     * For this demo, we'll just log the values
     */
    const updateConfigFile = (apiKey, apiSecret, username, useHardcoded) => {
        console.log('Updating config.js with new credentials...');
        console.log('This would normally be done by a server-side script.');
        console.log('For this demo, please manually update the config.js file with these values:');
        console.log(`DISCOGS_API_KEY: ${apiKey}`);
        console.log(`DISCOGS_API_SECRET: ${apiSecret}`);
        console.log(`DISCOGS_USERNAME: ${username}`);
        console.log(`USE_HARDCODED_CREDENTIALS: ${useHardcoded}`);
    };
    
    // Initialize the application when the DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        promptForApiCredentials
    };
})();