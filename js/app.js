/**
 * SRC Vinyl Tracker - Main Application
 * Initializes the application and coordinates between modules
 */

const App = (() => {
    /**
     * Initialize the application
     */
    const init = () => {
        // Initialize UI
        UI.init();
        
        // Initialize GitHub login button
        initGitHubLogin();
        
        // Initialize settings button
        initSettingsButton();
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
     * Initialize settings button
     */
    const initSettingsButton = () => {
        const settingsButton = document.getElementById('settings-button');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                promptForDiscogsAuth();
            });
        }
    };
    
    /**
     * Prompt user for Discogs authentication
     */
    const promptForDiscogsAuth = () => {
        // Create modal for Discogs authentication if it doesn't exist
        let modal = document.getElementById('discogs-auth-modal');
        
        if (!modal) {
            modal = document.createElement('dialog');
            modal.id = 'discogs-auth-modal';
            
            // Check if auth is available
            const authAvailable = typeof DiscogsAuth !== 'undefined';
            const isAuthenticated = authAvailable && DiscogsAuth.isAuthenticated();
            const username = isAuthenticated ? DiscogsAuth.getUsername() : '';
            
            modal.innerHTML = `
                <h4>Discogs Authentication</h4>
                <p>
                    Connect to Discogs to search for albums in your collection.
                </p>
                
                <div class="auth-form">
                    <div class="form-group">
                        <label for="discogs-api-key">Discogs API Token</label>
                        <input type="text" id="discogs-api-key" placeholder="Your Discogs API token">
                        <p class="help-text">
                            <a href="https://www.discogs.com/settings/developers" target="_blank">
                                Get your API token from Discogs Developer Settings
                            </a>
                        </p>
                    </div>
                    
                    <div class="form-group">
                        <label for="discogs-username">Discogs Username</label>
                        <input type="text" id="discogs-username" placeholder="Your Discogs username">
                        <p class="help-text">
                            Required to search your collection
                        </p>
                    </div>
                    
                    <p class="auth-status">
                        ${isAuthenticated 
                            ? `✓ Connected to Discogs${username ? ` as ${username}` : ''}`
                            : 'Not connected to Discogs'}
                    </p>
                    
                    <button id="save-discogs-credentials" class="primary-button">
                        ${isAuthenticated ? 'Update Credentials' : 'Connect to Discogs'}
                    </button>
                </div>
                
                <div class="button-group">
                    <button type="button" class="close-dialog">Close</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners for the close button
            const closeButton = modal.querySelector('.close-dialog');
            if (closeButton) {
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
            
            // Add save button event listener
            const saveButton = modal.querySelector('#save-discogs-credentials');
            if (saveButton) {
                saveButton.addEventListener('click', saveDiscogsCredentials);
            }
            
            // Fill in existing values if authenticated
            if (isAuthenticated) {
                const apiKeyInput = modal.querySelector('#discogs-api-key');
                const usernameInput = modal.querySelector('#discogs-username');
                
                if (apiKeyInput && DiscogsAuth.getApiKey()) {
                    apiKeyInput.value = DiscogsAuth.getApiKey();
                }
                
                if (usernameInput && DiscogsAuth.getUsername()) {
                    usernameInput.value = DiscogsAuth.getUsername();
                }
            }
        } else {
            // Update auth status if needed
            if (typeof DiscogsAuth !== 'undefined') {
                DiscogsAuth.updateAuthUI();
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
     * Save Discogs credentials
     */
    const saveDiscogsCredentials = async () => {
        const modal = document.getElementById('discogs-auth-modal');
        if (!modal) return;
        
        const apiKeyInput = modal.querySelector('#discogs-api-key');
        const usernameInput = modal.querySelector('#discogs-username');
        const statusText = modal.querySelector('.auth-status');
        
        if (!apiKeyInput) return;
        
        const apiKey = apiKeyInput.value.trim();
        const username = usernameInput ? usernameInput.value.trim() : '';
        
        if (!apiKey) {
            UI.showToast('Please enter your Discogs API token');
            return;
        }
        
        // Show loading state
        const saveButton = modal.querySelector('#save-discogs-credentials');
        if (saveButton) {
            saveButton.textContent = 'Connecting...';
            saveButton.disabled = true;
        }
        
        if (statusText) {
            statusText.textContent = 'Validating credentials...';
            statusText.classList.remove('success-text');
        }
        
        try {
            // Set credentials in DiscogsAuth module
            if (typeof DiscogsAuth !== 'undefined') {
                const success = await DiscogsAuth.setCredentials(apiKey, username);
                
                if (success) {
                    UI.showToast(`Successfully connected to Discogs${username ? ` as ${username}` : ''}`);
                    
                    // Update status text
                    if (statusText) {
                        statusText.textContent = `✓ Connected to Discogs${username ? ` as ${username}` : ''}`;
                        statusText.classList.add('success-text');
                    }
                    
                    // Update save button
                    if (saveButton) {
                        saveButton.textContent = 'Update Credentials';
                        saveButton.disabled = false;
                    }
                } else {
                    UI.showToast('Failed to connect to Discogs. Please check your credentials.');
                    
                    // Update status text
                    if (statusText) {
                        statusText.textContent = 'Invalid credentials. Please check and try again.';
                        statusText.classList.remove('success-text');
                    }
                    
                    // Update save button
                    if (saveButton) {
                        saveButton.textContent = 'Connect to Discogs';
                        saveButton.disabled = false;
                    }
                }
            } else {
                UI.showToast('Discogs authentication module not available');
                
                // Update save button
                if (saveButton) {
                    saveButton.textContent = 'Connect to Discogs';
                    saveButton.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error saving Discogs credentials:', error);
            UI.showToast('Error connecting to Discogs: ' + error.message);
            
            // Update status text
            if (statusText) {
                statusText.textContent = 'Error connecting to Discogs. Please try again.';
                statusText.classList.remove('success-text');
            }
            
            // Update save button
            if (saveButton) {
                saveButton.textContent = 'Connect to Discogs';
                saveButton.disabled = false;
            }
        }
    };
    
    /**
     * Check if both GitHub and Discogs authentication are needed
     * and prompt the user if necessary
     */
    const checkAuthentication = () => {
        // Check if GitHub authentication is needed
        const githubAuthenticated = typeof Auth !== 'undefined' && Auth.isUserAuthenticated();
        
        // Check if Discogs authentication is needed
        const discogsAuthenticated = typeof DiscogsAuth !== 'undefined' && DiscogsAuth.isAuthenticated();
        
        if (!githubAuthenticated) {
            UI.showToast('Please log in with GitHub for cross-device synchronization');
        } else if (!discogsAuthenticated) {
            // If GitHub is authenticated but Discogs is not, prompt for Discogs auth
            promptForDiscogsAuth();
        }
    };
    
    // Initialize the application when the DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        promptForDiscogsAuth,
        checkAuthentication
    };
})();
