import { useEffect, useState } from 'react';
import CrudPage from './CrudPage';
import { groups, students, slots } from '../api';
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

// A REAL component (not a function called mid-render by CrudPage), so its
// hooks live on their own independent hook list — this is what fixes the
// "change in the order of Hooks" crash.
function GroupEnrollmentPreview({ groupId }) {
  const [groupCourses, setGroupCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    let active = true;
    if (!groupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroupCourses([]);
      return undefined;
    }

    setLoadingCourses(true);
    slots.list({ group: groupId })
      .then((response) => {
        if (!active) return;
        const uniqueCourses = new Map();
        response.data.forEach((slot) => {
          uniqueCourses.set(slot.course.id, slot.course);
        });
        setGroupCourses([...uniqueCourses.values()]);
      })
      .catch(() => {
        if (active) setGroupCourses([]);
      })
      .finally(() => {
        if (active) setLoadingCourses(false);
      });

    return () => { active = false; };
  }, [groupId]);

  if (!groupId) return null;

  return (
    <div className="login-note-box" style={{ marginTop: -4, marginBottom: 14 }}>
      <div className="login-note-title">This student will be enrolled in</div>
      {loadingCourses ? (
        <div className="login-note" style={{ textAlign: 'left' }}>Checking scheduled courses...</div>
      ) : groupCourses.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {groupCourses.map((course) => (
            <span key={course.id} className="badge badge-blue">{course.code}</span>
          ))}
        </div>
      ) : (
        <div className="login-note" style={{ textAlign: 'left' }}>
          No subjects scheduled yet for this group — add them via the Timetable page, and
          every student in this group will pick them up automatically.
        </div>
      )}
    </div>
  );
}

// The form body is also its own component now, for the same reason —
// generatePassword/handleRegChange don't need hooks themselves, but keeping
// the whole form as one real component is the safest pattern going forward.
function StudentFormFields({ form, setForm, studentGroups }) {
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
          <label>Student Group <span style={{ color: '#e74c3c' }}>*</span></label>
          <select
            required
            value={form.student_group_id ?? ''}
            onChange={(event) => setForm({ ...form, student_group_id: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">— Select a group (required) —</option>
            {studentGroups.map((studentGroup) => (
              <option key={studentGroup.id} value={studentGroup.id}>
                {studentGroup.display || studentGroup.name || `Group ${studentGroup.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <GroupEnrollmentPreview groupId={form.student_group_id} />

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
      formRenderer={(form, setForm) => (
        <StudentFormFields form={form} setForm={setForm} studentGroups={studentGroups} />
      )}
    />
  );
}