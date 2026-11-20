import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = {
  student: [
    { label: 'Dashboard', to: '/student', end: true },
    { label: 'New Complaint', to: '/student/new' },
    { label: 'Track Complaint', to: '/complaint' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', end: true },
    { label: 'Complaint Details', to: '/complaint' },
    { label: 'Maintenance Staff', to: '/admin/staff' },
    { label: 'Reports & Analytics', to: '/admin/reports' },
  ],
};

// Sidebar + page header shared by every logged-in page
export default function Layout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const links = NAV[user.role] || NAV.student;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo"><img src="/fixora-logo.jpg" alt="Fixora logo" /></div>
          <div>Fixora<small>Complaint &amp; Maintenance</small></div>
        </div>

        <nav className="nav">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="user">
          Signed in as
          <b>{user.name}</b>
          <span>{user.roleLabel}</span>
          <button className="btn" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main className="main">
        <div className="page-header">
          <div>
            <h1>{title}</h1>
            <div className="muted">{subtitle}</div>
          </div>
          <div className="spacer" />
          <div className="avatar" title={user.name}>{user.name[0]}</div>
        </div>
        {children}
      </main>
    </div>
  );
}
