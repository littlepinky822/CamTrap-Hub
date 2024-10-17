import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setIsLoggedIn(true);
        setCurrentUser(userData);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, checkLoginStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
