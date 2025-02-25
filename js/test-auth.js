/**
 * Test script for Discogs API Authentication functionality
 * This script can be included in the test-auth.html file to test the API authentication functionality
 */

// Create a test UI module if the main UI module is not available
if (typeof UI === 'undefined') {
    console.log('Creating test UI module');
    window.UI = {
        showToast: function(message) {
            console.log('Test UI showToast:', message);
            
            let toast = document.getElementById('toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast';
                toast.className = 'toast';
                document.body.appendChild(toast);
            }
            
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    };
}

// Create a test Auth module if the main Auth module is not available
if (typeof Auth === 'undefined') {
    console.log('Creating test Auth module');
    window.Auth = {
        isUserAuthenticated: function() {
            console.log('Test Auth isUserAuthenticated called');
            return false;
        }
    };
}

// Test function to directly call the DiscogsAuth.setCredentials method
function testAuthLogin() {
    console.log('Testing Discogs Auth...');
    
    if (typeof DiscogsAuth === 'undefined') {
        console.error('DiscogsAuth module is not defined');
        return false;
    }
    
    try {
        console.log('Calling DiscogsAuth.setCredentials()');
        DiscogsAuth.setCredentials('test_token', 'test_username');
        return true;
    } catch (error) {
        console.error('Error calling DiscogsAuth.setCredentials():', error);
        return false;
    }
}

// Test function to check authentication status
function testAuthStatus() {
    console.log('Testing Auth status...');
    
    if (typeof DiscogsAuth === 'undefined') {
        console.error('DiscogsAuth module is not defined');
        return { success: false, error: 'DiscogsAuth module is not defined' };
    }
    
    try {
        const isAuthenticated = DiscogsAuth.isAuthenticated();
        const username = DiscogsAuth.getUsername ? DiscogsAuth.getUsername() : 'N/A';
        
        console.log('Authentication status:', isAuthenticated);
        console.log('Username:', username);
        
        return {
            success: true,
            isAuthenticated,
            username
        };
    } catch (error) {
        console.error('Error checking Auth status:', error);
        return { success: false, error: error.message };
    }
}

// Test function to manually update the UI
function testUpdateUI() {
    console.log('Testing updateAuthUI...');
    
    if (typeof DiscogsAuth === 'undefined') {
        console.error('DiscogsAuth module is not defined');
        return false;
    }
    
    try {
        console.log('Calling DiscogsAuth.updateAuthUI()');
        DiscogsAuth.updateAuthUI();
        return true;
    } catch (error) {
        console.error('Error calling DiscogsAuth.updateAuthUI():', error);
        return false;
    }
}

// Initialize the test when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Test Auth script loaded');
    console.log('Config loaded:', typeof Config !== 'undefined');
    console.log('DiscogsAuth loaded:', typeof DiscogsAuth !== 'undefined');
    console.log('UI loaded:', typeof UI !== 'undefined');
    
    // Add test buttons if they exist
    const loginButton = document.getElementById('test-login-button');
    if (loginButton) {
        loginButton.addEventListener('click', testAuthLogin);
    }
    
    const statusButton = document.getElementById('test-status-button');
    if (statusButton) {
        statusButton.addEventListener('click', testAuthStatus);
    }
    
    const updateUIButton = document.getElementById('test-update-ui-button');
    if (updateUIButton) {
        updateUIButton.addEventListener('click', testUpdateUI);
    }
});
