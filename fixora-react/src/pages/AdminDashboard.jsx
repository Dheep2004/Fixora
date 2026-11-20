import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import StatCards from '../components/StatCards.jsx';
import ComplaintsTable from '../components/ComplaintsTable.jsx';
import Bars from '../components/Bars.jsx';
import { api } from '../api/api.js';
import { CATEGORIES } from '../data/mockData.js';
import { countBy } from '../utils.js';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [recurring, setRecurring] = useState([]);

  useEffect(() => {
    api.getComplaints().then(setComplaints);
    api.getRecurringIssues().then(setRecurring);
  }, []);

  // Newest 6 complaints
  const recent = [...complaints].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 6);

  // Complaint count per category (only categories that have complaints)
  const categoryRows = CATEGORIES
    .map((label) => ({ label, value: countBy(complaints, 'category', label) }))
    .filter((row) => row.value > 0);

  return (
    <Layout title="Admin Dashboard" subtitle="Overview of campus complaints and maintenance">
      <StatCards
        items={[
          { label: 'Pending', value: countBy(complaints, 'status', 'Pending') },
          { label: 'In progress', value: countBy(complaints, 'status', 'In progress'), color: '#1e40af' },
          { label: 'Resolved', value: countBy(complaints, 'status', 'Resolved'), color: '#166534' },
          { label: 'High priority', value: countBy(complaints, 'priority', 'High'), color: '#991b1b' },
        ]}
      />

      <div className="columns">
        <section className="card col-main">
          <div className="card-row"><h2>Recent complaints</h2></div>
          <ComplaintsTable list={recent} />
        </section>

        <div className="col-side">
          <section className="card">
            <h2>Complaints by category</h2>
            <Bars rows={categoryRows} />
          </section>
          <section className="card">
            <h2>Recurring problems</h2>
            <ul className="muted">
              {recurring.map((text) => <li key={text}>{text}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}
