import { useEffect, useState } from 'react';
import CrudPage from './CrudPage';
import { groups, students } from '../api';
import toast from 'react-hot-toast';

const fields = [
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'registration_number', label: 'Reg. No.' },
  { key: 'student_group', label: 'Group' },
  { key: 'enrolled_subjects', label: 'Courses' },
  { key: 'contact_number', label: 'Contact' },
  { key: 'email', label: 'Email' },
];

function formatGroup(studentGroup) {
  if (!studentGroup) return 'Not assigned';
  return studentGroup.display || studentGroup.name || `Group ${studentGroup.id}`;
}

export default function Students() {
  const [studentGroups, setStudentGroups] = useState([]);

  useEffect(() => {
    let active = true;

    groups.list().then((response) => {
      if (active) {
        setStudentGroups(response.data);
      }
    }).catch(() => {
      if (active) {
        setStudentGroups([]);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CrudPage
      title="Students"
      api={students}
      fields={fields}
      rowRenderer={(item) => (
        <>
          <td>{item.username}</td>
          <td>{item.name}</td>
          <td>{item.registration_number || '—'}</td>
          <td>{formatGroup(item.student_group)}</td>
          <td>{item.enrolled_subjects?.length ?? 0}</td>
          <td>{item.contact_number || '—'}</td>
          <td>{item.email || '—'}</td>
        </>
      )}
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

        const handleRegChange = (val) => {
          setForm(prev => ({
            ...prev,
            registration_number: val,
            username: isEditing ? prev.username : val
          }));
        };

        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Registration Number (Username)</label>
                <input
                  value={form.registration_number || ''}
                  onChange={(event) => handleRegChange(event.target.value)}
                  placeholder="e.g. SC/2026/001"
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  value={form.name || ''}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Student full name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>{isEditing ? 'Reset Password (optional)' : 'Initial Password'}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={form.password || ''}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password or auto-generate'}
                    style={{ flex: 1 }}
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={generatePassword}
                      style={{ border: '1px solid var(--border)' }}
                    >
                      Auto-Generate
                    </button>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Student Group</label>
                <select
                  value={form.student_group_id ?? ''}
                  onChange={(event) => setForm({ ...form, student_group_id: event.target.value ? Number(event.target.value) : null })}
                >
                  <option value="">No group assigned</option>
                  {studentGroups.map((studentGroup) => (
                    <option key={studentGroup.id} value={studentGroup.id}>
                      {studentGroup.display || studentGroup.name || `Group ${studentGroup.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="student@example.com"
                />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  value={form.contact_number || ''}
                  onChange={(event) => setForm({ ...form, contact_number: event.target.value })}
                  placeholder="07xxxxxxxx"
                />
              </div>
            </div>

            {isEditing && (
              <div className="form-row">
                <div className="form-group">
                  <label>Force Password Change</label>
                  <select
                    value={String(Boolean(form.must_change_password))}
                    onChange={(event) => setForm({ ...form, must_change_password: event.target.value === 'true' })}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
            )}
          </>
        );
      }}
    />
  );
}
