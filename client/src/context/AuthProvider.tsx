import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('slackboard_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(data => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          setUser(null);
          localStorage.removeItem('slackboard_token');
          if (location.pathname !== '/login' && location.pathname !== '/signup') {
            navigate('/login');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
      
    return () => { cancelled = true; };
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('slackboard_token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('slackboard_token');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
