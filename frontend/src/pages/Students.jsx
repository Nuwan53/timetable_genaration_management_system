import { useEffect, useState } from 'react';
import CrudPage from './CrudPage';
import { groups, students } from '../api';

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

        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  value={form.username || ''}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  placeholder="student username"
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
              <div className="form-group">
                <label>Registration Number</label>
                <input
                  value={form.registration_number || ''}
                  onChange={(event) => setForm({ ...form, registration_number: event.target.value })}
                  placeholder="REG-2026-001"
                />
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

            <div className="form-row">
              <div className="form-group">
                <label>{isEditing ? 'Reset Password (optional)' : 'Password'}</label>
                <input
                  type="password"
                  value={form.password || ''}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder={isEditing ? 'Leave blank to keep current password' : 'Set initial password'}
                />
              </div>
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
          </>
        );
      }}
    />
  );
}
