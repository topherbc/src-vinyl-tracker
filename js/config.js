/**
 * SRC Vinyl Tracker - Configuration
 * Contains application settings and Discogs OAuth application credentials
 * 
 * IMPORTANT: This file contains application-level credentials, not user credentials.
 * The CONSUMER_KEY identifies your application to Discogs, not the user.
 */

const Config = (() => {
    // Discogs OAuth application credentials
    // Replace this with your actual Discogs application Consumer Key
    // You can get this by registering an application at https://www.discogs.com/settings/developers
    const DISCOGS_CONSUMER_KEY = 'XttJoAFmRapJSOhOWHid';
    
    // API request settings
    const MAX_RETRIES = 3;           // Maximum number of retry attempts for failed API requests
    const RETRY_DELAY = 1000;        // Delay between retries in milliseconds
    const RATE_LIMIT_DELAY = 2000;   // Delay when rate limit is hit
    
    // Public API
    return {
        DISCOGS_CONSUMER_KEY,
        MAX_RETRIES,
        RETRY_DELAY,
        RATE_LIMIT_DELAY
    };
})();
