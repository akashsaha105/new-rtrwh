"use client";

import React from "react";

const LoadingPage: React.FC = () => {
  return (
    <div className="p-8 relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
        <p className="text-slate-300">Loading...</p>
        <p className="text-slate-400 text-sm mt-2">
          This may take 10-30 seconds
        </p>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const spinnerStyle: React.CSSProperties = {
  width: 50,
  height: 50,
  border: "6px solid #ccc",
  borderTop: "6px solid #4caf50",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const textStyle: React.CSSProperties = {
  marginTop: 16,
  fontSize: 18,
  color: "#4caf50",
};

// Add global keyframes (put this in your CSS or style component)
/*
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
*/

export default LoadingPage;
