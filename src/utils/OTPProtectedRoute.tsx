// src/utils/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';

const OTPProtectedRoute = ({ children }) => {
  const token = window.sessionStorage.getItem("otp-token");

  if (!token) {
    // If no OTP token, navigate to the OTP verification page
    return <Navigate to="/verify-otp" />;
  }

  // If OTP token exists, render the children (protected component)
  return children;
};

export default OTPProtectedRoute;

