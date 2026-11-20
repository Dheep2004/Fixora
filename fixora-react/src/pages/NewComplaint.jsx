import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Badge from '../components/Badge.jsx';
import { api } from '../api/api.js';
import { CATEGORIES } from '../data/mockData.js';
import { useAuth } from '../context/AuthContext.jsx';
import { suggestPriority } from '../utils.js';

export default function NewComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ category: CATEGORIES[0], block: '', room: '', title: '', description: '' });
  const [photos, setPhotos] = useState([]);          // TODO: send as FormData when the backend is ready
  const [duplicate, setDuplicate] = useState(null);
  const [submittedId, setSubmittedId] = useState(null);

  // Returns a function that updates one field of the form
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  // Priority is suggested live from the title and description
  const priority = suggestPriority(form.title + ' ' + form.description);

  // Warn if the same place already has an open complaint
  async function checkDuplicate() {
    if (!form.block.trim() || !form.room.trim()) { setDuplicate(null); return; }
    setDuplicate(await api.checkDuplicate(`${form.room.trim()}, ${form.block.trim()}`));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const complaint = await api.createComplaint({
      title: form.title,
      description: form.description,
      category: form.category,
      location: `${form.room}, ${form.block}`,
      priority,
      reportedBy: user.name,
    });
    setSubmittedId(complaint.id);
    setTimeout(() => navigate('/student'), 1200);
  }

  return (
    <Layout title="Submit a Complaint" subtitle="Tell us what is wrong and where">
      <div className="columns">
        <form className="card col-main" onSubmit={handleSubmit}>
          <div>Category</div>
          <div className="chips">
            {CATEGORIES.map((name, i) => (
              <span key={name}>
                <input type="radio" name="category" id={`cat-${i}`} value={name}
                  checked={form.category === name} onChange={update('category')} />
                <label htmlFor={`cat-${i}`}>{name}</label>
              </span>
            ))}
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="block">Block / Building</label>
              <input id="block" required placeholder="Block A" value={form.block}
                onChange={update('block')} onBlur={checkDuplicate} />
            </div>
            <div>
              <label htmlFor="room">Room / Area</label>
              <input id="room" required placeholder="Lab 3" value={form.room}
                onChange={update('room')} onBlur={checkDuplicate} />
            </div>
          </div>

          <label htmlFor="title">Issue title</label>
          <input id="title" required placeholder="Switchboard sparking near the door" value={form.title} onChange={update('title')} />

          <label htmlFor="description">Description</label>
          <textarea id="description" rows="4" required value={form.description} onChange={update('description')} />

          <label htmlFor="photos">Photos (optional)</label>
          <input id="photos" type="file" accept="image/*" multiple onChange={(e) => setPhotos([...e.target.files])} />
          {photos.length > 0 && <p className="muted">{photos.length} photo(s) selected</p>}

          <div className="card-row" style={{ marginTop: 18 }}>
            <span className="muted">Auto-suggested priority:</span> <Badge text={priority} />
            <span style={{ marginLeft: 'auto' }} />
            <button className="btn primary" type="submit">Submit complaint</button>
          </div>
          {submittedId && <p className="alert success">Complaint {submittedId} submitted. Redirecting to your dashboard...</p>}
        </form>

        <div className="col-side">
          {duplicate && (
            <section className="alert">
              <b>Similar complaint found</b>
              <p>{duplicate.id} "{duplicate.title}" is already {duplicate.status}. Follow it instead of filing a duplicate.</p>
              <Link to={`/complaint/${duplicate.id}`}><b>View {duplicate.id}</b></Link>
            </section>
          )}
          <section className="card">
            <h2>Tips</h2>
            <p className="muted">Add the exact room and a clear photo so maintenance can find the problem quickly.
              Words like "spark", "leak" or "fire" raise the priority automatically.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
