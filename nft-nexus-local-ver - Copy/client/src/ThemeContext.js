import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const existingLink = document.getElementById('theme-css');
    if (existingLink) {
      existingLink.remove();
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = 'theme-css';

    if (theme === 'light') {
      link.href = '/App.css';
      console.log('Applying light theme');
    } else {
      link.href = '/App-dark.css';
      console.log('Applying dark theme');
    }

    document.head.appendChild(link);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const setDynamicTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setDynamicTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};