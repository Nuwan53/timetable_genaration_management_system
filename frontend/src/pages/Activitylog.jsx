import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ScrollText } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ACTION_BADGES = {
  CREATE: 'badge-green',
  UPDATE: 'badge-blue',
  DELETE: 'badge-amber',
  PUBLISH: 'badge-green',
  UNPUBLISH: 'badge-amber',
  BULK_UPLOAD: 'badge-blue',
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadLogs = async () => {
      setLoading(true);
      try {
        const params = {};
        if (actionFilter) params.action = actionFilter;
        if (modelFilter) params.model_name = modelFilter;
        const { data } = await api.get('/admin/activity-log/', { params });
        if (!cancelled) setLogs(data);
      } catch {
        if (!cancelled) toast.error('Failed to load activity log');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, [actionFilter, modelFilter]);

  const uniqueModels = [...new Set(logs.map((l) => l.model_name))].sort();

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Activity Log</span>
          <ScrollText size={16} />
        </div>

        <div className="tt-controls">
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label>Action</label>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">All actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="PUBLISH">Publish</option>
              <option value="UNPUBLISH">Unpublish</option>
              <option value="BULK_UPLOAD">Bulk Upload</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
            <label>Model</label>
            <select value={modelFilter} onChange={(e) => setModelFilter(e.target.value)}>
              <option value="">All models</option>
              {uniqueModels.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div style={{ color: '#64748b', padding: '12px 0' }}>No activity recorded yet.</div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>Model</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>{log.actor_name}</td>
                    <td>
                      <span className={`badge ${ACTION_BADGES[log.action] || 'badge-blue'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.model_name}</td>
                    <td>
                      {log.object_repr}
                      {log.details && <div className="stat-lbl" style={{ marginTop: 2 }}>{log.details}</div>}
                    </td>
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