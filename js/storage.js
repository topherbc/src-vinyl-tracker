/**
 * SRC Vinyl Tracker - Storage Module
 * Handles local storage operations for persisting play history data
 */

const Storage = (() => {
    // Storage keys
    const PLAY_HISTORY_KEY = 'srcVinylTracker_playHistory';
    const CARTRIDGE_STATS_KEY = 'srcVinylTracker_cartridgeStats';
    
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
        
        return playHistory;
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
        }
        
        return updatedHistory;
    };
    
    /**
     * Clear all play history and reset stats
     */
    const clearAllData = () => {
        localStorage.removeItem(PLAY_HISTORY_KEY);
        saveCartridgeStats(DEFAULT_STATS);
    };
    
    // Public API
    return {
        addPlay,
        deletePlay,
        loadPlayHistory,
        loadCartridgeStats,
        clearAllData
    };
})();