import React from 'react';
import { Navigate } from 'react-router-dom';

// Define the props interface with children typed as React.ReactNode
interface OTPProtectedRouteProps {
  children: React.ReactNode;
}

// Use the interface for the component's props
const OTPProtectedRoute: React.FC<OTPProtectedRouteProps> = ({ children }) => {
  const token = window.sessionStorage.getItem("otp-token");

  if (!token) {
    // If no OTP token, navigate to the OTP verification page
    return <Navigate to="/verify-otp" />;
  }

  // If OTP token exists, render the children (protected component)
  return children;
};

export default OTPProtectedRoute;