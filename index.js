const express = require('express');
const path = require('path');
const generatePassword = require('password-generator');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ type: '*/*' }));

// data
const walletToNotifications = {}

const collectionBySlug = {
  'tiny-dinos-eth': {name: 'tiny dinos (eth)', image: 'https://lh3.googleusercontent.com/ZoC0EZPOaQeMGdAmqXh-PbOqEdrINf37NnD7wxI8FRa0Ymt8corMCzOP0xMPXjx2P12cvB6pDLWWnPSFJ1cOwbjqZc2_c3haN3n_8A=s168'},
  'cool-cats-nft': {name: 'Cool Cats NFT', image: 'https://lh3.googleusercontent.com/LIov33kogXOK4XZd2ESj29sqm_Hww5JSdO7AFn5wjt8xgnJJ0UpNV9yITqxra3s_LMEW1AnnrgOVB_hDpjJRA1uF4skI5Sdi_9rULi8=s168'},
  'doodles-official': {name: 'Doodles', image: 'https://lh3.googleusercontent.com/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ=s168'},
  'moonrunnersnft': {name: 'Moonrunners Official', image: 'https://openseauserdata.com/files/061eb8949cff84d0be850fc9a566e4fe.png'},
  'proof-moonbirds': {name: 'Moonbirds', image: 'https://lh3.googleusercontent.com/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5OLuyO3Z5PpJFSwdm7rq-TikAh7f5eUw338A2cy6HRH75=s168'},
  'cryptopunks': {name: 'CryptoPunks', image: 'https://lh3.googleusercontent.com/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE=s168'},
  'boredapeyachtclub': {name: 'Bored Ape Yacht Club', image: 'https://lh3.googleusercontent.com/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB=s168'},
  'mutant-ape-yacht-club': {name: 'Mutant Ape Yacht Club', image: 'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI=s168'},
  'mfers': {name: 'mfers', image: 'https://lh3.googleusercontent.com/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKsbP_7bNGd8cpKmWhFQmqMXOC8q2sOdqw=s168'},
}
const notifyTypes = ['listed', 'sold', 'transferred', 'metadataUpdates', 'cancelled', 'receivedOffer', 'receivedBid'];

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


app.get('/api/notifications/:address', (req, res) => {
  if (walletToNotifications[req.params.address] === undefined){
    res.json();
  //  return
  }
  console.log(walletToNotifications)
  console.log(req.params.address)
  const notifications = walletToNotifications[req.params.address].map((not) => not.slice(0,-1))
  // Return them as json
  res.json(notifications);

  console.log(`Sent ${notifications.length} notifications`);
});

app.post('/api/create_notification', (req, res) => {
  const address = req.body.address; 
  const collectionSlug = req.body.collectionSlug;
  const notifyType = req.body.notifyType;

  handleOpenSeaUpdates(address, collectionSlug, notifyType)

  res.json();
})

app.post('/api/remove_notification', (req, res) => {
  console.log('remove notification', req.body)
  const address = req.body.address; 
  const collectionSlug = req.body.collectionSlug;
  const notifyType = req.body.notifyType;
  console.log('before', walletToNotifications[address])

  walletToNotifications[address] = walletToNotifications[address].filter((notifyInfo) => {
    if (notifyInfo[0] === collectionSlug && notifyInfo[1] === notifyType) {
      notifyInfo[2]()
      return false;
    }
    return true
  })
  console.log('after', walletToNotifications[address])

  res.json(req.body);
})

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname+'/client/build/index.html'));
// });

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`EthBoy listening on ${port}`);

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

function handleOpenSeaUpdates(address, collectionSlug, notifyType) {
  console.log('handleOpenSeaUpdates')
  openSeaClient.connect();
  walletToNotifications[address] ||= []
  const { name, image } = collectionBySlug[collectionSlug];
  let unsubscribe;

  switch(notifyType) {
    case 'listed':
      unsubscribe = openSeaClient.onItemListed(collectionSlug, async (event) => {
        console.log(event);
        await epnsSdk.sendNotification(
          address,
          `${name}: ${event?.payload?.item?.metadata?.name || ''} listed`,
          `Listed for ${event?.payload?.base_price/10**18} eth`,
          `${name}: ${event?.payload?.item?.metadata?.name} listed`,
          `Listed for ${event?.payload?.base_price/10**18} eth`,
          3,  
          event.payload?.item?.permalink || `<https://opensea.io/collection/${collectionSlug}>`,
          event.payload?.item?.metadata?.image_url || image
        );
      });
      break;
    case 'sold':
      unsubscribe = openSeaClient.onItemSold(collectionSlug, async (event) => {
        console.log(event);
        await epnsSdk.sendNotification(
          address,
          `${name}: ${event.payload.item.metadata.name || ''} sold`,
          `Sold for ${event.payload.sale_price/10**18} eth`,
          `${name}: ${event.payload.item.metadata.name} sold`,
          `Sold for ${event.payload.sale_price/10**18} eth`,
          3,  
          event.payload.item.permalink || `<https://opensea.io/collection/${collectionSlug}>`,
          event.payload.item.metadata.image_url || image
        );
      });
      break;
    case 'transferred':
      unsubscribe = openSeaClient.onItemTransferred(collectionSlug, async (event) => {
        console.log(event);
        await epnsSdk.sendNotification(
          address,
          `${name}: ${event?.payload?.item?.metadata?.name || ''} transferred`,
          `Transferred from ${event.payload.from_account.address} to ${event.payload.to_account.address}`,
          `${name}: ${event?.payload?.item?.metadata?.name} transferred`,
          `Transferred from ${event.payload.from_account.address} to ${event.payload.to_account.address}`,
          3,  
          event.payload?.item?.permalink || `<https://opensea.io/collection/${collectionSlug}>`,
          event.payload?.item?.metadata?.image_url || image
        );
      });
      break;
    case 'metadataUpdates':
      unsubscribe = openSeaClient.onItemMetadataUpdated(collectionSlug, async (event) => {
        console.log(event);
        await epnsSdk.sendNotification(
          address,
          `${name}: metadata updated`,
          event.payload.description,
          `${name}: metadata updated`,
          event.payload.description,
          3,  
          event.payload?.item?.permalink || `<https://opensea.io/collection/${collectionSlug}>`,
          event.payload.image_preview_url || image
        );
      });
      break;
    case 'cancelled':
      unsubscribe = openSeaClient.onItemCancelled('collection-slug', async (event) => {
        await epnsSdk.sendNotification(
          address,
          `${name}: item canceled`,
          `Transaction Hash: ${event.payload.transaction.hash}`,
          `${name}: item canceled`,
          `Transaction Hash: ${event.payload.transaction.hash}`,
          3,  
          event.payload?.item?.permalink || `<https://opensea.io/collection/${collectionSlug}>`,
          event.payload?.image_preview_url || image
        );
      });
      break;
    case 'receivedOffer':
      unsubscribe = openSeaClient.onItemReceivedOffer(collectionSlug, async (event) => {
        console.log(event);
        await epnsSdk.sendNotification(
          address,
          `${name}: ${event?.payload?.item?.metadata?.name || ''} received offer`,
          `Received for ${event?.payload?.base_price/10**18} eth`,
          `${name}: ${event?.payload?.item?.metadata?.name} received offer`,
          `Received for ${event?.payload?.base_price/10**18} eth`,
          3,  
          event.payload?.item?.permalink || `<https://opensea.io/collection/${collectionSlug}>`,
          event.payload?.item?.metadata?.image_url || image
        );
      })
      break;
    case 'receivedBid':
      unsubscribe = openSeaClient.onItemReceivedOffer(collectionSlug, async (event) => {
        console.log(event);
        await epnsSdk.sendNotification(
          address,
          `${name}: ${event?.payload?.item?.metadata?.name || ''} received bid`,
          `Received for ${event?.payload?.base_price/10**18} eth`,
          `${name}: ${event?.payload?.item?.metadata?.name} received bid`,
          `Received for ${event?.payload?.base_price/10**18} eth`,
          3,  
          event.payload?.item?.permalink || `<https://opensea.io/collection/${collectionSlug}>`,
          event.payload?.item?.metadata?.image_url || image
        );
      })
      break;
  }
  console.log('added notification', address, collectionSlug, notifyType);

  walletToNotifications[address].push([collectionSlug, notifyType, unsubscribe]);
}

// Object.keys(collectionBySlug).forEach((collectionSlug) => {
//   notifyTypes.forEach((notifyType) => {
//     handleOpenSeaUpdates("0x012eaa22f2286e615e582963c4b8f3f1a5646882", collectionSlug, notifyType)
//   })
// })
