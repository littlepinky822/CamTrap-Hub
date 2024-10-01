import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const userData = await response.json();
        console.log('User data:', userData);
        setIsLoggedIn(true);
        setCurrentUser(userData);
      } else {
        console.log('Unexpected content type:', contentType);
        const text = await response.text();
        console.log('Response text:', text);
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