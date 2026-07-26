import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookMarked, Save } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Curriculum() {
  const [groupsList, setGroupsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [groupsRes, coursesRes] = await Promise.all([
          api.get('/groups/'),
          api.get('/courses/'),
        ]);
        setGroupsList(groupsRes.data);
        setCoursesList(coursesRes.data);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error('Failed to load groups/courses');
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (!groupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCourseIds([]);
      return;
    }
    const loadCurriculum = async () => {
      setLoadingCurriculum(true);
      try {
        const { data } = await api.get('/admin/curriculum/', { params: { group_id: groupId } });
        setSelectedCourseIds(data.course_ids);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error('Failed to load curriculum for this group');
      } finally {
        setLoadingCurriculum(false);
      }
    };
    loadCurriculum();
  }, [groupId]);

  const toggleCourse = (courseId) => {
    setSelectedCourseIds((current) =>
      current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]
    );
  };

  const handleSave = async () => {
    if (!groupId) {
      toast.error('Select a student group first');
      return;
    }
    setSaving(true);
    try {
      await api.put('/admin/curriculum/', { group_id: groupId, course_ids: selectedCourseIds });
      toast.success('Curriculum updated — every student in this group will see it immediately');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save curriculum');
    } finally {
      setSaving(false);
    }
  };

  const selectedGroup = groupsList.find((g) => String(g.id) === String(groupId));

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Curriculum</span>
          <BookMarked size={16} />
        </div>

        <div className="login-note-box" style={{ marginBottom: 20 }}>
          <div className="login-note-title">What this does</div>
          <div className="login-note" style={{ textAlign: 'left' }}>
            Defines which subjects belong to each student group — independent of the Timetable.
            A student's "Enrolled Subjects" always reflects this list, even before any of those
            courses have a scheduled time slot.
          </div>
        </div>

        <div className="form-group" style={{ maxWidth: 400, marginBottom: 20 }}>
          <label>Student Group</label>
          <select value={groupId} onChange={(event) => setGroupId(event.target.value)} disabled={loadingOptions}>
            <option value="">{loadingOptions ? 'Loading...' : 'Select a group'}</option>
            {groupsList.map((group) => (
              <option key={group.id} value={group.id}>
                {group.display || `${group.level} · ${group.stream} ${group.subgroup ? `(${group.subgroup})` : ''}`}
              </option>
            ))}
          </select>
        </div>

        {groupId && (
          <>
            {loadingCurriculum ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                  Subjects for {selectedGroup?.display || 'this group'}
                  <span className="badge badge-blue" style={{ marginLeft: 8 }}>{selectedCourseIds.length} selected</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, marginBottom: 20 }}>
                  {coursesList.map((course) => {
                    const checked = selectedCourseIds.includes(course.id);
                    return (
                      <label
                        key={course.id}
                        className="stat-card"
                        style={{
                          cursor: 'pointer',
                          padding: 12,
                          border: checked ? '1px solid #2563eb' : '1px solid rgba(208,220,232,0.8)',
                          background: checked ? '#eff6ff' : '#fff',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCourse(course.id)}
                          style={{ marginRight: 4 }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{course.code}</div>
                          <div className="stat-lbl">{course.name}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Curriculum'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}