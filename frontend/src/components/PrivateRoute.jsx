import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

function PrivateRoute() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn === null) {
    // Still checking login status
    return <div>Loading...</div>;
  }

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;