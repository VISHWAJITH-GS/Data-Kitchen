import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="landing-container">
      <div className="hero-section">
        <h1 className="hero-title">Data Preparation Studio</h1>
        <p className="hero-subtitle">
          Secure, private, and blazing-fast data preparation directly in your browser. 
          Powered by WebAssembly and DuckDB for unmatched local performance.
        </p>
        <button className="btn-primary" onClick={onStart}>
          Get Started Now
        </button>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon" style={{ marginBottom: '1rem', color: '#60a5fa' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 className="feature-title">Local Processing</h3>
          <p className="feature-desc">
            All data stays on your machine. Your privacy is guaranteed with zero server uploads required.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ marginBottom: '1rem', color: '#a78bfa' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20v-6M6 20V10M18 20V4"></path>
            </svg>
          </div>
          <h3 className="feature-title">Visual Engine</h3>
          <p className="feature-desc">
            A beautiful interactive grid helps you visually inspect, clean, and manipulate your data with ease.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ marginBottom: '1rem', color: '#34d399' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <h3 className="feature-title">Instant Profiling</h3>
          <p className="feature-desc">
            Automatically calculate health scores, identify missing values, and suggest fixes instantly.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ marginBottom: '1rem', color: '#fbbf24' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <h3 className="feature-title">Export Flexibility</h3>
          <p className="feature-desc">
            Export your fully processed dataset directly to CSV or Parquet formats in seconds.
          </p>
        </div>
      </div>
    </div>
  );
};
