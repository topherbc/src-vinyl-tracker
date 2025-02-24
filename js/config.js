/**
 * SRC Vinyl Tracker - Configuration
 * Contains application settings and API credentials
 * 
 * IMPORTANT: Since this file contains API credentials, ensure this repository remains private.
 * If you plan to make this repository public, remove your credentials from this file first.
 */

const Config = (() => {
    // Discogs API credentials
    // Replace these with your actual Discogs API credentials
    const DISCOGS_API_KEY = '';
    const DISCOGS_API_SECRET = '';
    const DISCOGS_USERNAME = '';
    
    // Configuration options
    const USE_HARDCODED_CREDENTIALS = true; // Set to false to use localStorage instead
    
    // API request settings
    const MAX_RETRIES = 3;           // Maximum number of retry attempts for failed API requests
    const RETRY_DELAY = 1000;        // Delay between retries in milliseconds
    const RATE_LIMIT_DELAY = 2000;   // Delay when rate limit is hit
    
    // Public API
    return {
        DISCOGS_API_KEY,
        DISCOGS_API_SECRET,
        DISCOGS_USERNAME,
        USE_HARDCODED_CREDENTIALS,
        MAX_RETRIES,
        RETRY_DELAY,
        RATE_LIMIT_DELAY
    };
})();