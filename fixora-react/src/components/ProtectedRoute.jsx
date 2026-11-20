import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { homePath } from '../utils.js';

// Sends people to the login page if they are not signed in,
// or to their own dashboard if they open a page for another role.
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={homePath(user.role)} replace />;
  return children;
}
