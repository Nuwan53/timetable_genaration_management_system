import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDelete from '../components/ConfirmDelete';
import toast from 'react-hot-toast';

export default function CrudPage({ title, api, fields, rowRenderer, formRenderer }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({});
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const load = () => { setLoading(true); api.list().then(r => { setItems(r.data); setLoading(false); }); };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm({}); setShowForm(true); };
  const openEdit   = (item) => { setEditing(item); setForm(item); setShowForm(true); };

  const save = async () => {
    try {
      if (editing) {
        await api.update(editing.id, form);
        toast.success('Updated!');
        setShowForm(false);
      } else {
        const res = await api.create(form);
        toast.success('Created!');
        setShowForm(false);
        if (res?.data && (res.data.username || res.data.lecturer_id || res.data.registration_number)) {
          const username = res.data.username || res.data.lecturer_id || res.data.registration_number;
          const password = res.data.password || form.password;
          if (password) {
            setCreatedCredentials({
              name: res.data.name || form.name,
              username,
              password,
              role: res.data.role || (title === 'Lecturers' ? 'LECTURER' : 'STUDENT')
            });
          }
        }
      }
      load();
    } catch(e) {
      const msg = e.response?.data?.detail || e.response?.data;
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const confirmDelete = async () => {
    await api.remove(deleting.id);
    toast.success('Deleted!');
    setDeleting(null); load();
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{title}</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14}/> Add New</button>
        </div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr>{fields.map(f => <th key={f.key}>{f.label}</th>)}<th>Actions</th></tr></thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={fields.length+1} style={{textAlign:'center',color:'#94a3b8',padding:30}}>No records yet. Click "Add New" to start.</td></tr>}
                {items.map(item => (
                  <tr key={item.id}>
                    {rowRenderer ? rowRenderer(item) : fields.map(f => <td key={f.key}>{item[f.key]}</td>)}
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><Pencil size={13}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(item)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editing ? `Edit ${title}` : `New ${title}`} onClose={() => setShowForm(false)}>
          {formRenderer
            ? formRenderer(form, setForm)
            : fields.map(f => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}</label>
                  <input value={form[f.key]||''} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                </div>
              ))
          }
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDelete
          name={deleting.name || deleting.code || `#${deleting.id}`}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      {createdCredentials && (
        <Modal title="Account Created Successfully" onClose={() => setCreatedCredentials(null)}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h4 style={{ color: 'var(--green)', margin: 0 }}>Temporary Login Credentials</h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
            Please copy these credentials and share them with the user. They will be prompted to change their password upon their first login.
          </p>
          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Name:</strong> {createdCredentials.name}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Username / ID:</strong> <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{createdCredentials.username}</code>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Temporary Password:</strong> <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold', color: '#e74c3c' }}>{createdCredentials.password}</code>
            </div>
            <div>
              <strong>Role:</strong> {createdCredentials.role}
            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={() => {
              navigator.clipboard.writeText(`Username: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`);
              toast.success('Copied to clipboard!');
            }} style={{ marginRight: '10px' }}>Copy Credentials</button>
            <button className="btn btn-ghost" onClick={() => setCreatedCredentials(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
