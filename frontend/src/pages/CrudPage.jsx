import { useEffect, useState, useMemo } from 'react';
import { Pencil, Trash2, Plus, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDelete from '../components/ConfirmDelete';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function CrudPage({ title, api, fields, rowRenderer, formRenderer, filters = [], defaultForm = {} }) {  const titleMap = { Courses: 'Course', Lecturers: 'Lecturer', Venues: 'Venue', 'Student Groups': 'Student group', 'Time Slots': 'Time slot' };
  const singularTitle = titleMap[title] || 'Item';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({});
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const itemsPerPage = 10;

  const load = () => {
    setLoading(true);
    api.list()
      .then((r) => {
        setItems(r.data);
        setCurrentPage(1);
      })
      .catch((e) => {
        const msg = e?.response?.data?.detail || e?.response?.data?.message || `Unable to load ${title.toLowerCase()}`;
        toast.error(typeof msg === 'string' ? msg : `Unable to load ${title.toLowerCase()}`);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filterOptions = useMemo(() => {
    const options = {};
    filters.forEach(filter => {
      const vals = items.map(item => {
        let val = item[filter.key];
        if (val == null) return '';
        if (typeof val === 'object') return val.display || val.name || val.code || val.id || '';
        return String(val);
      }).filter(Boolean);
      options[filter.key] = [...new Set(vals)].sort();
    });
    return options;
  }, [items, filters]);

  const filteredItems = useMemo(() => {
    const lowerTerm = searchTerm.trim().toLowerCase();
    return items.filter(item => {
      // Search Match
      if (lowerTerm) {
        const matchesSearch = fields.some(f => {
          let val = item[f.key];
          if (val == null) return '';
          if (typeof val === 'object') val = val.name || val.code || val.display || val.title || '';
          return String(val).toLowerCase().includes(lowerTerm);
        });
        if (!matchesSearch) return false;
      }

      // Filter Match
      if (filters.length > 0) {
        for (let filter of filters) {
          const activeVal = activeFilters[filter.key];
          if (activeVal) {
            let val = item[filter.key];
            let strVal = '';
            if (val != null) {
              if (typeof val === 'object') {
                strVal = String(val.display || val.name || val.code || val.id || '');
              } else {
                strVal = String(val);
              }
            }
            if (strVal !== activeVal) return false;
          }
        }
      }
      return true;
    });
  }, [items, searchTerm, fields, activeFilters, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearAllFiltersAndSearch = () => {
    setSearchTerm('');
    setActiveFilters({});
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = startPage + maxPages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

const openCreate = () => { setEditing(null); setForm({ ...defaultForm }); setShowForm(true); };  const openEdit   = (item) => { setEditing(item); setForm(item); setShowForm(true); };

  const save = async () => {
    try {
      if (editing) {
        await api.update(editing.id, form);
        toast.success(`${singularTitle} updated successfully`);
        setShowForm(false);
      } else {
        const res = await api.create(form);
        toast.success(`${singularTitle} added successfully`);
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
      const msg = e.response?.data?.detail || e.response?.data?.message || `Unable to ${editing ? 'update' : 'add'} ${singularTitle.toLowerCase()}`;
      toast.error(typeof msg === 'string' ? msg : `Unable to ${editing ? 'update' : 'add'} ${singularTitle.toLowerCase()}`);
    }
  };

  const confirmDelete = async () => {
    await api.remove(deleting.id);
    toast.success(`${singularTitle} deleted successfully`);
    setDeleting(null); load();
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{title}</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} aria-hidden="true"/> Add New</button>
        </div>

        <div className="crud-toolbar">
          <div className="crud-search">
            <Search className="crud-search-icon" size={16} aria-hidden="true" />
            <input 
              type="search" 
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label={`Search ${title.toLowerCase()}`}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="crud-search-clear" 
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }} 
                aria-label="Clear search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {filters.length > 0 && (
            <div className="crud-filters">
              {filters.map(filter => (
                <select 
                  key={filter.key}
                  className="crud-filter-select"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  aria-label={`Filter by ${filter.label}`}
                >
                  <option value="">{filter.allLabel || `All ${filter.label}`}</option>
                  {(filterOptions[filter.key] || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </div>

        <div className="tbl-wrap">
          <table>
            <thead><tr>{fields.map(f => <th key={f.key}>{f.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <Skeleton columns={fields.length + 1} rows={5} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1} style={{ padding: 0, borderBottom: 'none' }}>
                    <EmptyState title={title} onAction={openCreate} />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1}>
                    <div className="no-search-results">
                      <div>No matching records found</div>
                      {(searchTerm || Object.values(activeFilters).some(v => v !== '')) && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={clearAllFiltersAndSearch} style={{ marginTop: '12px' }}>
                          Clear search and filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map(item => (
                  <tr key={item.id}>
                    {rowRenderer ? rowRenderer(item) : fields.map(f => <td key={f.key}>{item[f.key]}</td>)}
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><Pencil size={13}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(item)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredItems.length > itemsPerPage && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}
            </div>
            <div className="pagination-controls">
              <button 
                type="button"
                className="pagination-btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
              </button>
              
              <div className="pagination-pages">
                {getPageNumbers().map(page => (
                  <button 
                    key={page} 
                    type="button"
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                type="button"
                className="pagination-btn" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
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
              toast.success('Copied to clipboard');
            }} style={{ marginRight: '10px' }}>Copy Credentials</button>
            <button className="btn btn-ghost" onClick={() => setCreatedCredentials(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
