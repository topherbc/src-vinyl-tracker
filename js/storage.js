/**
 * SRC Vinyl Tracker - Storage Module
 * Handles local storage operations for persisting play history data
 * and synchronizing with GitHub Gist for cross-device access
 */

const Storage = (() => {
    // Storage keys
    const PLAY_HISTORY_KEY = 'srcVinylTracker_playHistory';
    const CARTRIDGE_STATS_KEY = 'srcVinylTracker_cartridgeStats';
    const LAST_SYNC_KEY = 'srcVinylTracker_lastSync';
    
    // Default cartridge stats
    const DEFAULT_STATS = {
        totalPlays: 0
    };
    
    /**
     * Save play history to localStorage
     * @param {Array} playHistory - Array of play history items
     */
    const savePlayHistory = (playHistory) => {
        try {
            localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(playHistory));
        } catch (error) {
            console.error('Error saving play history:', error);
        }
    };
    
    /**
     * Load play history from localStorage
     * @returns {Array} - Array of play history items or empty array if none exists
     */
    const loadPlayHistory = () => {
        try {
            const data = localStorage.getItem(PLAY_HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading play history:', error);
            return [];
        }
    };
    
    /**
     * Save cartridge stats to localStorage
     * @param {Object} stats - Cartridge statistics object
     */
    const saveCartridgeStats = (stats) => {
        try {
            localStorage.setItem(CARTRIDGE_STATS_KEY, JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving cartridge stats:', error);
        }
    };
    
    /**
     * Load cartridge stats from localStorage
     * @returns {Object} - Cartridge statistics object or default if none exists
     */
    const loadCartridgeStats = () => {
        try {
            const data = localStorage.getItem(CARTRIDGE_STATS_KEY);
            return data ? JSON.parse(data) : DEFAULT_STATS;
        } catch (error) {
            console.error('Error loading cartridge stats:', error);
            return DEFAULT_STATS;
        }
    };
    
    /**
     * Save last sync timestamp
     * @param {Number} timestamp - Timestamp of last sync
     */
    const saveLastSync = (timestamp = Date.now()) => {
        try {
            localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
        } catch (error) {
            console.error('Error saving last sync timestamp:', error);
        }
    };
    
    /**
     * Load last sync timestamp
     * @returns {Number} - Timestamp of last sync or 0 if none exists
     */
    const loadLastSync = () => {
        try {
            const data = localStorage.getItem(LAST_SYNC_KEY);
            return data ? parseInt(data, 10) : 0;
        } catch (error) {
            console.error('Error loading last sync timestamp:', error);
            return 0;
        }
    };
    
    /**
     * Check if data needs to be synced
     * @param {Number} threshold - Time threshold in milliseconds (default: 5 minutes)
     * @returns {Boolean} - True if data needs to be synced
     */
    const needsSync = (threshold = 5 * 60 * 1000) => {
        const lastSync = loadLastSync();
        const now = Date.now();
        return (now - lastSync) > threshold;
    };
    
    /**
     * Add a new play to history and update stats
     * @param {Object} playData - Data for the new play
     * @returns {Array} - Updated play history array
     */
    const addPlay = (playData) => {
        // Generate a unique ID for the play
        const play = {
            ...playData,
            id: `play_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Load current play history and add new play
        const playHistory = loadPlayHistory();
        playHistory.unshift(play); // Add to beginning of array (newest first)
        savePlayHistory(playHistory);
        
        // Update cartridge stats
        const stats = loadCartridgeStats();
        stats.totalPlays++;
        saveCartridgeStats(stats);
        
        // Sync to GitHub Gist if authenticated
        syncToGitHub();
        
        return playHistory;
    };
    
    /**
     * Merge play histories from different sources
     * @param {Array} localHistory - Local play history
     * @param {Array} remoteHistory - Remote play history (from GitHub Gist)
     * @returns {Array} - Merged play history
     */
    const mergePlayHistories = (localHistory, remoteHistory) => {
        if (!remoteHistory || !Array.isArray(remoteHistory) || remoteHistory.length === 0) {
            return localHistory;
        }
        
        if (!localHistory || !Array.isArray(localHistory) || localHistory.length === 0) {
            return remoteHistory;
        }
        
        // Create a map of existing play IDs for quick lookup
        const existingPlayIds = new Set(localHistory.map(play => play.id));
        
        // Add plays from remote history that don't exist locally
        const playsToAdd = remoteHistory.filter(play => !existingPlayIds.has(play.id));
        
        if (playsToAdd.length === 0) {
            return localHistory;
        }
        
        // Merge the histories
        const mergedHistory = [...localHistory, ...playsToAdd];
        
        // Sort by date (newest first)
        mergedHistory.sort((a, b) => {
            // Handle missing or invalid dates
            if (!a.dateListened) return 1;
            if (!b.dateListened) return -1;
            
            try {
                const dateA = new Date(a.dateListened);
                const dateB = new Date(b.dateListened);
                
                // Check if dates are valid
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                
                return dateB - dateA;
            } catch (error) {
                console.error('Error comparing dates:', error);
                return 0;
            }
        });
        
        return mergedHistory;
    };
    
    /**
     * Sync data to GitHub Gist if authenticated
     * This is called after any data changes to ensure cross-device sync
     */
    const syncToGitHub = () => {
        // Check if Auth module is available and user is authenticated
        if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
            try {
                // Sync data to GitHub Gist
                console.log('Syncing data changes to GitHub...');
                Auth.syncToGist();
                
                // Update last sync timestamp
                saveLastSync();
                
                return true;
            } catch (error) {
                console.error('Error syncing to GitHub:', error);
                return false;
            }
        } else {
            console.log('Not syncing to GitHub: user not authenticated');
            return false;
        }
    };
    
    /**
     * Sync data from GitHub Gist if authenticated
     * This is called when the application starts or when the user logs in
     */
    const syncFromGitHub = () => {
        // Check if Auth module is available and user is authenticated
        if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated()) {
            try {
                // Sync data from GitHub Gist
                console.log('Syncing data from GitHub...');
                Auth.syncFromGist();
                
                // Update last sync timestamp
                saveLastSync();
                
                return true;
            } catch (error) {
                console.error('Error syncing from GitHub:', error);
                return false;
            }
        } else {
            console.log('Not syncing from GitHub: user not authenticated');
            return false;
        }
    };
    
    /**
     * Update local data with data from GitHub Gist
     * @param {Object} gistData - Data from GitHub Gist
     * @returns {Boolean} - True if data was updated
     */
    const updateFromGist = (gistData) => {
        if (!gistData) {
            return false;
        }
        
        let dataUpdated = false;
        
        // Update play history if it exists in the gist data
        if (gistData.playHistory && Array.isArray(gistData.playHistory)) {
            const localPlayHistory = loadPlayHistory();
            const mergedPlayHistory = mergePlayHistories(localPlayHistory, gistData.playHistory);
            
            if (mergedPlayHistory.length > localPlayHistory.length) {
                savePlayHistory(mergedPlayHistory);
                dataUpdated = true;
                
                console.log(`Updated play history with ${mergedPlayHistory.length - localPlayHistory.length} new plays from GitHub Gist`);
            }
        }
        
        // Update stats if they exist in the gist data
        if (gistData.stats) {
            const localStats = loadCartridgeStats();
            
            if (gistData.stats.totalPlays > localStats.totalPlays) {
                saveCartridgeStats(gistData.stats);
                dataUpdated = true;
                
                console.log(`Updated cartridge stats from GitHub Gist (${localStats.totalPlays} -> ${gistData.stats.totalPlays} plays)`);
            }
        }
        
        // Update last sync timestamp
        if (dataUpdated) {
            saveLastSync();
        }
        
        return dataUpdated;
    };
    
    /**
     * Delete a play from history
     * @param {String} playId - ID of the play to delete
     * @returns {Array} - Updated play history array
     */
    const deletePlay = (playId) => {
        const playHistory = loadPlayHistory();
        const updatedHistory = playHistory.filter(play => play.id !== playId);
        
        // Only update if a play was actually removed
        if (updatedHistory.length < playHistory.length) {
            savePlayHistory(updatedHistory);
            
            // Update cartridge stats
            const stats = loadCartridgeStats();
            stats.totalPlays = Math.max(0, stats.totalPlays - 1);
            saveCartridgeStats(stats);
            
            // Sync to GitHub Gist if authenticated
            syncToGitHub();
        }
        
        return updatedHistory;
    };
    
    /**
     * Clear all play history and reset stats
     */
    const clearAllData = () => {
        localStorage.removeItem(PLAY_HISTORY_KEY);
        saveCartridgeStats(DEFAULT_STATS);
        
        // Sync to GitHub Gist if authenticated
        syncToGitHub();
    };
    
    // Public API
    return {
        addPlay,
        deletePlay,
        loadPlayHistory,
        loadCartridgeStats,
        clearAllData,
        syncToGitHub,
        syncFromGitHub,
        updateFromGist,
        mergePlayHistories,
        needsSync
    };
})();
