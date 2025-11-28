import { Spin } from 'antd';
import React, { useState } from 'react';
import '../../Styles/LoaderOverlay.css';

const LoginLoaderOverlay = ({ isVisible }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);

  return (
    isVisible ? (
      <div className="login-loader-overlay">
        <div className="login-loader-content">
          {/* Logo Container */}
          <div className="login-loader-logo-container">
            <div className="login-loader-logo-wrapper">
              {!logoLoaded && (
                <div className="login-loader-logo-skeleton">
                  <Spin size="small" />
                </div>
              )}
              <img
                src="/favicon.png"
                alt="Manage My Truck Logo"
                className="login-loader-logo"
                style={{ opacity: logoLoaded ? 1 : 0 }}
                onLoad={() => setLogoLoaded(true)}
                onError={() => setLogoLoaded(true)}
              />
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="login-loader-title">Manage My Truck</h1>

          {/* Tagline */}
          <p className="login-loader-tagline">Your Complete Fleet Management Solution</p>

          {/* Spinner */}
          <div className="login-loader-spinner">
            <Spin size="large" />
          </div>

          {/* Loading Text */}
          <p className="login-loader-text">Authenticating your credentials...</p>
        </div>
      </div>
    ) : null
  );
};

export default LoginLoaderOverlay;
