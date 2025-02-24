/**
 * SRC Vinyl Tracker - UI Module
 * Handles user interface interactions and rendering
 */

const UI = (() => {
    // DOM Elements
    let playHistoryEl;
    let playCountEl;
    let searchInputEl;
    let searchResultsEl;
    let selectedAlbumEl;
    let albumCoverEl;
    let albumTitleEl;
    let albumArtistEl;
    let dateListenedEl;
    let addPlayButtonEl;
    let settingsButtonEl;
    
    // Currently selected album
    let selectedAlbum = null;
    
    /**
     * Initialize UI elements and event listeners
     */
    const init = () => {
        // Get DOM elements
        playHistoryEl = document.getElementById('play-history');
        playCountEl = document.getElementById('play-count');
        searchInputEl = document.getElementById('search-input');
        searchResultsEl = document.getElementById('search-results');
        selectedAlbumEl = document.getElementById('selected-album');
        albumCoverEl = document.getElementById('album-cover');
        albumTitleEl = document.getElementById('album-title');
        albumArtistEl = document.getElementById('album-artist');
        dateListenedEl = document.getElementById('date-listened');
        addPlayButtonEl = document.getElementById('add-play-button');
        settingsButtonEl = document.getElementById('settings-button');
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        dateListenedEl.value = today;
        
        // Add event listeners
        searchInputEl.addEventListener('input', debounce(handleSearch, 500));
        addPlayButtonEl.addEventListener('click', handleAddPlay);
        settingsButtonEl.addEventListener('click', () => App.promptForApiCredentials());
        
        // Initial render
        renderPlayHistory();
        updatePlayCount();
    };
    
    /**
     * Render the play history list
     */
    const renderPlayHistory = () => {
        const playHistory = Storage.loadPlayHistory();
        
        if (playHistory.length === 0) {
            playHistoryEl.innerHTML = '<li class="play-list-item">No plays recorded yet.</li>';
            return;
        }
        
        playHistoryEl.innerHTML = '';
        
        playHistory.forEach(play => {
            const li = document.createElement('li');
            li.className = 'play-list-item';
            
            // Format date - preserve the exact date without timezone conversion
            let formattedDate;
            
            if (play.dateListened && play.dateListened.includes('-')) {
                // Parse the ISO date string (YYYY-MM-DD) manually
                const [year, month, day] = play.dateListened.split('-').map(num => parseInt(num, 10));
                
                // Create date parts for display (months are 0-indexed in JS Date)
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = monthNames[month - 1];
                
                // Format as "Feb 20, 2025"
                formattedDate = `${monthName} ${day}, ${year}`;
            } else {
                // Fallback for any other date format
                formattedDate = play.dateListened || 'Unknown date';
            }
            
            // Create the HTML content with delete button and Discogs links
            li.innerHTML = `
                <a href="${play.discogsUrl || '#'}" target="_blank" class="album-link" title="View on Discogs">
                    <img class="album-cover-small" src="${play.coverUrl || 'assets/default-album.svg'}" 
                         alt="${play.title}" onerror="this.src='assets/default-album.svg'">
                </a>
                <div class="play-info">
                    <div class="play-date">${formattedDate}</div>
                    <a href="${play.discogsUrl || '#'}" target="_blank" class="album-title-link" title="View on Discogs">
                        <div class="play-album">${play.title}</div>
                    </a>
                    <div class="play-artist">${play.artist}</div>
                </div>
                <button class="delete-play-button" title="Delete this play" data-id="${play.id}">
                    <span class="material-icons">delete</span>
                </button>
            `;
            
            // Add event listener for delete button
            const deleteButton = li.querySelector('.delete-play-button');
            if (deleteButton) {
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    handleDeletePlay(play.id);
                });
            }
            
            playHistoryEl.appendChild(li);
        });
    };
    
    /**
     * Update the play count display
     */
    const updatePlayCount = () => {
        const stats = Storage.loadCartridgeStats();
        playCountEl.textContent = stats.totalPlays;
    };
    
    /**
     * Handle search input
     */
    const handleSearch = async () => {
        const query = searchInputEl.value.trim();
        
        if (query.length < 2) {
            searchResultsEl.innerHTML = '';
            return;
        }
        
        searchResultsEl.innerHTML = '<div class="searching">Searching...</div>';
        
        try {
            // Check if we have API credentials
            if (!DiscogsAPI.hasCredentials()) {
                searchResultsEl.innerHTML = `
                    <div class="error-message">
                        Discogs API credentials not set. Please click the settings icon to add your API key and secret.
                    </div>
                `;
                return;
            }
            
            // Check if username is set for collection search
            if (DiscogsAPI.hasUsername()) {
                searchResultsEl.innerHTML = '<div class="searching">Searching your collection...</div>';
            } else {
                searchResultsEl.innerHTML = '<div class="searching">Searching Discogs database...</div>';
            }
            
            const results = await DiscogsAPI.searchAlbums(query);
            
            if (results.length === 0) {
                searchResultsEl.innerHTML = '<div class="no-results">No results found. Try a different search term.</div>';
                return;
            }
            
            renderSearchResults(results);
        } catch (error) {
            searchResultsEl.innerHTML = `
                <div class="error-message">
                    Error searching Discogs: ${error.message}
                </div>
            `;
        }
    };
    
    /**
     * Render search results
     * @param {Array} results - Search results from Discogs API
     */
    const renderSearchResults = (results) => {
        searchResultsEl.innerHTML = '';
        
        // Limit to first 20 results to avoid overwhelming the UI
        const limitedResults = results.slice(0, 20);
        
        limitedResults.forEach(result => {
            const formattedResult = DiscogsAPI.formatAlbumData(result);
            
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.id = formattedResult.id;
            
            resultItem.innerHTML = `
                <img src="${formattedResult.coverUrl || 'assets/default-album.svg'}" 
                     alt="${formattedResult.title}" onerror="this.src='assets/default-album.svg'">
                <div>
                    <div>${formattedResult.title}</div>
                    <div>${formattedResult.artist} (${formattedResult.year})</div>
                </div>
            `;
            
            resultItem.addEventListener('click', () => selectAlbum(formattedResult));
            searchResultsEl.appendChild(resultItem);
        });
    };
    
    /**
     * Select an album from search results
     * @param {Object} album - Album data
     */
    const selectAlbum = (album) => {
        selectedAlbum = album;
        
        // Update UI
        albumCoverEl.src = album.coverUrl || 'assets/default-album.svg';
        albumTitleEl.textContent = album.title;
        albumArtistEl.textContent = album.artist;
        
        // Show selected album section
        selectedAlbumEl.classList.remove('hidden');
        
        // Clear search results
        searchResultsEl.innerHTML = '';
        searchInputEl.value = '';
        
        // Scroll to selected album section
        selectedAlbumEl.scrollIntoView({ behavior: 'smooth' });
    };
    
    /**
     * Handle adding a new play
     */
    const handleAddPlay = () => {
        if (!selectedAlbum) {
            showToast('Please select an album first.');
            return;
        }
        
        const dateListened = dateListenedEl.value;
        
        if (!dateListened) {
            showToast('Please select a date.');
            return;
        }
        
        // Create play data
        const playData = {
            ...selectedAlbum,
            dateListened
        };
        
        // Add to storage
        Storage.addPlay(playData);
        
        // Update UI
        renderPlayHistory();
        updatePlayCount();
        
        // Reset form
        resetAddPlayForm();
        
        // Show confirmation
        showToast('Play added successfully!');
        
        // Scroll to play history
        document.querySelector('.play-history-section').scrollIntoView({ behavior: 'smooth' });
    };
    
    /**
     * Reset the add play form
     */
    const resetAddPlayForm = () => {
        selectedAlbum = null;
        selectedAlbumEl.classList.add('hidden');
        searchInputEl.value = '';
        
        // Keep today's date
        const today = new Date().toISOString().split('T')[0];
        dateListenedEl.value = today;
    };
    
    /**
     * Handle deleting a play
     * @param {String} playId - ID of the play to delete
     */
    const handleDeletePlay = (playId) => {
        // Confirm deletion
        if (confirm('Are you sure you want to delete this play?')) {
            // Delete from storage
            Storage.deletePlay(playId);
            
            // Update UI
            renderPlayHistory();
            updatePlayCount();
            
            // Show confirmation
            showToast('Play deleted successfully!');
        }
    };
    
    /**
     * Show a toast message
     * @param {String} message - Message to display
     */
    const showToast = (message) => {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            document.body.appendChild(toast);
        }
        
        // Set message and show toast
        toast.textContent = message;
        toast.classList.add('show');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };
    
    /**
     * Debounce function to limit how often a function is called
     * @param {Function} func - Function to debounce
     * @param {Number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    const debounce = (func, wait) => {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    // Public API
    return {
        init,
        renderPlayHistory,
        updatePlayCount,
        showToast
    };
})();