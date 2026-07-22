import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldPlus, UserCog } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/admins/');
      setAdmins(data);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error('Failed to load admin accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdmins();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setCreating(true);
    try {
      await api.post('/admin/admins/', form);
      toast.success(`Admin account created — credentials emailed to ${form.email}`);
      setForm({ name: '', email: '', password: '' });
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create admin account');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Create New Admin</span>
          <ShieldPlus size={16} />
        </div>
        <form onSubmit={handleCreate} className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))} placeholder="e.g. W.M. Perera" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))} placeholder="admin@example.com" />
          </div>
          <div className="form-group">
            <label>Initial Password (optional)</label>
            <input value={form.password} onChange={(event) => setForm((c) => ({ ...c, password: event.target.value }))} placeholder="Leave blank to auto-generate" />
          </div>
          <div className="modal-footer" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Admin & Email Credentials'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Existing Admins</span>
          <UserCog size={16} />
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email / Username</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>{new Date(admin.date_joined).toLocaleDateString()}</td>
                    <td>{admin.is_you && <span className="badge badge-blue">You</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}