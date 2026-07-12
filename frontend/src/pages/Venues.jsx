import { useState, useMemo } from 'react';
import {
  Building2,
  FlaskConical,
  MapPin,
  MonitorPlay,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  CheckCircle2,
  Wrench,
  XCircle,
} from 'lucide-react';

// ─── Sample data ────────────────────────────────────────────────────────────
const INITIAL_VENUES = [
  { id: 1, name: 'CS Lab 01',        type: 'Lab',          capacity: 40,  department: 'Computer Science', status: 'Available' },
  { id: 2, name: 'Main Auditorium',  type: 'Lecture Hall', capacity: 120, department: 'Faculty',          status: 'Available' },
  { id: 3, name: 'Physics Lab',      type: 'Lab',          capacity: 35,  department: 'Physics',          status: 'Maintenance' },
  { id: 4, name: 'Lecture Hall A',   type: 'Lecture Hall', capacity: 80,  department: 'Faculty',          status: 'Available' },
  { id: 5, name: 'Bio Sciences Lab', type: 'Lab',          capacity: 30,  department: 'Biology',          status: 'Occupied' },
  { id: 6, name: 'IT Seminar Room',  type: 'Seminar Room', capacity: 50,  department: 'Computer Science', status: 'Available' },
];

const VENUE_TYPES    = ['Lab', 'Lecture Hall', 'Seminar Room', 'Auditorium', 'Studio'];
const DEPARTMENTS    = ['Computer Science', 'Physics', 'Biology', 'Faculty', 'Mathematics', 'Chemistry'];
const STATUS_OPTIONS = ['Available', 'Occupied', 'Maintenance'];

const EMPTY_FORM = { name: '', type: 'Lab', capacity: '', department: 'Computer Science', status: 'Available' };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusStyle(status) {
  switch (status) {
    case 'Available':   return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'Occupied':    return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200';
    case 'Maintenance': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    default:            return 'bg-slate-100 text-slate-600';
  }
}

function StatusIcon({ status }) {
  if (status === 'Available')   return <CheckCircle2 size={13} className="shrink-0" />;
  if (status === 'Maintenance') return <Wrench       size={13} className="shrink-0" />;
  return <XCircle size={13} className="shrink-0" />;
}

function typeIcon(type) {
  if (type === 'Lab')           return <FlaskConical  size={15} className="text-violet-500" />;
  if (type === 'Lecture Hall')  return <MonitorPlay   size={15} className="text-sky-500"    />;
  if (type === 'Auditorium')    return <Users         size={15} className="text-emerald-500"/>;
  return <Building2 size={15} className="text-slate-400" />;
}

// ─── Summary card ─────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-0.5 text-[13px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ────────────────────────────────────────────────────
function VenueModal({ form, setForm, onSave, onClose, isEditing }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name     = 'Venue name is required.';
    if (!form.capacity || form.capacity < 1) e.capacity = 'Capacity must be ≥ 1.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave();
  };

  const field = (id, label, node, err) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {node}
      {err && <p className="text-[11px] text-rose-500">{err}</p>}
    </div>
  );

  const inputCls = (err) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-sky-500/30 ${
      err ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white focus:border-sky-400'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <MapPin size={18} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{isEditing ? 'Edit Venue' : 'Add New Venue'}</h2>
              <p className="text-[12px] text-slate-400">{isEditing ? 'Update venue details' : 'Fill in the details below'}</p>
            </div>
          </div>
          <button
            id="venue-modal-close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-4 px-6 py-5">
          {field('venue-name', 'Venue Name',
            <input
              id="venue-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. CS Lab 01"
              className={inputCls(errors.name)}
            />,
            errors.name
          )}

          <div className="grid grid-cols-2 gap-4">
            {field('venue-type', 'Type',
              <select
                id="venue-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={inputCls()}
              >
                {VENUE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            )}
            {field('venue-capacity', 'Capacity',
              <input
                id="venue-capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="e.g. 40"
                className={inputCls(errors.capacity)}
              />,
              errors.capacity
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('venue-dept', 'Department',
              <select
                id="venue-dept"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className={inputCls()}
              >
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            )}
            {field('venue-status', 'Status',
              <select
                id="venue-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputCls()}
              >
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            id="venue-modal-cancel"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            id="venue-modal-save"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-95"
          >
            <Plus size={15} />
            {isEditing ? 'Save Changes' : 'Add Venue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────
function DeleteModal({ venue, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
          <Trash2 size={20} className="text-rose-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Delete Venue</h2>
        <p className="mt-1 text-sm text-slate-500">
          Are you sure you want to delete <span className="font-semibold text-slate-800">{venue.name}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            id="venue-delete-cancel"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            id="venue-delete-confirm"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function Venues() {
  const [venues, setVenues]           = useState(INITIAL_VENUES);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal]             = useState(null); // null | 'add' | 'edit' | 'delete'
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editId, setEditId]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [nextId, setNextId]           = useState(INITIAL_VENUES.length + 1);

  // ── Derived stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     venues.length,
    halls:     venues.filter((v) => v.type === 'Lecture Hall').length,
    labs:      venues.filter((v) => v.type === 'Lab').length,
    available: venues.filter((v) => v.status === 'Available').length,
  }), [venues]);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return venues.filter((v) => {
      const matchSearch = !q ||
        v.name.toLowerCase().includes(q) ||
        v.department.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q);
      const matchType   = typeFilter   === 'All' || v.type   === typeFilter;
      const matchStatus = statusFilter === 'All' || v.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [venues, search, typeFilter, statusFilter]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setModal('add'); };

  const openEdit = (venue) => {
    setForm({ name: venue.name, type: venue.type, capacity: venue.capacity, department: venue.department, status: venue.status });
    setEditId(venue.id);
    setModal('edit');
  };

  const openDelete = (venue) => { setDeleteTarget(venue); setModal('delete'); };

  const handleSave = () => {
    if (modal === 'add') {
      setVenues((prev) => [...prev, { id: nextId, ...form, capacity: Number(form.capacity) }]);
      setNextId((n) => n + 1);
    } else {
      setVenues((prev) => prev.map((v) => v.id === editId ? { ...v, ...form, capacity: Number(form.capacity) } : v));
    }
    setModal(null);
  };

  const handleDelete = () => {
    setVenues((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    setModal(null);
    setDeleteTarget(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          icon={<MapPin size={22} className="text-sky-600" />}
          label="Total Venues"
          value={stats.total}
          accent="bg-sky-500/10"
        />
        <SummaryCard
          icon={<MonitorPlay size={22} className="text-indigo-600" />}
          label="Lecture Halls"
          value={stats.halls}
          accent="bg-indigo-500/10"
        />
        <SummaryCard
          icon={<FlaskConical size={22} className="text-violet-600" />}
          label="Labs"
          value={stats.labs}
          accent="bg-violet-500/10"
        />
        <SummaryCard
          icon={<CheckCircle2 size={22} className="text-emerald-600" />}
          label="Available Venues"
          value={stats.available}
          accent="bg-emerald-500/10"
        />
      </div>

      {/* ── Table Card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">

        {/* Card header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Venue Directory</h2>
            <p className="text-[13px] text-slate-400">{filtered.length} venue{filtered.length !== 1 ? 's' : ''} found</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
              <Search size={15} className="shrink-0" />
              <input
                id="venue-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search venues…"
                className="w-44 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            {/* Type filter */}
            <select
              id="venue-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="All">All Types</option>
              {VENUE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>

            {/* Status filter */}
            <select
              id="venue-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>

            {/* Add button */}
            <button
              id="venue-add-btn"
              onClick={openAdd}
              className="flex h-10 items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95"
            >
              <Plus size={16} />
              Add Venue
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Venue Name', 'Type', 'Capacity', 'Department', 'Status', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 ${
                      col === 'Actions' ? 'text-right' : ''
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-sm text-slate-400">
                    No venues match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((venue) => (
                <tr
                  key={venue.id}
                  className="group transition hover:bg-slate-50/70"
                >
                  {/* Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        {typeIcon(venue.type)}
                      </div>
                      <span className="font-semibold text-slate-800">{venue.name}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-5 py-4 text-slate-600">{venue.type}</td>

                  {/* Capacity */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users size={13} className="text-slate-400" />
                      {venue.capacity}
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-5 py-4 text-slate-600">{venue.department}</td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusStyle(venue.status)}`}>
                      <StatusIcon status={venue.status} />
                      {venue.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        id={`venue-edit-${venue.id}`}
                        onClick={() => openEdit(venue)}
                        title="Edit venue"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-sky-300 hover:text-sky-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        id={`venue-delete-${venue.id}`}
                        onClick={() => openDelete(venue)}
                        title="Delete venue"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-300 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-3 text-[12px] text-slate-400">
            Showing {filtered.length} of {venues.length} venues
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(modal === 'add' || modal === 'edit') && (
        <VenueModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isEditing={modal === 'edit'}
        />
      )}
      {modal === 'delete' && deleteTarget && (
        <DeleteModal
          venue={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
