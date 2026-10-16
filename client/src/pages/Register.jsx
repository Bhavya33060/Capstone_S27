import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Bike, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/about');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-bg-shape float" style={{ width: 300, height: 300, top: -80, right: -80 }} />
      <div className="auth-bg-shape float" style={{ width: 220, height: 220, bottom: -60, left: -60, animationDelay: '1.5s' }} />

      <div className="auth-card scale-in">
        <div className="auth-brand"><Bike size={24} color="#D08C60" /> CitiBike Analytics</div>
        <h2>Create your account</h2>
        <p>Get access to real-time station analytics across every city.</p>

        {error && <div className="auth-error"><AlertCircle size={15} /> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrap">
              <User size={16} />
              <input required placeholder="Your name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrap">
              <Mail size={16} />
              <input type="email" required placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <Lock size={16} />
              <input type="password" required minLength={6} placeholder="At least 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary btn-block ripple" disabled={loading}>
            {loading ? <span className="auth-loader spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
