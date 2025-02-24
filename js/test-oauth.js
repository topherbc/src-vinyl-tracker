/**
 * Test script for Discogs OAuth functionality
 * This script can be included in the test-oauth.html file to test the OAuth functionality
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

// Test function to directly call the DiscogsOAuth.login method
function testOAuthLogin() {
    console.log('Testing OAuth login...');
    
    if (typeof DiscogsOAuth === 'undefined') {
        console.error('DiscogsOAuth module is not defined');
        return false;
    }
    
    try {
        console.log('Calling DiscogsOAuth.login()');
        DiscogsOAuth.login();
        return true;
    } catch (error) {
        console.error('Error calling DiscogsOAuth.login():', error);
        return false;
    }
}

// Test function to check authentication status
function testOAuthStatus() {
    console.log('Testing OAuth status...');
    
    if (typeof DiscogsOAuth === 'undefined') {
        console.error('DiscogsOAuth module is not defined');
        return { success: false, error: 'DiscogsOAuth module is not defined' };
    }
    
    try {
        const isAuthenticated = DiscogsOAuth.isAuthenticated();
        const username = DiscogsOAuth.getUsername ? DiscogsOAuth.getUsername() : 'N/A';
        
        console.log('Authentication status:', isAuthenticated);
        console.log('Username:', username);
        
        return {
            success: true,
            isAuthenticated,
            username
        };
    } catch (error) {
        console.error('Error checking OAuth status:', error);
        return { success: false, error: error.message };
    }
}

// Test function to manually update the UI
function testUpdateUI() {
    console.log('Testing updateAuthUI...');
    
    if (typeof DiscogsOAuth === 'undefined') {
        console.error('DiscogsOAuth module is not defined');
        return false;
    }
    
    try {
        console.log('Calling DiscogsOAuth.updateAuthUI()');
        DiscogsOAuth.updateAuthUI();
        return true;
    } catch (error) {
        console.error('Error calling DiscogsOAuth.updateAuthUI():', error);
        return false;
    }
}

// Initialize the test when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Test OAuth script loaded');
    console.log('Config loaded:', typeof Config !== 'undefined');
    console.log('DiscogsOAuth loaded:', typeof DiscogsOAuth !== 'undefined');
    console.log('UI loaded:', typeof UI !== 'undefined');
    
    // Add test buttons if they exist
    const loginButton = document.getElementById('test-login-button');
    if (loginButton) {
        loginButton.addEventListener('click', testOAuthLogin);
    }
    
    const statusButton = document.getElementById('test-status-button');
    if (statusButton) {
        statusButton.addEventListener('click', testOAuthStatus);
    }
    
    const updateUIButton = document.getElementById('test-update-ui-button');
    if (updateUIButton) {
        updateUIButton.addEventListener('click', testUpdateUI);
    }
});
