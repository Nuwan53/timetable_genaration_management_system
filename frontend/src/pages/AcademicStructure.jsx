import { useMemo, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Table2,
  FolderKanban,
  Layers3,
  Upload,
  BarChart3,
  HelpCircle,
  Settings,
  LogOut,
  Bell,
  History,
  GraduationCap,
  Search,
  PlusCircle,
  UploadCloud,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Pencil,
  Leaf,
  Sigma,
  Building2,
  Users,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { academicStreamsApi, academicLevelsApi, academicPathwaysApi, practicalGroupsApi } from "../api";

const emptyStreamForm = {
  name: "",
  stream_type: "",
  code: "",
  levelName: "",
};

export default function AcademicStructure() {
  const [streams, setStreams] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [streamForm, setStreamForm] = useState(emptyStreamForm);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState(null);

  useEffect(() => {
    loadStreams();
    loadSummary();
  }, []);

  const loadStreams = async () => {
    try {
      setLoading(true);
      const response = await academicStreamsApi.list();
      setStreams(response.data);
    } catch (error) {
      console.error("Failed to load streams:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await academicStreamsApi.summary();
      setValidationData(response.data);
    } catch (error) {
      console.error("Failed to load summary:", error);
    }
  };

  const filteredStreams = useMemo(() => {
    if (!search.trim()) return streams;
    const keyword = search.toLowerCase();
    return streams
      .map((stream) => ({
        ...stream,
        levels: stream.levels.filter((level) =>
          `${stream.name} ${level.code} ${level.name} ${level.summary}`
            .toLowerCase()
            .includes(keyword)
        ),
      }))
      .filter(
        (stream) =>
          stream.name.toLowerCase().includes(keyword) || stream.levels.length > 0
      );
  }, [streams, search]);

  const toggleLevel = async (streamId, levelId, currentExpanded) => {
    try {
      // Update locally for immediate UI response
      setStreams((current) =>
        current.map((stream) =>
          stream.id === streamId
            ? {
                ...stream,
                levels: stream.levels.map((level) =>
                  level.id === levelId
                    ? { ...level, expanded: !currentExpanded }
                    : level
                ),
              }
            : stream
        )
      );

      // Sync with backend
      const level = streams
        .find((s) => s.id === streamId)
        ?.levels.find((l) => l.id === levelId);
      if (level) {
        await academicLevelsApi.update(levelId, {
          expanded: !currentExpanded,
        });
      }
    } catch (error) {
      console.error("Failed to toggle level:", error);
    }
  };

  const handleAddStream = async (event) => {
    event.preventDefault();

    try {
      const streamData = {
        name: streamForm.name,
        stream_type: streamForm.stream_type,
        icon: streamForm.stream_type === "Biological" ? "leaf" : "sigma",
      };

      const streamResponse = await academicStreamsApi.create(streamData);

      const levelData = {
        stream: streamResponse.data.id,
        code: streamForm.code.toUpperCase(),
        name: streamForm.levelName,
        summary: "New Level",
      };

      await academicLevelsApi.create(levelData);

      await loadStreams();
      setStreamForm(emptyStreamForm);
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to add stream:", error);
    }
  };

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await academicStreamsApi.import(file);
      await loadStreams();
      event.target.value = "";
    } catch (error) {
      console.error("Failed to import streams:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading academic structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <TopBar search={search} setSearch={setSearch} />
        <div className="p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Hierarchy Management
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">
                Academic Stream Organization
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Configure the structural hierarchy of the faculty, from academic
                streams and levels down to pathways, cohorts and practical
                groups.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                <UploadCloud size={17} />
                Bulk Import
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <PlusCircle size={17} />
                Add New Stream
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {filteredStreams.map((stream) => (
              <StreamSection
                key={stream.id}
                stream={stream}
                toggleLevel={toggleLevel}
              />
            ))}
          </div>

          {filteredStreams.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-600">
                No matching streams or levels found.
              </p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <SummaryCard
              icon={<Users size={19} />}
              title="Student Distribution"
              description="Total students across all streams"
            >
              {validationData && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-slate-600">
                    {validationData.student_distribution?.map((dist) => (
                      <p key={dist.stream}>{dist.stream}: {dist.count} students</p>
                    ))}
                  </div>
                </div>
              )}
            </SummaryCard>

            <SummaryCard
              icon={<Building2 size={19} />}
              title="Academic Streams"
              description="Organizational streams and levels"
            >
              {validationData && (
                <p className="mt-4 text-2xl font-bold text-slate-950">
                  {validationData.total_streams}
                  <span className="ml-2 text-xs font-medium text-slate-600">
                    streams
                  </span>
                </p>
              )}
            </SummaryCard>

            <SummaryCard
              icon={<RefreshCw size={19} />}
              title="Sync Status"
              description="System synchronization status"
            >
              <button className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                FORCE RESYNC
              </button>
            </SummaryCard>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-5 text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                System Online
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Academic Structure Ready
              </span>
            </div>
            <div className="flex justify-end gap-3">
              <button className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Cancel Changes
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Save size={16} />
                {saved ? "Saved Successfully" : "Save Structure"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {modalOpen && (
        <AddStreamModal
          form={streamForm}
          setForm={setStreamForm}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddStream}
        />
      )}
    </div>
  );
}

function Sidebar() {
  const items = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Timetable Grid", icon: Table2 },
    { label: "Management", icon: FolderKanban },
    { label: "Academic Structure", icon: Layers3, active: true },
    { label: "Publication", icon: Upload },
    { label: "Reports", icon: BarChart3 },
  ];

  return (
    <aside className="hidden min-h-screen w-64 flex-col bg-[#111b31] text-slate-300 lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <GraduationCap size={21} />
        </div>
        <div>
          <h2 className="text-base font-bold leading-tight text-white">
            Faculty of
            <br />
            Science
          </h2>
          <p className="mt-1 text-[10px] font-semibold tracking-widest text-blue-200">
            TIMETABLE SYSTEM
          </p>
        </div>
      </div>
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {items.map(({ label, icon: Icon, active }) => (
            <li key={label}>
              <button
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                  active
                    ? "bg-slate-600/70 text-white"
                    : "hover:bg-white/10 hover:text-white"
                }`}
              >
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
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-white/10">
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

function TopBar({ search, setSearch }) {
  return (
    <header className="flex min-h-20 items-center justify-between gap-5 border-b border-slate-200 bg-white px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-8">
        <h2 className="text-lg font-semibold text-slate-950">
          Academic Structure
        </h2>
        <div className="relative hidden w-80 lg:block">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search streams, levels or groups..."
            className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="hidden items-center gap-6 text-xs text-slate-500 xl:flex">
          <button className="border-b-2 border-blue-600 py-6 font-semibold text-blue-600">
            Current Semester
          </button>
          <button>Exam Period</button>
          <button>Archives</button>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <button className="text-slate-500 hover:text-slate-800">
          <Bell size={19} />
        </button>
        <button className="text-slate-500 hover:text-slate-800">
          <History size={19} />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 md:block" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold text-slate-900">
              Prof. S. Perera
            </p>
            <p className="text-[10px] text-slate-400">Administrator</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-white">
            <GraduationCap size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}

function StreamSection({ stream, toggleLevel }) {
  const biological = stream.stream_type === "Biological";

  return (
    <section>
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              biological ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            {biological ? <Leaf size={20} /> : <Sigma size={20} />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {stream.name}
            </h2>
            <p className="text-xs text-slate-500">
              {stream.levels?.length} Levels
            </p>
          </div>
        </div>
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="space-y-3">
        {stream.levels?.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            streamId={stream.id}
            biological={biological}
            toggleLevel={toggleLevel}
          />
        ))}
      </div>
    </section>
  );
}

function LevelCard({ level, streamId, biological, toggleLevel }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
        level.expanded && !biological
          ? "border-l-4 border-l-blue-600 border-slate-200"
          : "border-slate-200"
      }`}
    >
      <button
        onClick={() => toggleLevel(streamId, level.id, level.expanded)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          {level.expanded ? (
            <ChevronDown size={17} className="shrink-0 text-slate-700" />
          ) : (
            <ChevronRight size={17} className="shrink-0 text-slate-700" />
          )}
          <span className="font-bold text-blue-700">{level.code}</span>
          <span className="font-semibold text-slate-950">{level.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">{level.summary}</span>
          {level.expanded && biological && (
            <Pencil size={16} className="text-blue-600" />
          )}
        </div>
      </button>
      {level.expanded && (
        <div className="border-t border-slate-200 px-5 py-5">
          {biological ? (
            <BiologicalLevelDetails level={level} />
          ) : (
            <PhysicalLevelDetails level={level} />
          )}
        </div>
      )}
    </div>
  );
}

function BiologicalLevelDetails({ level }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Pathways & Cohorts
        </p>
        <div className="space-y-3">
          {level.pathways?.map((pathway) => (
            <div
              key={pathway.id}
              className="rounded-lg bg-slate-100 px-4 py-3"
            >
              <p className="text-sm font-medium text-slate-950">
                {pathway.name}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {pathway.students_count} Students
              </p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Practical Groups
        </p>
        <div className="grid grid-cols-2 gap-3">
          {level.practical_groups?.map((group) => (
            <div
              key={group.id}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-800"
            >
              {group.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhysicalLevelDetails({ level }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Level Information
        </p>
        <div className="rounded-lg bg-slate-100 px-4 py-3">
          <p className="text-sm font-medium text-slate-950">{level.name}</p>
          <p className="mt-1 text-xs text-slate-600">{level.summary}</p>
        </div>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Resource Allocation
        </p>
        <p className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <Building2 size={14} />
          Resources pending assignment
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-100 p-5">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">{description}</p>
      {children}
    </section>
  );
}

function AddStreamModal({ form, setForm, onClose, onSubmit }) {
  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Add New Academic Stream
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a stream and its first academic level.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormInput
              label="Stream Name"
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Environmental Science Stream"
            />
            <FormSelect
              label="Stream Type"
              name="stream_type"
              value={form.stream_type}
              onChange={updateField}
              options={["Biological", "Physical"]}
            />
            <FormInput
              label="First Level Code"
              name="code"
              value={form.code}
              onChange={updateField}
              placeholder="ES1"
            />
            <FormInput
              label="First Level Name"
              name="levelName"
              value={form.levelName}
              onChange={updateField}
              placeholder="Level 01 - Foundation"
            />
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <PlusCircle size={16} />
              Add Stream
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormInput({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        required
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function FormSelect({ label, options, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <select
        required
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}