import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatCards from '../components/StatCards.jsx';
import ComplaintsTable from '../components/ComplaintsTable.jsx';
import { api } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { countBy } from '../utils.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    api.getMyComplaints(user.name).then(setComplaints);
  }, [user.name]);

  return (
    <Layout title="Student Dashboard" subtitle="Track the issues you have reported">
      <StatCards
        items={[
          { label: 'Total reported', value: complaints.length },
          { label: 'Pending', value: countBy(complaints, 'status', 'Pending') },
          { label: 'In progress', value: countBy(complaints, 'status', 'In progress'), color: '#1e40af' },
          { label: 'Resolved', value: countBy(complaints, 'status', 'Resolved'), color: '#166534' },
        ]}
      />
      <section className="card">
        <div className="card-row">
          <h2>My complaints</h2>
          <span style={{ marginLeft: 'auto' }} />
          <Link className="btn primary" to="/student/new">New complaint</Link>
        </div>
        <ComplaintsTable list={complaints} />
      </section>
    </Layout>
  );
}
