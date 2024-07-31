import React from 'react';

const BuySellContent = () => {
  return (
    <div class="body">
      <h1>How to buy/sell NFTs?</h1>
      <p>This guide will teach you how to purchase and sell NFTs on the Ethereum blockchain with the Opensea Marketplace.</p>
      <p>There are a few prerequisites that users must complete before buying/selling NFTs:</p>
      <img src="../../images/resources/buying-prerequisite-tree.png"></img>
      <h2>Prerequisites</h2>
      <h3>Set up wallet</h3>
      <p>You need a digital wallet to store your cryptocurrencies and NFTs. Popular choices include <a href='https://metamask.io/'>Metamask</a> and Coinbase.
      We will be using Metamask in this guide. To create your wallet, visit the website and follow the instructions. 
      You should also install the browser extension in order to connect your wallet to the NFT market places later on. </p>
      <h3>Purchase Ethereum cryptocurrency</h3>
      <p>You can get cryptocurrency from crypto exchanges like <a href='https://www.coinhako.com/'>Coinhako. </a>
      Follow the instructions in the website in order to purchase cryptocurrency.</p>
      <h3>Connect wallet to Opensea</h3>
      <p>On the <a href='https://opensea.io/'>Opensea website</a>, click "Login". Then Connect to Opensea with Metamask. 
      If you have the extension correctly installed, you should be prompted to login to your Metamask wallet.</p>
      <img src="../../images/resources/opensea-metamask-login.png"></img>
      <p>Unlock your wallet, then follow the prompts in your wallet and on your screen to connect.</p>
      <p>Congratulations, you should now be ready to buy some NFTs!</p>
      <h2>Buying NFTs (step-by-step)</h2>
      <h3>1. Browsing</h3>
      <p>Using this website's "Browse NFTs" feature (located on the top right of the toolbar), one can easily browse for a wide variety of NFTs to buy.</p>
      <h3>2. Select an NFT</h3>
      <p>Once you have decided on an NFT to buy, you can go to its Opensea link in order to purchase it.</p>
      <h3>3. Purchase</h3>
      <p>If the NFT is listed for a fixed price, click "Buy Now" and confirm the transaction in your wallet.</p>
      <h3>4. Approve the transaction</h3>
      <p>Pay a transaction fee to confirm the purchase.</p>
    </div>
  );
};

export default BuySellContent;