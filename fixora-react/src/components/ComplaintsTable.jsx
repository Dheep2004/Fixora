import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';

// Table of complaints, used on both dashboards
export default function ComplaintsTable({ list }) {
  return (
    <table>
      <thead>
        <tr><th>ID</th><th>ISSUE</th><th>LOCATION</th><th>PRIORITY</th><th>STATUS</th><th>ASSIGNED TO</th></tr>
      </thead>
      <tbody>
        {list.length === 0 && <tr><td colSpan="6" className="muted">No complaints yet.</td></tr>}
        {list.map((c) => (
          <tr key={c.id}>
            <td><Link to={`/complaint/${c.id}`}>{c.id}</Link></td>
            <td>{c.title}</td>
            <td>{c.location}</td>
            <td><Badge text={c.priority} /></td>
            <td><Badge text={c.status} /></td>
            <td>{c.assignedTo || 'Unassigned'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
