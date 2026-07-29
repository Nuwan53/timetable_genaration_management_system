import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Archive,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileWarning,
  Filter,
  MoreVertical,
  Rocket,
  Search,
  Users,
} from 'lucide-react';
import { publicationApi } from '../api';

const publicationHistory = [
  {
    id: 1,
    date: 'Oct 24, 2026',
    time: '14:22:10 PM',
    version: 'v4.1.2-release',
    publisher: 'Amila S.',
    initials: 'AS',
    status: 'PUBLISHED',
    notes: 'Semester 2 final adjustments',
  },
  {
    id: 2,
    date: 'Oct 20, 2026',
    time: '09:15:45 AM',
    version: 'v4.0.0-archive',
    publisher: 'Priyantha W.',
    initials: 'PW',
    status: 'ARCHIVED',
    notes: 'Initial semester draft',
  },
  {
    id: 3,
    date: 'Oct 18, 2026',
    time: '16:40:00 PM',
    version: 'v3.9.5-archive',
    publisher: 'Janith W.',
    initials: 'JW',
    status: 'ARCHIVED',
    notes: 'Replaced by new curriculum version',
  },
];

export default function PublicationManager() {
  const [search, setSearch] = useState('');
  const [published, setPublished] = useState(false);
  const [activePublication, setActivePublication] = useState(publicationHistory[0]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await publicationApi.list();
      const records = data.length ? data : publicationHistory;
      setHistory(records);
      setActivePublication(records[0]);
      setPublished(records[0]?.status === 'PUBLISHED');
    } catch (error) {
      setHistory(publicationHistory);
      setActivePublication(publicationHistory[0]);
      setPublished(publicationHistory[0].status === 'PUBLISHED');
      toast.error(error.response?.data?.detail || 'Failed to load publication history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((item) =>
      `${item.version} ${item.publisher} ${item.notes}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [history, search]);

  const handlePublish = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to publish this timetable to the student portal?'
    );

    if (!confirmed) return;

    try {
      await publicationApi.publish({ notes: 'Semester 2 final adjustments' });
      setPublished(true);
      toast.success('Timetable published successfully.');
      loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not publish timetable');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <span>Management</span>
            <span>›</span>
            <span className="font-medium text-blue-600">Publication Manager</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-950">Publication Control</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review the active timetable version, prepare releases, and keep a simple audit trail for published and archived schedules.
          </p>
        </div>

        <button
          onClick={handlePublish}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Rocket size={18} />
          {published ? 'Published Successfully' : 'Publish to Student Portal'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_310px]">
        <ActiveVersionCard publication={activePublication} published={published} />
        <ScheduledPanel />
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading publication history...</p> : null}

      <PublicationHistory
        history={filteredHistory}
        search={search}
        setSearch={setSearch}
      />
    </div>
  );
}

function ActiveVersionCard({ publication, published }) {
  return (
    <section className="flex min-h-[275px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active Version
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              {publication?.version || 'Draft 4.2'}
            </h2>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${
              published ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {published ? 'Published' : 'Live Draft'}
          </span>
        </div>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          {publication?.notes || 'Updated 2 hours ago. This version includes revised laboratory schedules for the Computer Science department and corrected lecturer availability.'}
        </p>
      </div>

      <div className="mt-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="flex flex-wrap gap-8">
          <VersionMetric
            icon={<FileWarning size={18} />}
            label="Conflicts"
            value="0 Detected"
          />

          <VersionMetric
            icon={<Users size={18} />}
            label="Reach"
            value="1,240 Students"
          />
        </div>

        <button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
          View Delta Report
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function VersionMetric({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-blue-600">
        {icon}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function ScheduledPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-950">Scheduled</h2>

        <button className="text-slate-700">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="mt-5 space-y-3">
        <ScheduleItem
          status="Coming Up"
          title="End of Term Final Release"
          date="Dec 15, 2026 · 08:00 AM"
          active
        />

        <ScheduleItem
          status="Queue"
          title="Special Exam Period Draft"
          date="Dec 20, 2026 · 09:00 AM"
        />
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600">
        <CalendarClock size={16} />
        Schedule New Release
      </button>
    </section>
  );
}

function ScheduleItem({ status, title, date, active }) {
  return (
    <div
      className={`rounded-xl border-l-4 p-4 ${
        active ? 'border-blue-600 bg-slate-100' : 'border-slate-400 bg-slate-100'
      }`}
    >
      <p className={`text-[10px] font-semibold ${active ? 'text-blue-600' : 'text-slate-500'}`}>
        {status}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-950">{title}</p>

      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
        <Clock3 size={12} />
        {date}
      </p>
    </div>
  );
}

function PublicationHistory({ history, search, setSearch }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center">
        <h2 className="text-base font-semibold text-slate-950">
          Audit Log & Publication History
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search versions..."
              className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 sm:w-48"
            />
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <Filter size={15} />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Version ID</th>
              <th className="px-6 py-4 font-semibold">Publisher</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Notes</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 text-sm text-slate-600">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-950">{item.date}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{item.time}</p>
                </td>

                <td className="px-6 py-4">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {item.version}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                      {item.initials}
                    </div>
                    <span className="font-medium text-slate-800">{item.publisher}</span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <PublicationStatusBadge status={item.status} />
                </td>

                <td className="max-w-[220px] truncate px-6 py-4 text-xs">{item.notes}</td>

                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-800">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
        <p className="text-xs text-slate-500">Showing {history.length} of 42 historical records</p>

        <div className="flex gap-2">
          <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>

          <button className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function PublicationStatusBadge({ status }) {
  const published = status === 'PUBLISHED';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold ${
        published ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {published ? <CheckCircle2 size={11} /> : <Archive size={11} />}
      {status}
    </span>
  );
}
