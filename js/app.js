/**
 * SRC Vinyl Tracker - Main Application
 * Initializes the application and coordinates between modules
 */

const App = (() => {
    // Default Discogs API credentials (empty)
    const DEFAULT_API_KEY = '';
    const DEFAULT_API_SECRET = '';
    
    /**
     * Initialize the application
     */
    const init = () => {
        // Check for stored API credentials
        const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || DEFAULT_API_KEY;
        const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || DEFAULT_API_SECRET;
        
        // Set API credentials
        DiscogsAPI.setCredentials(apiKey, apiSecret);
        
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
            modal.className = 'mdl-dialog';
            
            modal.innerHTML = `
                <h4 class="mdl-dialog__title">Discogs API Credentials</h4>
                <div class="mdl-dialog__content">
                    <p>
                        To use the Discogs API, you need to provide your API key and secret.
                        You can get these by registering an application at 
                        <a href="https://www.discogs.com/settings/developers" target="_blank">Discogs Developer Settings</a>.
                    </p>
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label full-width">
                        <input class="mdl-textfield__input" type="text" id="api-key-input">
                        <label class="mdl-textfield__label" for="api-key-input">API Key</label>
                    </div>
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label full-width">
                        <input class="mdl-textfield__input" type="text" id="api-secret-input">
                        <label class="mdl-textfield__label" for="api-secret-input">API Secret</label>
                    </div>
                </div>
                <div class="mdl-dialog__actions">
                    <button type="button" class="mdl-button save-credentials">Save</button>
                    <button type="button" class="mdl-button close-dialog">Cancel</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Register Material Design Lite components
            componentHandler.upgradeElement(modal);
            componentHandler.upgradeElements(modal.querySelectorAll('.mdl-textfield'));
            
            // Add event listeners
            modal.querySelector('.save-credentials').addEventListener('click', saveApiCredentials);
            modal.querySelector('.close-dialog').addEventListener('click', () => {
                modal.close();
            });
        }
        
        // Show the modal
        if (!modal.showModal) {
            dialogPolyfill.registerDialog(modal);
        }
        modal.showModal();
    };
    
    /**
     * Save Discogs API credentials
     */
    const saveApiCredentials = () => {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiSecretInput = document.getElementById('api-secret-input');
        
        const apiKey = apiKeyInput.value.trim();
        const apiSecret = apiSecretInput.value.trim();
        
        if (apiKey && apiSecret) {
            // Save to localStorage
            localStorage.setItem('srcVinylTracker_apiKey', apiKey);
            localStorage.setItem('srcVinylTracker_apiSecret', apiSecret);
            
            // Update API credentials
            DiscogsAPI.setCredentials(apiKey, apiSecret);
            
            // Close the modal
            const modal = document.getElementById('api-credentials-modal');
            modal.close();
            
            // Show confirmation
            UI.showToast('API credentials saved successfully!');
        } else {
            alert('Please enter both API key and secret.');
        }
    };
    
    /**
     * Add settings button to header
     */
    const addSettingsButton = () => {
        const headerRow = document.querySelector('.mdl-layout__header-row');
        
        const settingsButton = document.createElement('button');
        settingsButton.className = 'mdl-button mdl-js-button mdl-button--icon';
        settingsButton.innerHTML = '<i class="material-icons">settings</i>';
        settingsButton.addEventListener('click', promptForApiCredentials);
        
        headerRow.appendChild(settingsButton);
        
        // Register Material Design Lite component
        componentHandler.upgradeElement(settingsButton);
    };
    
    // Initialize the application when the DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        init();
        addSettingsButton();
    });
    
    // Public API
    return {
        init,
        promptForApiCredentials
    };
})();