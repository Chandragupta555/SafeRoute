import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page" style={{ backgroundColor: '#0D1B2A', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        .landing-page { scroll-behavior: smooth; }
        
        /* Typography Helpers */
        .text-white { color: var(--white, #FFFFFF); }
        .text-purple { color: var(--purple-light, #9850D8); }
        .text-rose { color: var(--rose, #E8A4C0); }
        .text-gray { color: var(--gray, #94A3B8); }

        /* Animation */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-20px) scale(1.05); }
        }

        /* Hero */
        .hero { position: relative; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; z-index: 1; overflow: hidden; }
        .bg-circle { position: absolute; border-radius: 50%; background: var(--purple, #6828B8); opacity: 0.08; animation: float 8s infinite alternate ease-in-out; z-index: -1; }
        .bg-circle-1 { width: 300px; height: 300px; top: -50px; left: -100px; }
        .bg-circle-2 { width: 450px; height: 450px; bottom: 10vh; right: -150px; animation-delay: 2s; opacity: 0.05; }
        
        .logo-text { font-size: 56px; font-weight: 700; line-height: 1.1; margin: 0; margin-bottom: 8px; }
        .subtitle { font-variant: small-caps; font-size: 16px; letter-spacing: 2px; margin: 0; margin-bottom: 24px; text-transform: lowercase; }
        .tagline { font-size: 20px; max-width: 320px; margin: 0 auto 32px auto; line-height: 1.4; opacity: 0; animation: fadeIn 1s ease-out forwards 0.5s; }
        
        .hero-actions { display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 320px; }
        
        /* Stats */
        .stats { background: var(--bg-card, #1A0A2E); padding: 40px 20px; display: flex; flex-direction: column; gap: 32px; align-items: center; }
        .stat-item { text-align: center; max-width: 250px; }
        .stat-num { font-size: 48px; font-weight: 700; margin-bottom: 8px; line-height: 1; }
        .stat-label { font-size: 14px; line-height: 1.4; }
        .stat-separator { width: 40px; height: 2px; background: rgba(255,255,255,0.05); }

        /* Features */
        .features { padding: 60px 20px; max-width: 1000px; margin: 0 auto; }
        .feature-cards { display: flex; flex-direction: column; gap: 24px; margin-top: 40px; }
        .feature-card { background: rgba(104,40,184,0.15); border: 1px solid var(--purple, #6828B8); border-radius: 16px; padding: 24px; }
        .feature-icon { margin-bottom: 16px; }
        .feature-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        .feature-body { font-size: 14px; line-height: 1.5; }

        /* CTA Footer */
        .cta-footer { background: var(--bg-card, #1A0A2E); padding: 60px 20px; text-align: center; }
        
        /* Desktop Breakpoint */
        @media (min-width: 768px) {
          .hero-actions { flex-direction: row; max-width: 500px; justify-content: center; }
          .hero-actions .btn { flex: 1; }
          .stats { flex-direction: row; justify-content: center; gap: 64px; }
          .stat-separator { width: 1px; height: 60px; }
          .feature-cards { flex-direction: row; align-items: stretch; }
          .feature-card { flex: 1; }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero">
        <div className="bg-circle bg-circle-1" />
        <div className="bg-circle bg-circle-2" />
        
        <h1 className="logo-text">
          <span className="text-rose">Safe</span>
          <span className="text-white">Route</span>
        </h1>
        <h2 className="subtitle text-purple">
          Women's Safety Navigator
        </h2>
        <p className="tagline text-white">
          Navigate Smart. Stay Safe. Even Offline.
        </p>
        
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            Get Started
          </button>
          <button className="btn btn-outline-rose" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat-item">
          <div className="stat-num text-rose">73%</div>
          <div className="stat-label text-gray">of women avoid routes due to safety fears</div>
        </div>
        <div className="stat-separator" />
        <div className="stat-item">
          <div className="stat-num text-rose">0</div>
          <div className="stat-label text-gray">mainstream apps use real-time safety data</div>
        </div>
        <div className="stat-separator" />
        <div className="stat-item">
          <div className="stat-num text-rose">100%</div>
          <div className="stat-label text-gray">SOS apps fail without internet — SafeRoute doesn't</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="text-white" style={{ textAlign: 'center', fontSize: '32px' }}>Built Different</h2>
        
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon">
              {/* Compass SVG */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #E8A4C0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
            <h3 className="feature-title text-white">Smart Safety Routing</h3>
            <p className="feature-body text-gray">Routes ranked by real incident data — not just distance</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              {/* Shield SVG */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #E8A4C0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 className="feature-title text-white">One-Tap SOS</h3>
            <p className="feature-body text-gray">Long press for instant SMS alert to your trusted contacts</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              {/* Wifi Off SVG */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #E8A4C0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </div>
            <h3 className="feature-title text-white">Offline SOS Fallback</h3>
            <p className="feature-body text-gray">No signal? Your last location fires via SMS automatically</p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="cta-footer">
        <h2 className="text-white" style={{ fontSize: '24px', marginBottom: '8px' }}>Ready to travel smarter?</h2>
        <p className="text-gray" style={{ fontSize: '14px', marginBottom: '32px' }}>Join SafeRoute today</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/register')} 
          style={{ padding: '16px 32px', fontSize: '18px', width: '100%', maxWidth: '300px' }}
        >
          Create Free Account
        </button>
      </section>
    </div>
  );
}
