// ===== Sample (mock) data =====
// Used only while USE_MOCK = true in api.js. Your backend replaces this.

const SAMPLE_USERS = {
  student: { role: 'student', name: 'Dheeptha Kansal', roleLabel: 'Student' },
  admin:   { role: 'admin',   name: 'Admin',           roleLabel: 'Administrator' },
};

const CATEGORIES = ['Electrical', 'Plumbing', 'Sanitation', 'Classroom', 'Lab equipment', 'Hostel', 'Other'];
const STAFF = ['R. Kumar (Plumber)', 'S. Verma (AV)', 'M. Singh (Electrician)', 'Housekeeping'];

// Maintenance staff. `key` must match the `assignedTo` text used on complaints.
const STAFF_DETAILS = [
  { name: 'R. Kumar',  trade: 'Plumber',        phone: '98xxxxxx01', key: 'R. Kumar (Plumber)' },
  { name: 'S. Verma',  trade: 'AV technician',  phone: '98xxxxxx02', key: 'S. Verma (AV)' },
  { name: 'M. Singh',  trade: 'Electrician',    phone: '98xxxxxx03', key: 'M. Singh (Electrician)' },
  { name: 'Housekeeping team', trade: 'Cleaning and sanitation', phone: '98xxxxxx04', key: 'Housekeeping' },
];

const COMPLAINTS = [
  { id: 'C-1048', title: 'Sparking switchboard',      category: 'Electrical', location: 'Lab 3, Block A',    priority: 'High',   status: 'Pending',     assignedTo: null,                     reportedBy: 'Sample Student' },
  { id: 'C-1047', title: 'Water leakage in washroom', category: 'Plumbing',   location: 'Hostel B, Floor 2', priority: 'High',   status: 'In progress', assignedTo: 'R. Kumar (Plumber)',     reportedBy: 'Sample Student' },
  { id: 'C-1046', title: 'Projector not working',     category: 'Classroom',  location: 'Room 204',          priority: 'Medium', status: 'In progress', assignedTo: 'S. Verma (AV)',          reportedBy: 'Sample Student' },
  { id: 'C-1045', title: 'Broken bench',              category: 'Other',      location: 'Library',           priority: 'Low',    status: 'Pending',     assignedTo: null,                     reportedBy: 'Sample Student' },
  { id: 'C-1044', title: 'Tube light flickering',     category: 'Electrical', location: 'Corridor, Block C', priority: 'Low',    status: 'Resolved',    assignedTo: 'M. Singh (Electrician)', reportedBy: 'Sample Student' },
  { id: 'C-1043', title: 'Dustbins overflowing',      category: 'Sanitation', location: 'Canteen',           priority: 'Medium', status: 'Resolved',    assignedTo: 'Housekeeping',           reportedBy: 'Sample Student' },
  { id: 'C-1040', title: 'Fan not working',           category: 'Hostel',     location: 'Hostel A, Room 12', priority: 'Medium', status: 'In progress', assignedTo: 'M. Singh (Electrician)', reportedBy: 'Dheeptha Kansal' },
  { id: 'C-1022', title: 'Broken window latch',       category: 'Classroom',  location: 'Room 110',          priority: 'Low',    status: 'Resolved',    assignedTo: 'Housekeeping',           reportedBy: 'Dheeptha Kansal' },
  { id: 'C-1009', title: 'Water cooler leak',         category: 'Plumbing',   location: 'Block B, Floor 1',  priority: 'Medium', status: 'Resolved',    assignedTo: 'R. Kumar (Plumber)',     reportedBy: 'Dheeptha Kansal' },
];

const RECURRING_ISSUES = [
  'Hostel B washroom leak: 4 reports in 30 days',
  'Block A Lab 3 wiring: 3 reports',
];

const SAMPLE_COMMENTS = {
  'C-1047': [
    { author: 'R. Kumar', text: 'Pipe joint corroded, replacing today.' },
    { author: 'Admin',    text: 'Marked as recurring, inspection queued.' },
  ],
};
