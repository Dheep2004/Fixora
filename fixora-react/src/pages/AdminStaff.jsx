import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatCards from '../components/StatCards.jsx';
import { api } from '../api/api.js';

export default function AdminStaff() {
  const [rows, setRows] = useState([]);
  const [unassigned, setUnassigned] = useState(0);

  useEffect(() => {
    Promise.all([api.getStaff(), api.getComplaints()]).then(([staff, complaints]) => {
      // Add each person's open (not resolved) complaints
      setRows(staff.map((person) => ({
        ...person,
        open: complaints.filter((c) => c.assignedTo === person.key && c.status !== 'Resolved'),
      })));
      setUnassigned(complaints.filter((c) => !c.assignedTo && c.status !== 'Resolved').length);
    });
  }, []);

  const busy = rows.filter((r) => r.open.length > 0).length;

  return (
    <Layout title="Maintenance Staff" subtitle="See who is available and what each person is working on">
      <StatCards
        items={[
          { label: 'Total staff', value: rows.length },
          { label: 'Busy', value: busy, color: '#92400e' },
          { label: 'Available', value: rows.length - busy, color: '#166534' },
          { label: 'Unassigned complaints', value: unassigned, color: '#991b1b' },
        ]}
      />
      <section className="card">
        <div className="card-row"><h2>Staff and workload</h2></div>
        <table>
          <thead><tr><th>NAME</th><th>TRADE</th><th>PHONE</th><th>STATUS</th><th>OPEN COMPLAINTS</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td><b>{r.name}</b></td>
                <td>{r.trade}</td>
                <td>{r.phone}</td>
                <td><span className={`badge ${r.open.length ? 'in-progress' : 'resolved'}`}>{r.open.length ? 'Busy' : 'Available'}</span></td>
                <td>
                  {r.open.length === 0 && <span className="muted">None</span>}
                  {r.open.map((c, i) => (
                    <span key={c.id}>{i > 0 && ', '}<Link to={`/complaint/${c.id}`}>{c.id}</Link></span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  );
}
