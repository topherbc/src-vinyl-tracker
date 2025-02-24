/**
 * SRC Vinyl Tracker - Discogs API Module
 * Handles communication with the Discogs API for album search and retrieval
 */

const DiscogsAPI = (() => {
    // Discogs API configuration
    const API_BASE_URL = 'https://api.discogs.com';
    const USER_AGENT = 'SRCVinylTracker/1.0';
    
    // API credentials
    let API_KEY = '';
    let API_SECRET = '';
    let USERNAME = '';
    
    /**
     * Set the API credentials
     * @param {String} key - Discogs API key
     * @param {String} secret - Discogs API secret
     * @param {String} username - Discogs username
     */
    const setCredentials = (key, secret, username) => {
        API_KEY = key;
        API_SECRET = secret;
        USERNAME = username;
    };
    
    /**
     * Initialize credentials from config or localStorage
     */
    const initCredentials = () => {
        if (typeof Config !== 'undefined' && Config.USE_HARDCODED_CREDENTIALS) {
            // Use hardcoded credentials from config.js
            setCredentials(
                Config.DISCOGS_API_KEY,
                Config.DISCOGS_API_SECRET,
                Config.DISCOGS_USERNAME
            );
            console.log('Using hardcoded credentials from config.js');
        } else {
            // Use credentials from localStorage
            const apiKey = localStorage.getItem('srcVinylTracker_apiKey') || '';
            const apiSecret = localStorage.getItem('srcVinylTracker_apiSecret') || '';
            const username = localStorage.getItem('srcVinylTracker_username') || '';
            setCredentials(apiKey, apiSecret, username);
            console.log('Using credentials from localStorage');
        }
    };
    
    /**
     * Check if credentials are set
     * @returns {Boolean} - True if credentials are set
     */
    const hasCredentials = () => {
        // Check for OAuth credentials first
        if (typeof DiscogsOAuth !== 'undefined' && DiscogsOAuth.isAuthenticated()) {
            return true;
        }
        
        // Fall back to API key/secret
        return !!(API_KEY && API_SECRET);
    };
    
    /**
     * Check if username is set
     * @returns {Boolean} - True if username is set
     */
    const hasUsername = () => {
        return !!USERNAME;
    };
    
    /**
     * Build the authorization header for Discogs API requests
     * @returns {Object} - Headers object for fetch
     */
    const getHeaders = () => {
        const headers = {
            'User-Agent': USER_AGENT
        };
        
        // Try to use OAuth if available
        if (typeof DiscogsOAuth !== 'undefined' && DiscogsOAuth.isAuthenticated()) {
            const authHeader = DiscogsOAuth.getAuthHeader();
            if (authHeader) {
                headers['Authorization'] = authHeader;
                console.log('Using OAuth for Discogs API request');
                return headers;
            }
        }
        
        // Fall back to API key/secret
        if (API_KEY && API_SECRET) {
            headers['Authorization'] = `Discogs key=${API_KEY}, secret=${API_SECRET}`;
            console.log('Using API key/secret for Discogs API request');
        } else {
            console.log('No authentication available for Discogs API request');
        }
        
        return headers;
    };
    
    /**
     * Sleep for a specified duration
     * @param {Number} ms - Milliseconds to sleep
     * @returns {Promise} - Promise that resolves after the specified time
     */
    const sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
    
    /**
     * Make a fetch request with retry logic
     * @param {String} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise} - Promise resolving to response data
     */
    const fetchWithRetry = async (url, options = {}) => {
        const maxRetries = typeof Config !== 'undefined' ? Config.MAX_RETRIES : 3;
        const retryDelay = typeof Config !== 'undefined' ? Config.RETRY_DELAY : 1000;
        const rateLimitDelay = typeof Config !== 'undefined' ? Config.RATE_LIMIT_DELAY : 2000;
        
        let retries = 0;
        
        while (true) {
            try {
                const response = await fetch(url, options);
                
                // Handle rate limiting
                if (response.status === 429) {
                    console.warn(`Rate limit hit, waiting ${rateLimitDelay}ms before retrying...`);
                    await sleep(rateLimitDelay);
                    continue;
                }
                
                // Handle other errors
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Discogs API error: ${response.status} - ${errorText}`);
                }
                
                return await response.json();
            } catch (error) {
                retries++;
                console.error(`API request failed (attempt ${retries}/${maxRetries}):`, error);
                
                if (retries >= maxRetries) {
                    throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Wait before retrying
                await sleep(retryDelay);
            }
        }
    };
    
    /**
     * Search for albums on Discogs
     * @param {String} query - Search query
     * @returns {Promise} - Promise resolving to search results
     */
    const searchAlbums = async (query) => {
        try {
            // If username is set, search in user's collection
            if (USERNAME) {
                return await searchUserCollection(query);
            }
            
            // Otherwise, fall back to general search
            const url = new URL(`${API_BASE_URL}/database/search`);
            url.searchParams.append('q', query);
            url.searchParams.append('type', 'release');
            url.searchParams.append('format', 'album');
            
            const data = await fetchWithRetry(url.toString(), {
                method: 'GET',
                headers: getHeaders()
            });
            
            return data.results || [];
        } catch (error) {
            console.error('Error searching Discogs:', error);
            throw error;
        }
    };
    
    /**
     * Get details for a specific album by ID
     * @param {Number} id - Discogs release ID
     * @returns {Promise} - Promise resolving to album details
     */
    const getAlbumDetails = async (id) => {
        try {
            const url = `${API_BASE_URL}/releases/${id}`;
            
            return await fetchWithRetry(url, {
                method: 'GET',
                headers: getHeaders()
            });
        } catch (error) {
            console.error('Error fetching album details:', error);
            throw error;
        }
    };
    
    /**
     * Get a user's collection from Discogs with pagination support
     * @returns {Promise} - Promise resolving to user's collection
     */
    const getUserCollection = async () => {
        if (!USERNAME) {
            throw new Error('Discogs username not set');
        }
        
        try {
            let allReleases = [];
            let page = 1;
            let hasMorePages = true;
            
            // Fetch all pages of the collection
            while (hasMorePages) {
                const url = new URL(`${API_BASE_URL}/users/${USERNAME}/collection/folders/0/releases`);
                url.searchParams.append('page', page);
                url.searchParams.append('per_page', 100); // Maximum allowed by Discogs API
                
                const data = await fetchWithRetry(url.toString(), {
                    method: 'GET',
                    headers: getHeaders()
                });
                
                const releases = data.releases || [];
                
                if (releases.length === 0) {
                    hasMorePages = false;
                } else {
                    allReleases = [...allReleases, ...releases];
                    
                    // Check if there are more pages
                    const pagination = data.pagination;
                    if (pagination && pagination.page < pagination.pages) {
                        page++;
                        // Add a small delay between pagination requests to avoid rate limiting
                        await sleep(300);
                    } else {
                        hasMorePages = false;
                    }
                }
            }
            
            return allReleases;
        } catch (error) {
            console.error('Error fetching user collection:', error);
            throw error;
        }
    };
    
    /**
     * Search within a user's collection with improved matching
     * @param {String} query - Search query
     * @returns {Promise} - Promise resolving to filtered collection results
     */
    const searchUserCollection = async (query) => {
        try {
            const collection = await getUserCollection();
            
            // Split query into words for more flexible matching
            const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
            
            // Score-based matching system
            return collection
                .map(item => {
                    const title = item.basic_information?.title?.toLowerCase() || '';
                    const artist = item.basic_information?.artists?.map(a => a.name.toLowerCase()).join(' ') || '';
                    const fullText = `${title} ${artist}`;
                    
                    // Calculate match score
                    let score = 0;
                    
                    // Exact match gets highest score
                    if (title.includes(query.toLowerCase()) || artist.includes(query.toLowerCase())) {
                        score += 100;
                    }
                    
                    // Word-by-word matching
                    queryWords.forEach(word => {
                        if (fullText.includes(word)) {
                            score += 10;
                        }
                    });
                    
                    return {
                        item,
                        score
                    };
                })
                .filter(result => result.score > 0) // Only include items with a positive score
                .sort((a, b) => b.score - a.score) // Sort by score (highest first)
                .map(result => ({
                    id: result.item.id,
                    title: result.item.basic_information?.title || 'Unknown Title',
                    artist: result.item.basic_information?.artists?.[0]?.name || 'Unknown Artist',
                    year: result.item.basic_information?.year || 'Unknown Year',
                    cover_image: result.item.basic_information?.cover_image || '',
                    thumb: result.item.basic_information?.thumb || ''
                }));
        } catch (error) {
            console.error('Error searching user collection:', error);
            throw error;
        }
    };
    
    /**
     * Format album data into a standardized structure
     * @param {Object} albumData - Raw album data from Discogs
     * @returns {Object} - Formatted album data
     */
    const formatAlbumData = (albumData) => {
        // For search results
        if (albumData.title && albumData.id) {
            return {
                id: albumData.id,
                title: albumData.title,
                artist: albumData.artist || 'Unknown Artist',
                year: albumData.year || 'Unknown Year',
                coverUrl: albumData.cover_image || albumData.thumb || '',
                discogsUrl: `https://www.discogs.com/release/${albumData.id}`
            };
        }
        
        // For detailed album data
        if (albumData.title && albumData.artists) {
            const artist = albumData.artists.map(a => a.name).join(', ');
            return {
                id: albumData.id,
                title: albumData.title,
                artist: artist,
                year: albumData.year || 'Unknown Year',
                coverUrl: albumData.images && albumData.images.length > 0 
                    ? albumData.images[0].uri 
                    : '',
                discogsUrl: `https://www.discogs.com/release/${albumData.id}`
            };
        }
        
        // Fallback for unexpected data structure
        return {
            id: albumData.id || 0,
            title: albumData.title || 'Unknown Title',
            artist: albumData.artist || 'Unknown Artist',
            year: albumData.year || 'Unknown Year',
            coverUrl: '',
            discogsUrl: albumData.id ? `https://www.discogs.com/release/${albumData.id}` : ''
        };
    };
    
    // Initialize credentials on load
    initCredentials();
    
    // Public API
    return {
        setCredentials,
        initCredentials,
        hasCredentials,
        hasUsername,
        searchAlbums,
        getAlbumDetails,
        getUserCollection,
        formatAlbumData
    };
})();
