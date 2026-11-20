import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import StatCards from '../components/StatCards.jsx';
import Bars from '../components/Bars.jsx';
import { api } from '../api/api.js';
import { CATEGORIES } from '../data/mockData.js';
import { countBy } from '../utils.js';

// Turns a list into [{ label, value }] counts for one field
const tally = (list, field, labels) => labels.map((label) => ({ label, value: countBy(list, field, label) }));

export default function AdminReports() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => { api.getComplaints().then(setComplaints); }, []);

  const resolved = countBy(complaints, 'status', 'Resolved');
  const rate = complaints.length ? Math.round((resolved / complaints.length) * 100) : 0;

  // Locations that appear more than once (repeat problems)
  const places = {};
  complaints.forEach((c) => { places[c.location] = (places[c.location] || 0) + 1; });
  const repeats = Object.entries(places).filter(([, n]) => n > 1).map(([label, value]) => ({ label, value }));

  // Download every complaint as a CSV file
  function exportCsv() {
    const columns = ['id', 'title', 'category', 'location', 'priority', 'status', 'assignedTo', 'reportedBy'];
    const lines = [columns.join(',')].concat(
      complaints.map((c) => columns.map((col) => '"' + String(c[col] ?? '').replace(/"/g, '""') + '"').join(','))
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    link.download = 'fixora-complaints.csv';
    link.click();
  }

  return (
    <Layout title="Reports & Analytics" subtitle="Spot patterns and plan maintenance">
      <StatCards
        items={[
          { label: 'Total complaints', value: complaints.length },
          { label: 'Resolution rate', value: rate + '%', color: '#166534' },
          { label: 'Open complaints', value: complaints.length - resolved },
          { label: 'High priority', value: countBy(complaints, 'priority', 'High'), color: '#991b1b' },
        ]}
      />
      <div className="columns">
        <section className="card col-main"><h2>Complaints by category</h2><Bars rows={tally(complaints, 'category', CATEGORIES)} /></section>
        <section className="card col-main"><h2>Complaints by priority</h2><Bars rows={tally(complaints, 'priority', ['High', 'Medium', 'Low'])} /></section>
        <section className="card col-main"><h2>Complaints by status</h2><Bars rows={tally(complaints, 'status', ['Pending', 'In progress', 'Resolved'])} /></section>
        <section className="card col-main">
          <h2>Locations with repeat complaints</h2>
          {repeats.length ? <Bars rows={repeats} /> : <p className="muted">No repeat locations yet.</p>}
        </section>
      </div>
      <div><button className="btn primary" onClick={exportCsv}>Download all complaints (CSV)</button></div>
    </Layout>
  );
}
