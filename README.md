# SRC Vinyl Tracker

A web application for tracking vinyl records played on a cartridge, developed by Sunlight Research Company.

## Features

- Track vinyl records played on your cartridge
- Display play history with album covers, dates, and artist information
- Search for albums using the Discogs API
- Track total plays on your cartridge
- Modern dark theme with responsive design
- Cross-device synchronization with GitHub authentication
- Search your personal Discogs collection
- Data persistence using GitHub Gists
- Secure OAuth authentication with GitHub and API token authentication with Discogs

## How It Works

### Cross-Device Synchronization

SRC Vinyl Tracker uses GitHub authentication and GitHub Gists to provide seamless cross-device synchronization:

1. When you log in with GitHub, the app creates a private Gist in your GitHub account
2. Your play history and settings are stored in this Gist
3. When you use the app on another device, it retrieves your data from the Gist
4. Changes are automatically synced between devices

### Discogs Integration

The app integrates with Discogs to provide access to your vinyl collection:

1. Enter your Discogs API token and username
2. Search your personal Discogs collection
3. Add albums from your collection to your play history
4. Your Discogs credentials are securely stored in your GitHub Gist for cross-device access

## Setup

1. Clone this repository
2. Open `index.html` in your browser
3. Click the "Login with GitHub" button to enable cross-device synchronization
4. Click the settings icon and connect with Discogs to access your collection

## GitHub Authentication

To enable cross-device synchronization:

1. Click the "Login with GitHub" button in the header
2. Authorize the application to access your GitHub account
3. Your play history and settings will be securely stored in a private GitHub Gist
4. Data will automatically sync between devices when you're logged in

## Discogs Authentication

To access your Discogs collection:

1. Click the settings icon in the top-right corner
2. Enter your Discogs API token and username
3. Click "Connect to Discogs"

### Getting a Discogs API Token

1. Log in to your Discogs account
2. Go to [Discogs Developer Settings](https://www.discogs.com/settings/developers)
3. Generate a personal access token
4. Copy the token and paste it into the Discogs API Token field in the app

Your Discogs credentials will be securely stored in your GitHub Gist for cross-device access, so you only need to enter them once.

## GitHub Pages Deployment

To deploy this application to GitHub Pages:

1. Create a new GitHub repository
2. Push the contents of this project to the repository
3. Go to the repository settings
4. Scroll down to the GitHub Pages section
5. Select the main branch as the source
6. Click Save
7. Your site will be published at `https://yourusername.github.io/src-vinyl-tracker/`

## Usage

### Adding a Play

1. Use the search box to find an album in your Discogs collection
2. Click on the album from the search results
3. Select the date you listened to the album
4. Click "Add Play"

### Viewing Play History

The play history is displayed at the bottom of the application in chronological order, with the most recent plays at the top.

### Tracking Plays

The total number of plays is displayed in the header of the application.

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Discogs API with personal access token authentication
- GitHub API with OAuth 2.0 authentication and PKCE
- GitHub Gists for cross-device data storage

## Security Features

- OAuth 2.0 with PKCE for GitHub authentication
- API token authentication for Discogs
- Encrypted token storage in localStorage
- Private GitHub Gists for data storage
- CORS-friendly API requests

## License

MIT License

## Created By

Sunlight Research Company
