import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, GraduationCap, Upload, UserRound } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function downloadTemplate(mode) {
  try {
    const endpoint = mode === 'student' ? '/admin/students/bulk-template/' : '/admin/lecturers/bulk-template/';
    const response = await api.get(endpoint, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = mode === 'student' ? 'student_bulk_template.xlsx' : 'lecturer_bulk_template.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    toast.error('Unable to download template');
  }
}

export default function BulkUpload() {
  const [mode, setMode] = useState('student'); // 'student' | 'lecturer'
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    setFile(selected || null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const payload = new FormData();
    payload.append('file', file);

    const endpoint = mode === 'student' ? '/admin/students/bulk-upload/' : '/admin/lecturers/bulk-upload/';

    setUploading(true);
    setResult(null);
    try {
      const { data } = await api.post(endpoint, payload);
      setResult(data);
      if (data.failed_count === 0) {
        toast.success(`${data.success_count} accounts added and credentials emailed successfully`);
      } else {
        toast.error(`${data.success_count} succeeded, ${data.failed_count} failed — see details below`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Unable to process bulk upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Bulk Registration</span>
          <Upload size={16} />
        </div>

        <div className="role-tabs" style={{ maxWidth: 320, marginBottom: 20 }}>
          <button type="button" className={`role-tab${mode === 'student' ? ' active' : ''}`} onClick={() => { setMode('student'); setFile(null); setResult(null); }}>
            <GraduationCap size={14} /> Students
          </button>
          <button type="button" className={`role-tab${mode === 'lecturer' ? ' active' : ''}`} onClick={() => { setMode('lecturer'); setFile(null); setResult(null); }}>
            <UserRound size={14} /> Lecturers
          </button>
        </div>

        <div className="login-note-box" style={{ marginBottom: 20 }}>
          <div className="login-note-title">How it works</div>
          <div className="login-note" style={{ textAlign: 'left' }}>
            Download the template below, fill in one row per {mode}, then upload it here. The
            template includes dropdown validation for Level/Stream to prevent typos. Each account
            is created with a randomly generated password, and that person is emailed their own
            login details individually.
          </div>
        </div>

        <button className="btn btn-ghost" type="button" onClick={() => downloadTemplate(mode)} style={{ marginBottom: 20 }}>
          <Download size={14} /> Download {mode === 'student' ? 'Student' : 'Lecturer'} Template (.xlsx)
        </button>

        <div className="form-group">
          <label>Upload filled file (.xlsx or .csv)</label>
          <input type="file" accept=".xlsx,.csv" onChange={handleFileChange} />
        </div>

        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? 'Uploading & Sending Emails...' : 'Upload & Register All'}
        </button>
      </div>

      {result && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Results</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-green">{result.success_count} succeeded</span>
              {result.failed_count > 0 && <span className="badge badge-amber">{result.failed_count} failed</span>}
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Name</th>
                  <th>{mode === 'student' ? 'Registration No.' : 'Lecturer ID'}</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((row) => (
                  <tr key={row.row}>
                    <td>{row.row}</td>
                    <td>{row.name || '—'}</td>
                    <td>{row.registration_number || row.lecturer_id || '—'}</td>
                    <td>
                      <span className={row.status === 'success' ? 'badge badge-green' : 'badge badge-amber'}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.status === 'success' ? `Emailed to ${row.email}` : row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}