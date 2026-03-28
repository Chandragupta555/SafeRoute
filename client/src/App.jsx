import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import MapPage from './pages/MapPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Wrapper for public auth routes (redirects to /map if already logged in)
const AuthRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (isAuthenticated) {
    return <Navigate to="/map" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="app-container" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--white)', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route path="/login" element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        } />
        
        <Route path="/register" element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        } />
        
        <Route path="/map" element={
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route for unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
