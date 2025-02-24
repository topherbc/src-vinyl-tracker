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
        // Check for stored API credentials
        const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || DEFAULT_API_KEY;
        const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || DEFAULT_API_SECRET;
        const username = localStorage.getItem('srcVinylTracker_username') || DEFAULT_USERNAME;
        
        // Set API credentials
        DiscogsAPI.setCredentials(apiKey, apiSecret, username);
        
        // Initialize UI
        UI.init();
        
        // Check if API credentials are set
        if (!DiscogsAPI.hasCredentials()) {
            promptForApiCredentials();
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
            
            modal.innerHTML = `
                <h4>Discogs API Credentials</h4>
                <p>
                    To use the Discogs API, you need to provide your API key and secret.
                    You can get these by registering an application at 
                    <a href="https://www.discogs.com/settings/developers" target="_blank">Discogs Developer Settings</a>.
                </p>
                <div>
                    <input type="text" id="api-key-input" placeholder="API Key">
                </div>
                <div>
                    <input type="text" id="api-secret-input" placeholder="API Secret">
                </div>
                <div>
                    <input type="text" id="username-input" placeholder="Discogs Username">
                </div>
                <div>
                    <button type="button" class="save-credentials">Save</button>
                    <button type="button" class="close-dialog">Cancel</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            modal.querySelector('.save-credentials').addEventListener('click', saveApiCredentials);
            modal.querySelector('.close-dialog').addEventListener('click', () => {
                modal.close();
            });
        }
        
        // Set existing values if available
        const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || '';
        const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || '';
        const username = localStorage.getItem('srcVinylTracker_username') || '';
        
        modal.querySelector('#api-key-input').value = apiKey;
        modal.querySelector('#api-secret-input').value = apiSecret;
        modal.querySelector('#username-input').value = username;
        
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
        
        const apiKey = apiKeyInput.value.trim();
        const apiSecret = apiSecretInput.value.trim();
        const username = usernameInput.value.trim();
        
        if (apiKey && apiSecret) {
            // Save to localStorage
            localStorage.setItem('srcVinylTracker_apiKey', apiKey);
            localStorage.setItem('srcVinylTracker_apiSecret', apiSecret);
            localStorage.setItem('srcVinylTracker_username', username);
            
            // Update API credentials
            DiscogsAPI.setCredentials(apiKey, apiSecret, username);
            
            // Close the modal
            const modal = document.getElementById('api-credentials-modal');
            modal.close();
            
            // Show confirmation
            UI.showToast('API credentials saved successfully!');
        } else {
            UI.showToast('Please enter both API key and secret.');
        }
    };
    
    // Initialize the application when the DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        promptForApiCredentials
    };
})();