/**
 * SRC Vinyl Tracker - Discogs API Module
 * Handles communication with the Discogs API for album search and retrieval
 */

const DiscogsAPI = (() => {
    // Discogs API configuration
    const API_BASE_URL = 'https://api.discogs.com';
    const USER_AGENT = 'SRCVinylTracker/1.0';
    
    // This would normally be stored securely, but for this demo we'll include it directly
    // In a real app, you would use environment variables or a secure backend
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
     * Check if credentials are set
     * @returns {Boolean} - True if credentials are set
     */
    const hasCredentials = () => {
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
        
        if (API_KEY && API_SECRET) {
            headers['Authorization'] = `Discogs key=${API_KEY}, secret=${API_SECRET}`;
        }
        
        return headers;
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
            
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Discogs API error: ${response.status}`);
            }
            
            const data = await response.json();
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
            
            const response = await fetch(url, {
                method: 'GET',
                headers: getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Discogs API error: ${response.status}`);
            }
            
            return await response.json();
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
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: getHeaders()
                });
                
                if (!response.ok) {
                    throw new Error(`Discogs API error: ${response.status}`);
                }
                
                const data = await response.json();
                const releases = data.releases || [];
                
                if (releases.length === 0) {
                    hasMorePages = false;
                } else {
                    allReleases = [...allReleases, ...releases];
                    
                    // Check if there are more pages
                    const pagination = data.pagination;
                    if (pagination && pagination.page < pagination.pages) {
                        page++;
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
                coverUrl: albumData.cover_image || albumData.thumb || ''
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
                    : ''
            };
        }
        
        // Fallback for unexpected data structure
        return {
            id: albumData.id || 0,
            title: albumData.title || 'Unknown Title',
            artist: albumData.artist || 'Unknown Artist',
            year: albumData.year || 'Unknown Year',
            coverUrl: ''
        };
    };
    
    // Public API
    return {
        setCredentials,
        hasCredentials,
        hasUsername,
        searchAlbums,
        getAlbumDetails,
        getUserCollection,
        formatAlbumData
    };
})();