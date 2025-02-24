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
        
        // Don't show API credentials modal on initial load
        // Let the user log in with GitHub first or click the settings button
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
     * Prompt user for Discogs authentication
     */
    const promptForApiCredentials = () => {
        // Create modal for API credentials if it doesn't exist
        let modal = document.getElementById('api-credentials-modal');
        
        if (!modal) {
            modal = document.createElement('dialog');
            modal.id = 'api-credentials-modal';
            
            // Check if OAuth is available
            const oauthAvailable = typeof DiscogsOAuth !== 'undefined';
            const oauthAuthenticated = oauthAvailable && DiscogsOAuth.isAuthenticated();
            const username = oauthAuthenticated ? DiscogsOAuth.getUsername() : '';
            
            modal.innerHTML = `
                <h4>Discogs Authentication</h4>
                <p>
                    Connect to Discogs to search for albums and track your vinyl collection.
                </p>
                
                <div class="auth-options">
                    <div class="auth-option">
                        <h5>OAuth Authentication</h5>
                        <p>Log in directly with your Discogs account for a seamless experience.</p>
                        <button id="discogs-oauth-button" class="primary-button ${oauthAuthenticated ? 'success' : ''}" 
                                onclick="return handleDiscogsOAuthLogin();">
                            ${oauthAuthenticated ? 'Connected with Discogs' : 'Log in with Discogs'}
                        </button>
                        ${oauthAuthenticated ? `<p class="success-text">✓ Successfully authenticated as ${username || 'Discogs User'}</p>` : ''}
                    </div>
                </div>
                
                <div class="button-group">
                    <button type="button" class="close-dialog">Close</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners for the close button (with improved mobile support)
            const closeButton = modal.querySelector('.close-dialog');
            if (closeButton) {
                // Add both click and touchend events for better mobile support
                const closeModal = (event) => {
                    event.preventDefault();
                    console.log('Close button clicked/touched');
                    if (modal && typeof modal.close === 'function') {
                        modal.close();
                    } else {
                        console.log('Modal close method not available, using alternative');
                        // Alternative method if modal.close() is not available
                        modal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        // Remove the modal from the DOM as a last resort
                        if (modal.parentNode) {
                            modal.parentNode.removeChild(modal);
                        }
                    }
                };
                
                closeButton.addEventListener('click', closeModal);
                closeButton.addEventListener('touchend', closeModal);
            }
            
            // Add OAuth button event listener if available
            const oauthButton = modal.querySelector('#discogs-oauth-button');
            if (oauthButton && typeof DiscogsOAuth !== 'undefined') {
                oauthButton.addEventListener('click', (event) => {
                    console.log('OAuth button clicked via event listener');
                    event.preventDefault();
                    handleDiscogsOAuthLogin();
                });
            }
        } else {
            // Update OAuth button if needed
            if (typeof DiscogsOAuth !== 'undefined') {
                DiscogsOAuth.updateAuthUI();
            }
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
            
            // Sync to GitHub Gist if authenticated
            if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
                Auth.syncToGist();
            }
            
            // Close the modal
            const modal = document.getElementById('api-credentials-modal');
            modal.close();
            
            // Show confirmation
            UI.showToast('API credentials saved successfully!');
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
