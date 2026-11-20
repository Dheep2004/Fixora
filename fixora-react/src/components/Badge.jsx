// Coloured label for priority (High/Medium/Low) or status (Pending/In progress/Resolved)
export default function Badge({ text }) {
  return <span className={`badge ${text.toLowerCase().replace(' ', '-')}`}>{text}</span>;
}
