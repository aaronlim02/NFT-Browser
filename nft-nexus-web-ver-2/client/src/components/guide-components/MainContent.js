// src/components/MainContent.js
import React from 'react';
import HomeContent from './HomeContent';
import IntroNFTContent from './IntroNFTContent';
import WalletContent from './WalletContent';
import BuySellContent from './BuySellContent';
import WebsiteContent from './WebsiteContent';

const MainContent = ({ content }) => {
  let Component;

  switch (content) {
    case 'Home':
      Component = HomeContent;
      break;
    case 'IntroNFT':
      Component = IntroNFTContent;
      break;
    case 'Wallet':
      Component = WalletContent;
      break;
    case 'BuySell':
      Component = BuySellContent;
      break;
    case 'Website':
      Component = WebsiteContent;
      break;
    default:
      Component = HomeContent;
  }

  return (
    <div className="guide-body">
      <Component />
    </div>
  );
};

export default MainContent;