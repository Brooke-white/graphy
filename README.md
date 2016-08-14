# Graphy
Graphs [audio features](https://developer.spotify.com/web-api/get-audio-features/) for individual tracks, playlists, and a user's entire Spotify library.

## Requirements
[Node.js](https://nodejs.org/download/)

## Setup
    mkdir ...main/node_modules && cd $_ && npm install express && npm install request npm install querystring

Set the following variables with your credentials from [Spotify Developer](https://developer.spotify.com/my-applications/#!/applications/create)

//main/authorization_code/app.js

    var client_id = ''; // Your client id
    var client_secret = ''; // Your secret
    var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri (default to local host)

Set the redirect URI for your application on the [Spotify Developer](https://developer.spotify.com/my-applications/#!/applications) website

## Run
    cd ../main/authorization_code && node app.js

Navigate to your site (ex. http://localhost:8888/), and login...
