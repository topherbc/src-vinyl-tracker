# SRC Vinyl Tracker

A web application for tracking vinyl records played on a cartridge, developed by Sunlight Research Company.

## Features

- Track vinyl records played on your cartridge
- Display play history with album covers, dates, and artist information
- Search for albums using the Discogs API
- Track total plays on your cartridge
- Modern dark theme with responsive design
- Cross-device credential storage option
- Improved collection search with pagination
- Data persistence using localStorage

## Setup

1. Clone this repository
2. Open `index.html` in your browser
3. Click the settings icon in the top-right corner to add your Discogs API credentials

## Discogs API Credentials

To use the search functionality, you'll need to register for a Discogs API key:

1. Create an account at [Discogs](https://www.discogs.com/) if you don't have one
2. Go to [Discogs Developer Settings](https://www.discogs.com/settings/developers)
3. Click "Create an Application"
4. Fill in the required information:
   - Application name: SRC Vinyl Tracker
   - Description: A web application for tracking vinyl records played on a cartridge
   - Website URL: (Your GitHub Pages URL or leave blank)
5. After creating the application, you'll receive a Consumer Key and Consumer Secret
6. Enter these credentials in the SRC Vinyl Tracker settings

### Cross-Device Credential Storage

The application offers two ways to store your Discogs API credentials:

1. **LocalStorage (Default)**: Credentials are stored in your browser's localStorage and will only be available on the current device.

2. **Config File**: By checking the "Store credentials in config.js" option in the settings modal, your credentials will be saved to the config.js file in the repository. This allows you to use the same credentials across all your devices.

**Important Note**: If you enable the config file storage option, make sure to keep this repository private to protect your API credentials.

## GitHub Pages Deployment

To deploy this application to GitHub Pages:

1. Create a new GitHub repository
2. Push the contents of this project to the repository
3. Go to the repository settings
4. Scroll down to the GitHub Pages section
5. Select the main branch as the source
6. Click Save
7. Your site will be published at `https://topherbc.github.io/src-vinyl-tracker/`

## Usage

### Adding a Play

1. Use the search box to find an album on Discogs
2. Click on the album from the search results
3. Select the date you listened to the album
4. Click "Add Play"

### Viewing Play History

The play history is displayed at the bottom of the application in chronological order, with the most recent plays at the top.

### Tracking Plays

The total number of plays is displayed in the header of the application.

## Collection Search

If you provide your Discogs username in the settings, the application will search your personal collection instead of the entire Discogs database. This feature:

- Fetches your entire collection with pagination support
- Uses a score-based matching system for better search results
- Matches partial words and phrases
- Works well with large collections

## Mobile Optimizations

The application is fully responsive and optimized for mobile devices:

- Search box is positioned at the top for easy access
- Settings modal is optimized for small screens
- Touch-friendly UI elements
- Smooth scrolling between sections

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Discogs API
- localStorage for data persistence

## License

MIT License

## Created By

Sunlight Research Company