import { useState, useEffect } from "react";
import {
  Bell,
  History,
  GraduationCap,
  LayoutDashboard,
  Table2,
  Layers3,
  Upload,
  BarChart3,
  HelpCircle,
  Settings,
  LogOut,
  CalendarDays,
  Clock3,
  Building2,
  Info,
  Plus,
  Mail,
  Save,
  Pencil,
  Loader,
} from "lucide-react";
import { systemSettingsApi, venueDefaultsApi } from "../api";
import toast from "react-hot-toast";

const initialVenues = [
  {
    id: 1,
    department: "Department of Physics",
    venue: "Physics Lecture Theater (PLT)",
    priority: "HIGH",
  },
  {
    id: 2,
    department: "Department of Computer Science",
    venue: "Computer Science Hall 01 (CSH1)",
    priority: "HIGH",
  },
  {
    id: 3,
    department: "Department of Mathematics",
    venue: "Science Auditorium",
    priority: "MEDIUM",
  },
];

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    academicYear: "2024/2025",
    semesterType: "First Semester",
    teachingStart: "2024-09-02",
    teachingEnd: "2024-12-15",
    standardLecture: true,
    laboratorySession: true,
    tutorialWorkshop: false,
    conflictAlerts: true,
    publicationConfirmations: true,
    emailList: "faculty-staff@ruh.ac.lk",
  });

  const [venues, setVenues] = useState(initialVenues);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadVenues();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await systemSettingsApi.get();
      setSettings({
        academicYear: response.data.academic_year,
        semesterType: response.data.semester_type,
        teachingStart: response.data.teaching_start,
        teachingEnd: response.data.teaching_end,
        standardLecture: response.data.standard_lecture,
        laboratorySession: response.data.laboratory_session,
        tutorialWorkshop: response.data.tutorial_workshop,
        conflictAlerts: response.data.conflict_alerts,
        publicationConfirmations: response.data.publication_confirmations,
        emailList: response.data.email_list,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  const loadVenues = async () => {
    try {
      const response = await venueDefaultsApi.list();
      if (response.data && response.data.length > 0) {
        setVenues(
          response.data.map((v) => ({
            id: v.id,
            department: v.department,
            venue: v.venue_name,
            venueId: v.venue_id,
            priority: v.priority,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading venues:", error);
    }
  };

  const updateSetting = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        academic_year: settings.academicYear,
        semester_type: settings.semesterType,
        teaching_start: settings.teachingStart,
        teaching_end: settings.teachingEnd,
        standard_lecture: settings.standardLecture,
        laboratory_session: settings.laboratorySession,
        tutorial_workshop: settings.tutorialWorkshop,
        conflict_alerts: settings.conflictAlerts,
        publication_confirmations: settings.publicationConfirmations,
        email_list: settings.emailList,
      };

      await systemSettingsApi.patch(payload);
      setSaved(true);
      toast.success("Settings saved successfully!");
      setTimeout(() => {
        setSaved(false);
      }, 1800);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    loadSettings();
    toast.success("Changes discarded");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3">
          <Loader size={24} className="animate-spin text-blue-600" />
          <p className="text-slate-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <TopBar />
        <div className="p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">System Settings</h1>
              <p className="mt-1 text-sm text-slate-600">
                Configure academic parameters and global scheduling preferences.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : saved ? "Settings Saved" : "Save Global Settings"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.7fr]">
            <SemesterSettings settings={settings} updateSetting={updateSetting} />
            <TimeSlotSettings settings={settings} updateSetting={updateSetting} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.9fr]">
            <VenueSettings venues={venues} setVenues={setVenues} />
            <NotificationSettings settings={settings} updateSetting={updateSetting} />
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#111b31] via-slate-700 to-slate-100 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-bold">Advanced Optimization Engine</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
              The system is currently utilizing the 2024.1 AI-driven constraint
              solver. Global parameters are locked during active solve cycles to
              ensure departmental parity.
            </p>
          </section>

          <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row">
            <span>© 2026 University of Ruhuna · Faculty of Science. All rights reserved.</span>
            <div className="flex gap-5">
              <button>Privacy Policy</button>
              <button>System Audit Logs</button>
              <span>Version 4.2</span>
            </div>
          </footer>
        </div>
      </main>

      <button className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700">
        <Save size={22} />
      </button>
    </div>
  );
}

function Sidebar() {
  const items = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Timetable Grid", icon: Table2 },
    { label: "Academic Structure", icon: Layers3 },
    { label: "Publication", icon: Upload },
    { label: "Reports", icon: BarChart3 },
  ];

  return (
    <aside className="hidden min-h-screen w-64 flex-col bg-[#111b31] text-slate-300 lg:flex">
      <div className="px-6 py-6">
        <h2 className="text-base font-bold text-white">Faculty of Science</h2>
        <p className="mt-1 text-[10px] text-blue-200">Timetable System</p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {items.map(({ label, icon: Icon }) => (
            <li key={label}>
              <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm hover:bg-white/10 hover:text-white">
                <Icon size={17} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-3 py-5">
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-white/10">
          <HelpCircle size={17} />
          Help Center
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg bg-slate-600/70 px-4 py-3 text-sm text-white">
          <Settings size={17} />
          Settings
        </button>
        <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-300 hover:bg-red-500/10">
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
      <div className="flex items-center gap-8">
        <h2 className="text-lg font-semibold text-slate-950">Timetable Manager</h2>
        <div className="hidden items-center gap-6 text-xs text-slate-500 md:flex">
          <button className="font-medium text-slate-800">Current Semester</button>
          <button>Exam Period</button>
          <button>Archives</button>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <Bell size={19} className="text-slate-500" />
        <History size={19} className="text-slate-500" />
        <div className="hidden h-8 w-px bg-slate-200 md:block" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold text-slate-900">Admin User</p>
            <p className="text-[10px] text-slate-400">System Registrar</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-slate-700 text-white">
            <GraduationCap size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}

function SemesterSettings({ settings, updateSetting }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={19} className="text-blue-600" />
          <h2 className="font-semibold text-slate-950">Semester Dates & Milestones</h2>
        </div>
        <span className="rounded bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-600">
          ACTIVE CYCLE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
        <FormSelect
          label="Academic Year"
          name="academicYear"
          value={settings.academicYear}
          onChange={updateSetting}
          options={["2024/2025", "2025/2026", "2026/2027"]}
        />

        <div>
          <label className="mb-2 block text-xs font-medium uppercase text-slate-600">
            Semester Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["First Semester", "Second Semester"].map((semester) => (
              <button
                key={semester}
                type="button"
                onClick={() =>
                  updateSetting({
                    target: {
                      name: "semesterType",
                      value: semester,
                      type: "text",
                    },
                  })
                }
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                  settings.semesterType === semester
                    ? "border-slate-700 bg-slate-700 text-white"
                    : "border-slate-200 bg-white text-slate-800"
                }`}
              >
                {semester}
              </button>
            ))}
          </div>
        </div>

        <FormInput
          label="Teaching Period Start"
          type="date"
          name="teachingStart"
          value={settings.teachingStart}
          onChange={updateSetting}
        />

        <FormInput
          label="Teaching Period End"
          type="date"
          name="teachingEnd"
          value={settings.teachingEnd}
          onChange={updateSetting}
        />
      </div>

      <div className="flex gap-3 border-t border-slate-200 bg-slate-100 px-5 py-4">
        <Info size={19} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-xs italic leading-5 text-slate-600">
          Changing these dates will automatically shift the generation range for all recurring
          laboratory sessions.
        </p>
      </div>
    </section>
  );
}

function TimeSlotSettings({ settings, updateSetting }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <Clock3 size={19} className="text-blue-600" />
        <h2 className="font-semibold text-slate-950">Time Slot Definitions</h2>
      </div>

      <div className="space-y-3 p-5">
        <CheckOption
          title="Standard Lecture"
          description="Fixed 50-minute blocks"
          name="standardLecture"
          checked={settings.standardLecture}
          onChange={updateSetting}
        />

        <CheckOption
          title="Laboratory Session"
          description="Extended 3-hour blocks"
          name="laboratorySession"
          checked={settings.laboratorySession}
          onChange={updateSetting}
        />

        <CheckOption
          title="Tutorial Workshop"
          description="Flexible 1–2 hour blocks"
          name="tutorialWorkshop"
          checked={settings.tutorialWorkshop}
          onChange={updateSetting}
          disabled
        />

        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600">
          <Plus size={16} />
          Add Custom Duration
        </button>
      </div>
    </section>
  );
}

function VenueSettings({ venues, setVenues }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ department: "", venue: "", priority: "MEDIUM" });

  const handleAdd = async () => {
    if (!formData.department || !formData.venue) {
      toast.error("Department and venue are required");
      return;
    }

    try {
      const response = await venueDefaultsApi.create({
        department: formData.department,
        venue: formData.venue,
        priority: formData.priority,
      });
      setVenues([
        ...venues,
        {
          id: response.data.id,
          department: response.data.department,
          venue: response.data.venue_name,
          venueId: response.data.venue_id,
          priority: response.data.priority,
        },
      ]);
      setFormData({ department: "", venue: "", priority: "MEDIUM" });
      setShowForm(false);
      toast.success("Venue added successfully");
    } catch (error) {
      console.error("Error adding venue:", error);
      toast.error("Failed to add venue");
    }
  };

  const handleUpdate = async (id) => {
    if (!formData.department || !formData.venue) {
      toast.error("Department and venue are required");
      return;
    }

    try {
      const response = await venueDefaultsApi.update(id, {
        department: formData.department,
        venue: formData.venue,
        priority: formData.priority,
      });
      setVenues(
        venues.map((v) =>
          v.id === id
            ? {
                id: response.data.id,
                department: response.data.department,
                venue: response.data.venue_name,
                venueId: response.data.venue_id,
                priority: response.data.priority,
              }
            : v
        )
      );
      setEditingId(null);
      setFormData({ department: "", venue: "", priority: "MEDIUM" });
      toast.success("Venue updated successfully");
    } catch (error) {
      console.error("Error updating venue:", error);
      toast.error("Failed to update venue");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this venue?")) return;

    try {
      await venueDefaultsApi.remove(id);
      setVenues(venues.filter((v) => v.id !== id));
      toast.success("Venue deleted successfully");
    } catch (error) {
      console.error("Error deleting venue:", error);
      toast.error("Failed to delete venue");
    }
  };

  const handleEdit = (venue) => {
    setEditingId(venue.id);
    setFormData({
      department: venue.department,
      venue: venue.venueId || venue.venue,
      priority: venue.priority,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ department: "", venue: "", priority: "MEDIUM" });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Building2 size={19} className="text-blue-600" />
          <h2 className="font-semibold text-slate-950">Departmental Default Venues</h2>
        </div>
        {!showForm && editingId === null && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            + Add Venue
          </button>
        )}
      </div>

      {(showForm || editingId !== null) && (
        <div className="border-b border-slate-200 bg-slate-50 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormInput
              label="Department"
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Department of Physics"
            />
            <FormInput
              label="Venue ID/Code"
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g., PLT-01"
            />
            <div>
              <label className="mb-2 block text-xs font-medium uppercase text-slate-600">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => (editingId !== null ? handleUpdate(editingId) : handleAdd())}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editingId !== null ? "Update" : "Add"} Venue
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="bg-slate-100 text-xs uppercase text-slate-700">
              <th className="px-5 py-4 font-semibold">Department</th>
              <th className="px-5 py-4 font-semibold">Primary Lecture Hall</th>
              <th className="px-5 py-4 font-semibold">Priority</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>

          <tbody>
            {venues.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-5 py-8 text-center text-sm text-slate-500">
                  No venues configured. Add a departmental default venue to get started.
                </td>
              </tr>
            ) : (
              venues.map((venue) => (
                <tr key={venue.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 text-sm text-slate-900">{venue.department}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{venue.venue}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-semibold ${
                        venue.priority === "HIGH"
                          ? "bg-emerald-50 text-emerald-600"
                          : venue.priority === "MEDIUM"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {venue.priority}
                    </span>
                  </td>
                  <td className="flex justify-end gap-2 px-5 py-4">
                    <button
                      onClick={() => handleEdit(venue)}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(venue.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NotificationSettings({ settings, updateSetting }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <Bell size={19} className="text-blue-600" />
        <h2 className="font-semibold text-slate-950">Notification Preferences</h2>
      </div>

      <div className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Administrator Alerts
        </p>

        <div className="mt-4 space-y-4">
          <CheckOption
            title="Conflict Auto-Detections"
            description="Receive instant alerts when a scheduling conflict is detected."
            name="conflictAlerts"
            checked={settings.conflictAlerts}
            onChange={updateSetting}
          />

          <CheckOption
            title="Publication Confirmations"
            description="Get a summary report after every global timetable publication."
            name="publicationConfirmations"
            checked={settings.publicationConfirmations}
            onChange={updateSetting}
          />
        </div>

        <div className="my-5 border-t border-slate-200" />

        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Faculty Sync
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-100 p-4">
          <Mail size={19} />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Email Distribution List</p>
          </div>
          <input
            name="emailList"
            value={settings.emailList}
            onChange={updateSetting}
            className="w-40 bg-transparent text-xs font-semibold text-blue-700 outline-none"
          />
        </div>

        <p className="mt-4 text-[10px] italic leading-5 text-slate-500">
          Lecturers are notified automatically 48 hours before the start of the new semester.
        </p>
      </div>
    </section>
  );
}

function CheckOption({
  title,
  description,
  name,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        disabled ? "border-slate-200 bg-slate-50 opacity-50" : "border-slate-200 bg-white"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-4 w-4 accent-blue-600"
      />
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-[10px] text-slate-500">{description}</p>
      </div>
    </label>
  );
}

function FormInput({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase text-slate-600">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}

function FormSelect({ label, options, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase text-slate-600">
        {label}
      </label>
      <select
        {...props}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
