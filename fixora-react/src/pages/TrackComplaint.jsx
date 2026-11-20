import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import { api } from '../api/api.js';
import { STAFF } from '../data/mockData.js';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = ['Submitted', 'Assigned', 'In progress', 'Resolved', 'Feedback'];

// How many timeline steps are finished for a complaint
function stepsDone(c) {
  if (c.status === 'Resolved') return 4;
  if (c.status === 'In progress') return 3;
  return c.assignedTo ? 2 : 1;
}

export default function TrackComplaint() {
  const { user } = useAuth();
  const { id } = useParams();                                   // from the URL: /complaint/C-1047
  const complaintId = id || (user.role === 'admin' ? 'C-1047' : 'C-1040');

  const [complaint, setComplaint] = useState(undefined);        // undefined = loading, null = not found
  const [staff, setStaff] = useState(STAFF[0]);
  const [commentText, setCommentText] = useState('');
  const [newComments, setNewComments] = useState([]);           // TODO: save comments through the API

  const load = useCallback(async () => {
    const data = await api.getComplaint(complaintId);
    setComplaint(data);
    if (data && data.assignedTo) setStaff(data.assignedTo);
  }, [complaintId]);

  useEffect(() => { load(); }, [load]);

  async function assign() {
    await api.assignStaff(complaint.id, staff);
    load();
  }
  async function escalate() {
    await api.escalate(complaint.id);
    load();
  }
  function addComment(event) {
    event.preventDefault();
    if (!commentText.trim()) return;
    setNewComments([...newComments, { author: user.name, text: commentText }]);
    setCommentText('');
  }

  if (complaint === undefined) return <Layout title="Complaint" subtitle="Loading..." />;
  if (complaint === null) return <Layout title="Complaint" subtitle="Complaint not found." />;

  const done = stepsDone(complaint);
  const comments = [...(complaint.comments || []), ...newComments];

  return (
    <Layout title={`Complaint ${complaint.id}`} subtitle={`${complaint.title} · ${complaint.location}`}>
      <div className="columns">
        <section className="card col-main">
          <div className="card-row">
            <h2>Status timeline</h2>
            <Badge text={complaint.status} /> <Badge text={complaint.priority} />
          </div>
          {STEPS.map((name, i) => (
            <div className={`step ${i < done ? 'done' : ''}`} key={name}>
              <div className="dot">{i + 1}</div>
              <div><b>{name}</b></div>
            </div>
          ))}
        </section>

        <div className="col-side">
          <section className="card">
            <h2>Details</h2>
            <p className="muted">
              Category: {complaint.category}<br />
              Reported by: {complaint.reportedBy}<br />
              Assigned to: {complaint.assignedTo || 'Unassigned'}
            </p>

            {user.role === 'admin' && (
              <>
                <label htmlFor="staff">Assign to</label>
                <select id="staff" value={staff} onChange={(e) => setStaff(e.target.value)}>
                  {STAFF.map((s) => <option key={s}>{s}</option>)}
                </select>
                <div className="card-row" style={{ marginTop: 12 }}>
                  <button className="btn primary" onClick={assign}>Assign staff</button>
                  <button className="btn" onClick={escalate}>Escalate</button>
                </div>
              </>
            )}
          </section>

          <section className="card">
            <h2>Updates and comments</h2>
            {comments.map((m, i) => (
              <p key={i}><b>{m.author}:</b> <span className="muted">{m.text}</span></p>
            ))}
            <form onSubmit={addComment}>
              <input placeholder="Add a comment and press Enter" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
}
