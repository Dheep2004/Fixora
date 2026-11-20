import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { homePath } from '../utils.js';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Already signed in? Go straight to the dashboard
  if (user) return <Navigate to={homePath(user.role)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const loggedInUser = await api.login(email, password, role);   // swap to real login in api.js
      login(loggedInUser);
      navigate(homePath(loggedInUser.role));
    } catch (err) {
      setError('Could not sign in. Please check your details.');
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="brand dark">
          <div className="logo"><img src="/fixora-logo.jpg" alt="Fixora logo" /></div>
          <div>Fixora<small>Complaint &amp; Maintenance</small></div>
        </div>

        <label htmlFor="role">I am a</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="alert">{error}</p>}
        <button className="btn primary" type="submit">Sign in</button>
        <p className="muted">Demo mode: any email and password works. Pick a role to preview that dashboard.</p>
      </form>
    </div>
  );
}
