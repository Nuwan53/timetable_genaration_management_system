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

  const load = () => { setLoading(true); api.list().then(r => { setItems(r.data); setLoading(false); }); };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm({}); setShowForm(true); };
  const openEdit   = (item) => { setEditing(item); setForm(item); setShowForm(true); };

  const save = async () => {
    try {
      if (editing) await api.update(editing.id, form);
      else         await api.create(form);
      toast.success(editing ? 'Updated!' : 'Created!');
      setShowForm(false); load();
    } catch(e) {
      const msg = e.response?.data;
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
    </div>
  );
}
