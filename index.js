const express = require('express');
const path = require('path');
const generatePassword = require('password-generator');

const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Put all API endpoints under '/api'
app.get('/api/passwords', (req, res) => {
  const count = 5;

  // Generate some passwords
  const passwords = Array.from(Array(count).keys()).map(i =>
    generatePassword(12, false)
  )

  // Return them as json
  res.json(passwords);

  console.log(`Sent ${count} passwords`);
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`Password generator listening on ${port}`);

// OpenSea
const { OpenSeaStreamClient } = require('@opensea/stream-js');
const { WebSocket } = require('ws');

const openSeaClient = new OpenSeaStreamClient({
  token: 'c130c57a59cc497387c8c0883fb61306',
  connectOptions: {
    transport: WebSocket
  }
});

function handleOpenSeaUpdates(collectionSlug) {
  console.log('handleOpenSeaUpdates')
  openSeaClient.connect();

  openSeaClient.onItemMetadataUpdated(collectionSlug, (event) => {
    console.log(event);
    // handle event
  });

  openSeaClient.onItemListed(collectionSlug, (event) => {
    console.log(event);
    // handle event
  });

  openSeaClient.onItemSold(collectionSlug, (event) => {
    console.log(event);
    // handle event
  });

  openSeaClient.onItemTransferred(collectionSlug, (event) => {
    // handle event
  });
}

handleOpenSeaUpdates('tiny-dinos-eth')