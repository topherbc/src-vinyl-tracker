/**
 * SRC Vinyl Tracker - Global Helper Functions
 * Contains global functions that can be called directly from HTML
 */

// Global function to handle Discogs OAuth login
function handleDiscogsOAuthLogin() {
    console.log('Global handleDiscogsOAuthLogin function called');
    
    if (typeof DiscogsOAuth !== 'undefined') {
        console.log('Calling DiscogsOAuth.login() from global function');
        DiscogsOAuth.login();
        return false; // Prevent default action
    } else {
        console.error('DiscogsOAuth is not defined');
        if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
            UI.showToast('Discogs OAuth is not available');
        }
        return false;
    }
}

// Global function to check Discogs OAuth status
function checkDiscogsOAuthStatus() {
    console.log('Global checkDiscogsOAuthStatus function called');
    
    if (typeof DiscogsOAuth !== 'undefined') {
        const isAuthenticated = DiscogsOAuth.isAuthenticated();
        const username = DiscogsOAuth.getUsername ? DiscogsOAuth.getUsername() : 'N/A';
        
        console.log('Authentication status:', isAuthenticated);
        console.log('Username:', username);
        
        if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
            if (isAuthenticated) {
                UI.showToast(`Authenticated as ${username}`);
            } else {
                UI.showToast('Not authenticated with Discogs');
            }
        }
        
        return isAuthenticated;
    } else {
        console.error('DiscogsOAuth is not defined');
        return false;
    }
}
