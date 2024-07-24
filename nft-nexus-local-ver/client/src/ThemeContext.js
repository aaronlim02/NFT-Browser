import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = 'theme-css';

    if (theme === 'light') {
      link.href = 'App.css';
    } else {
      link.href = 'App-dark.css';
    }

    document.head.appendChild(link);

    return () => {
      const existingLink = document.getElementById('theme-css');
      if (existingLink) {
        existingLink.remove();
      }
    };
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