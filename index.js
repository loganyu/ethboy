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

// EPNS
const EpnsSDK = require("@epnsproject/backend-sdk-staging").default;
const ethers = require('ethers');

// the private key of the address which you used to create a channel
const  CHANNEL_PK = '0x26c4c74285242b1552494ddc9d4038f3bb30e21831f95351b4ec0e884eb581f8';

// Initialise the SDK
const epnsSdk = new EpnsSDK(CHANNEL_PK);

const openSeaClient = new OpenSeaStreamClient({
  token: 'c130c57a59cc497387c8c0883fb61306',
  connectOptions: {
    transport: WebSocket
  }
});

function handleOpenSeaUpdates(collectionSlug) {
  console.log('handleOpenSeaUpdates')
  openSeaClient.connect();

  openSeaClient.onItemMetadataUpdated(collectionSlug, async (event) => {
    console.log(event);
    await epnsSdk.sendNotification(
      "0xD623dd87131062c6C91487f721F0B23CD472B758",
      "Backend SDK Demo",
      "This is demo for EPNS Backend SDK",
      "Backend SDK Demo",
      "This is demo for [d:EPNS Backend SDK]",
      3,  
      "<https://epns.io>"
    );
  });

  openSeaClient.onItemListed(collectionSlug, async (event) => {
    console.log(event);
    await epnsSdk.sendNotification(
      "0x012eAA22F2286E615e582963c4b8F3F1a5646882",
      "Backend SDK Demo",
      "This is demo for EPNS Backend SDK",
      "Backend SDK Demo",
      "This is demo for [d:EPNS Backend SDK]",
      3,  
      "<https://epns.io>"
    );
  });

  openSeaClient.onItemSold(collectionSlug, async (event) => {
    console.log(event);
    await epnsSdk.sendNotification(
      "0x012eAA22F2286E615e582963c4b8F3F1a5646882",
      "Backend SDK Demo",
      "This is demo for EPNS Backend SDK",
      "Backend SDK Demo",
      "This is demo for [d:EPNS Backend SDK]",
      3,  
      "<https://epns.io>"
    );
  });

  openSeaClient.onItemTransferred(collectionSlug, async (event) => {
    console.log(event);
    await epnsSdk.sendNotification(
      "0x012eAA22F2286E615e582963c4b8F3F1a5646882",
      "Backend SDK Demo",
      "This is demo for EPNS Backend SDK",
      "Backend SDK Demo",
      "This is demo for [d:EPNS Backend SDK]",
      3,  
      "<https://epns.io>"
    );
  });
}

handleOpenSeaUpdates('tiny-dinos-eth')