import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    selfDeclaration: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.selfDeclaration) {
      setError("Please agree to the community declaration before continuing.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(formData);
      navigate('/map');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" name="name" placeholder="Full name"
            value={formData.name} onChange={handleChange} required
            className="auth-input"
          />
          
          <input 
            type="email" name="email" placeholder="Email address"
            value={formData.email} onChange={handleChange} required
            className="auth-input"
          />
          
          <input 
            type="tel" name="phone" placeholder="10-digit mobile number"
            value={formData.phone} onChange={handleChange} required
            className="auth-input"
            pattern="[0-9]{10}"
          />
          
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} name="password" placeholder="Password"
              value={formData.password} onChange={handleChange} required minLength="6"
              className="auth-input" style={{ width: '100%', paddingRight: '60px' }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          
          <select 
            name="gender" 
            value={formData.gender} onChange={handleChange} required
            className="auth-input"
          >
            <option value="" disabled>Select Gender</option>
            <option value="female">I am a woman</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
            <option value="other">Other</option>
          </select>
          
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginTop: '8px' }}>
            <input 
              type="checkbox" 
              name="selfDeclaration"
              checked={formData.selfDeclaration}
              onChange={handleChange}
              style={{ accentColor: '#E8A4C0', width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.4' }}>
              I <span style={{ color: '#E8A4C0' }}>commit</span> to using SafeRoute to support women's safety in my community
            </span>
          </label>

          {error && <div style={{ color: '#CC0000', fontSize: '14px', textAlign: 'center', marginTop: '4px' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading || !formData.selfDeclaration}
            style={{ 
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none', 
              backgroundColor: (!formData.selfDeclaration || isLoading) ? '#64748B' : '#6828B8', 
              color: '#FFFFFF', fontWeight: 'bold', fontSize: '16px',
              cursor: (!formData.selfDeclaration || isLoading) ? 'not-allowed' : 'pointer', 
              marginTop: '12px', transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/login" style={{ color: '#E8A4C0', fontSize: '14px', textDecoration: 'none' }}>
            Already have an account? Sign in
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
        .auth-input:focus { border-color: #E8A4C0; }
        .auth-input::placeholder { color: #64748B; }
        select.auth-input option { background: #1A0A2E; color: white; }
      `}</style>
    </div>
  );
}
