import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, sosAPI } from '../utils/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Sync user contacts on mount
  useEffect(() => {
    if (user && user.trustedContacts) {
      setContacts(user.trustedContacts);
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handleSaveContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }

    const cleanedPhone = newContact.phone.replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^\d{10}$/.test(cleanedPhone)) {
      showToast('Invalid 10-digit Indian phone number', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const updatedContacts = [...contacts, { name: newContact.name, phone: cleanedPhone }];
      const res = await userAPI.updateContacts(updatedContacts);
      // The new users.js backend directly returns the trustedContacts array
      setContacts(Array.isArray(res.data) ? res.data : res.data.trustedContacts);
      setNewContact({ name: '', phone: '' });
      setIsAdding(false);
      showToast('Contact saved successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add contact', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (indexToRemove) => {
    setIsLoading(true);
    try {
      const updatedContacts = contacts.filter((_, i) => i !== indexToRemove);
      const res = await userAPI.updateContacts(updatedContacts);
      // The new users.js backend directly returns the trustedContacts array
      setContacts(Array.isArray(res.data) ? res.data : res.data.trustedContacts);
      showToast('Contact removed', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove contact', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSOS = async () => {
    setIsLoading(true);
    try {
      // Sending dummy location map coordinates for the test alert
      await sosAPI.test({ latitude: 30.7333, longitude: 76.7794 });
      showToast('Test SMS sent! Ask your contacts to confirm they received it.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send test SOS', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
  };

  if (!user) return null;

  const joinDate = new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getInitial = () => user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{ backgroundColor: '#0D1B2A', minHeight: '100vh', width: '100%', paddingBottom: '40px', overflowY: 'auto', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast.message && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'error' ? '#CC0000' : '#166534',
          color: 'white', padding: '12px 24px', borderRadius: '24px',
          fontWeight: 'bold', fontSize: '14px', zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 16px', position: 'sticky', top: 0, backgroundColor: '#0D1B2A', zIndex: 100 }}>
        <button 
          onClick={() => navigate('/map')} 
          style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', outline: 'none', padding: 0, width: '40px', textAlign: 'left' }}
        >
          ←
        </button>
        <h1 style={{ color: 'white', fontSize: '18px', margin: 0, flex: 1, textAlign: 'center', paddingRight: '40px' }}>
          My Profile
        </h1>
      </div>

      {/* User Info Card */}
      <div style={{ backgroundColor: '#1A0A2E', borderRadius: '16px', padding: '24px', margin: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(104,40,184,0.3)' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#6828B8', border: '3px solid #E8A4C0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '16px', boxShadow: '0 4px 12px rgba(104,40,184,0.5)' }}>
          {getInitial()}
        </div>
        <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '22px' }}>{user.name}</h2>
        <div style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '12px' }}>{user.email}</div>
        <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '16px' }}>Member since {joinDate}</div>
        <div style={{ backgroundColor: 'rgba(104,40,184,0.2)', color: '#E8A4C0', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(232,164,192,0.3)' }}>
          SafeRoute Member
        </div>
      </div>

      {/* Trusted Contacts Section */}
      <div style={{ backgroundColor: '#1A0A2E', borderRadius: '16px', padding: '24px', margin: '16px', border: '1px solid rgba(104,40,184,0.3)' }}>
        <h3 style={{ color: '#E8A4C0', margin: '0 0 4px 0', fontSize: '18px' }}>SOS Alert Contacts</h3>
        <p style={{ color: '#94A3B8', margin: '0 0 20px 0', fontSize: '13px', lineHeight: 1.4 }}>These people will receive your location via SMS when you trigger SOS</p>

        {contacts.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            {contacts.map((contact, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '8px' }}>
                <div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{contact.name}</div>
                  <div style={{ color: '#E8A4C0', fontSize: '13px', marginTop: '4px' }}>{contact.phone}</div>
                </div>
                <button 
                  onClick={() => handleDeleteContact(index)}
                  disabled={isLoading}
                  style={{ background: 'transparent', border: 'none', color: '#CC0000', fontSize: '18px', cursor: 'pointer', opacity: isLoading ? 0.5 : 1, width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {contacts.length < 3 ? (
          <>
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #6828B8', color: '#E8A4C0', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                + Add Contact
              </button>
            ) : (
              <div style={{ backgroundColor: 'rgba(104,40,184,0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(104,40,184,0.2)', marginTop: contacts.length > 0 ? '12px' : 0 }}>
                <input 
                  type="text" 
                  placeholder="Contact Name" 
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0D1B2A', border: '1px solid #6828B8', color: 'white', borderRadius: '8px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
                <input 
                  type="tel" 
                  placeholder="+91 XXXXXXXXXX" 
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#0D1B2A', border: '1px solid #6828B8', color: 'white', borderRadius: '8px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #64748B', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveContact} disabled={isLoading} style={{ flex: 1, padding: '10px', background: '#6828B8', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>Save Contact</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', fontStyle: 'italic', marginTop: '16px' }}>
            Maximum 3 contacts added
          </div>
        )}
      </div>

      {/* Test SOS Button */}
      <div style={{ margin: '16px', padding: '0' }}>
        <button 
          onClick={handleTestSOS}
          disabled={isLoading || contacts.length === 0}
          style={{ width: '100%', padding: '16px', background: 'transparent', border: '2px dashed #CC0000', color: contacts.length > 0 ? '#CC0000' : '#64748B', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', cursor: (isLoading || contacts.length === 0) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', outline: 'none' }}
        >
          Send Test Alert
        </button>
        {contacts.length === 0 && <p style={{ color: '#94A3B8', fontSize: '12px', textAlign: 'center', margin: '8px 0 0 0' }}>Add trusted contacts to test the SOS system</p>}
      </div>

      {/* Account Section */}
      <div style={{ backgroundColor: '#1A0A2E', borderRadius: '16px', padding: '24px', margin: '24px 16px 16px 16px', border: '1px solid rgba(104,40,184,0.3)', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={handleSignOut}
          style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid #64748B', color: '#E2E8F0', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', outline: 'none' }}
        >
          Sign Out
        </button>
      </div>
    </div >
  );
}
