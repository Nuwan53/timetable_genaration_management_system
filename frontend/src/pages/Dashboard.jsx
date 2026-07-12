import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

const conflictData = [
  { day: 'Mon', conflicts: 3 },
  { day: 'Tue', conflicts: 5 },
  { day: 'Wed', conflicts: 12 },
  { day: 'Thu', conflicts: 8 },
  { day: 'Fri', conflicts: 9 },
];

const summaryCards = [
  {
    label: 'Total Courses',
    value: '84',
    icon: BookOpen,
    gradient: 'from-sky-50 to-sky-100',
    accent: 'text-sky-700',
    ring: 'ring-sky-100',
  },
  {
    label: 'Total Lecturers',
    value: '57',
    icon: Users,
    gradient: 'from-violet-50 to-violet-100',
    accent: 'text-violet-700',
    ring: 'ring-violet-100',
  },
  {
    label: 'Total Venues',
    value: '32',
    icon: Building2,
    gradient: 'from-emerald-50 to-emerald-100',
    accent: 'text-emerald-700',
    ring: 'ring-emerald-100',
  },
  {
    label: 'Published Timetables',
    value: '12',
    icon: CalendarCheck,
    gradient: 'from-amber-50 to-amber-100',
    accent: 'text-amber-700',
    ring: 'ring-amber-100',
  },
  {
    label: 'Active Conflicts',
    value: '6',
    icon: AlertTriangle,
    gradient: 'from-rose-50 to-rose-100',
    accent: 'text-rose-700',
    ring: 'ring-rose-100',
  },
];

const departmentRows = [
  ['CS', 'Computer Science', '240 hrs', '12 halls', 0, 'READY'],
  ['MA', 'Mathematics', '180 hrs', '8 halls', 2, 'REVIEW'],
  ['PH', 'Physics', '160 hrs', '6 labs', 1, 'REVIEW'],
  ['CH', 'Chemistry', '210 hrs', '9 labs', 1, 'REVIEW'],
  ['BO', 'Botany', '130 hrs', '5 labs', 0, 'READY'],
  ['ZO', 'Zoology', '150 hrs', '6 labs', 0, 'READY'],
];

const activities = [
  {
    icon: Send,
    tone: 'bg-sky-50 text-sky-700',
    title: 'Semester II timetable draft published by Admin',
    time: 'Today at 10:45 AM',
  },
  {
    icon: ShieldAlert,
    tone: 'bg-rose-50 text-rose-600',
    title: 'Venue conflict detected in CS AUD',
    time: 'Yesterday at 4:20 PM',
  },
  {
    icon: ClipboardList,
    tone: 'bg-slate-100 text-slate-600',
    title: 'New lecturer request submitted for Computer Science',
    time: 'Oct 24, 2026',
  },
];

function ConflictTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-xl">
      <p className="text-xs font-medium text-slate-300">{label}</p>
      <p className="text-sm font-semibold">{payload[0].value} conflicts</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, gradient, accent, ring }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} ring-1 ${ring}`}>
          <Icon size={20} className={accent} />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          <ArrowUpRight size={12} />
          Live
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const chartMax = useMemo(() => Math.max(...conflictData.map((item) => item.conflicts)) + 4, []);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative isolate overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 px-6 py-8 text-white lg:px-8">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_36%),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_100%,72px_72px,72px_72px]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-200">
                <Sparkles size={12} />
                Admin Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">Welcome Back, Admin</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Monitor timetable health, allocation pressure, publication readiness, and recent operational activity from one clean control center.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:max-w-2xl">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Current semester</p>
                <p className="mt-2 text-sm font-semibold text-white">S2-2026</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Publication</p>
                <p className="mt-2 text-sm font-semibold text-white">Draft review</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Conflicts</p>
                <p className="mt-2 text-sm font-semibold text-white">6 active alerts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-50/80 px-6 py-6 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <SectionCard
            title="Weekly Conflict Summary"
            subtitle="Track the weekly trend in timetable clashes across departments."
            action={(
              <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
                Mon - Fri
                <ChevronDown size={14} />
              </button>
            )}
          >
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={conflictData} margin={{ top: 20, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="conflictFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[0, chartMax]} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip content={<ConflictTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="conflicts" stroke="#0f172a" strokeWidth={2.5} fill="url(#conflictFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Departmental Resource Allocation"
            subtitle="Scheduled workload, allocated rooms, and current conflict state by department."
          >
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.14em] text-slate-400">
                    <th className="py-3 font-medium">Department</th>
                    <th className="py-3 font-medium">Scheduled Hours</th>
                    <th className="py-3 font-medium">Assigned Venues</th>
                    <th className="py-3 font-medium">Conflicts</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentRows.map(([code, name, hours, venues, conflicts, status]) => (
                    <tr key={code} className="border-b border-slate-50 last:border-0">
                      <td className="py-4">
                        <div className="font-medium text-slate-900">{code}</div>
                        <div className="text-sm text-slate-500">{name}</div>
                      </td>
                      <td className="py-4 text-slate-600">{hours}</td>
                      <td className="py-4 text-slate-600">{venues}</td>
                      <td className={`py-4 font-semibold ${conflicts === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {conflicts}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${status === 'READY' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Publication Status" subtitle="Current draft readiness and publishing progress.">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Validation pass</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-950">92%</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  Publish-ready
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                  <span>Progress</span>
                  <span>92%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[92%] rounded-full bg-slate-950" />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">All course assignments verified</p>
                    <p className="text-xs text-slate-500">Ready for the next approval step</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <Clock3 size={18} className="text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Publishing scheduled for Friday 10:00 AM</p>
                    <p className="text-xs text-slate-500">Pending final conflict review</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Recent Activities" subtitle="Latest operational events from the timetable desk.">
            <div className="space-y-5">
              {activities.map(({ icon: Icon, tone, title, time }) => (
                <div key={title} className="flex gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-6 text-slate-900">{title}</p>
                    <p className="mt-1 text-xs text-slate-500">{time}</p>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900">
              View all activities
              <ArrowUpRight size={15} />
            </button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}