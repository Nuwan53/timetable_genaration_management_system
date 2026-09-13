import CrudPage from './CrudPage';
import { lecturers } from '../api';
import toast from 'react-hot-toast';

const fields = [
  {key:'lecturer_id', label:'Lecturer ID'},
  {key:'name', label:'Name'},
  {key:'email', label:'Email'},
  {key:'department', label:'Department'},
];

export default function Lecturers() {
  return (
    <CrudPage
      title="Lecturers"
      api={lecturers}
      fields={fields}
      filters={[{key: 'department', label: 'Department', allLabel: 'All departments'}]}
      formRenderer={(form, setForm) => {
        const isEditing = Boolean(form.id);

        const generatePassword = () => {
          const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
          let pw = "";
          for (let i = 0; i < 10; i++) {
            pw += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          setForm(prev => ({ ...prev, password: pw }));
          toast.success("Generated random password!");
        };

        return (
          <>
            {!isEditing && (
              <div className="form-group">
                <label>Lecturer ID (Username)</label>
                <input 
                  value={form.lecturer_id || ''} 
                  onChange={e => setForm({ ...form, lecturer_id: e.target.value })}
                  placeholder="e.g. LEC-2026-001 (Leave blank to auto-generate)"
                />
              </div>
            )}
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Full Name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="lecturer@example.com" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Computer Science" />
            </div>
            {!isEditing && (
              <div className="form-group">
                <label>Initial Password</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={form.password || ''}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter initial password or auto-generate"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={generatePassword}
                    style={{ border: '1px solid var(--border)' }}
                  >
                    Auto-Generate
                  </button>
                </div>
              </div>
            )}
          </>
        );
      }}
    />
  );
}
