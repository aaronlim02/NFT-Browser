// ContentSwitcher.js
import React, { useState } from 'react';

const ContentSwitcher = () => {
  const [content, setContent] = useState('home');

  const renderContent = () => {
    switch (content) {
      case 'home':
        return <Home />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      default:
        return <Home />;
    }
  };

  return (
    <div>
      <nav className="navbar">
        <ul className="nav-links">
          <li><button onClick={() => setContent('home')}>Home</button></li>
          <li><button onClick={() => setContent('about')}>About</button></li>
          <li><button onClick={() => setContent('contact')}>Contact</button></li>
        </ul>
      </nav>
      <div className="content-window">
        {renderContent()}
      </div>
    </div>
  );
};

const Home = () => (
  <div>
    <h1>Home</h1>
    <p>This is the Home content.</p>
  </div>
);

const About = () => (
  <div>
    <h1>About</h1>
    <p>This is the About content.</p>
  </div>
);

const Contact = () => (
  <div>
    <h1>Contact</h1>
    <p>This is the Contact content.</p>
  </div>
);

export default ContentSwitcher;