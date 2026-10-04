import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { LayoutDashboard } from 'lucide-react';

const API_BASE = '/api';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/board', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (name.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      login(data.token, data.user);
      navigate('/board');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-0)' }}>
      <div className="w-full max-w-md p-8 rounded-xl border" style={{ background: 'var(--color-bg-1)', borderColor: 'var(--color-border-1)' }}>
        <div className="flex items-center justify-center gap-2 mb-8">
          <LayoutDashboard className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-0)' }}>SlackBoard</h1>
        </div>
        
        <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--color-text-0)' }}>Create an account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded text-sm text-center" style={{ color: 'var(--color-error)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }}>
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-2)' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm"
              style={{ background: 'var(--color-bg-2)', color: 'var(--color-text-0)', border: '1px solid var(--color-border-1)' }}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-2)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm"
              style={{ background: 'var(--color-bg-2)', color: 'var(--color-text-0)', border: '1px solid var(--color-border-1)' }}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-2)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm"
              style={{ background: 'var(--color-bg-2)', color: 'var(--color-text-0)', border: '1px solid var(--color-border-1)' }}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded font-medium text-sm transition-colors mt-2"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-3)' }}>
          Already have an account? <Link to="/login" className="hover:underline" style={{ color: 'var(--color-primary)' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
