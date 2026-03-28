import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await login({ email, password });
      localStorage.setItem('token', response.token);
      navigate('/map');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0D1B2A', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#1A0A2E', borderRadius: '20px', padding: '40px', border: '1px solid rgba(104,40,184,0.3)', color: '#FFFFFF' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            <span style={{ color: '#E8A4C0' }}>Safe</span>
            <span style={{ color: '#FFFFFF' }}>Route</span>
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>Women's Safety Navigator</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <input 
              type="email" 
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              style={{ paddingRight: '60px' }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <div style={{ color: '#CC0000', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none', 
              backgroundColor: '#6828B8', color: '#FFFFFF', fontWeight: 'bold', fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
              marginTop: '8px'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/register" style={{ color: '#E8A4C0', fontSize: '14px', textDecoration: 'none' }}>
            New to SafeRoute? Create account
          </Link>
        </div>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(104,40,184,0.4);
          border-radius: 10px;
          color: white;
          padding: 12px 16px;
          font-size: 16px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .auth-input:focus {
          border-color: #E8A4C0;
        }
        .auth-input::placeholder {
          color: #64748B;
        }
      `}</style>
    </div>
  );
}
