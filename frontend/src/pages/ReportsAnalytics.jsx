import { useState, useEffect } from "react";
import {
  Bell,
  History,
  LayoutDashboard,
  Table2,
  FolderKanban,
  Layers3,
  Upload,
  BarChart3,
  HelpCircle,
  Settings,
  LogOut,
  Download,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
} from "lucide-react";
import { analyticsApi } from "../api";

export default function ReportsAnalytics() {
  const [period, setPeriod] = useState("Last 30 Days");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.dashboard({ period });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = analyticsData?.metrics || {};
  const heatmap = analyticsData?.heatmap || [];
  const conflictVelocity = analyticsData?.conflict_velocity || [];
  const lecturers = analyticsData?.lecturers || [];
  const studentGroups = analyticsData?.student_groups || [];
  const conflictHistory = analyticsData?.conflict_history || [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <TopBar />
        <div className="p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">
                Reports & Analytics
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Real-time faculty scheduling efficiency and resource
                utilization insights.
              </p>
            </div>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm">
              {["Last 30 Days", "Quarterly", "Semester"].map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={`rounded-lg px-5 py-2.5 text-xs font-semibold transition ${
                    period === item
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item}
                </button>
              ))}
              <button className="ml-1 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                <Download size={17} />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Utilization Rate"
              value={metrics.utilization_rate || "84.2%"}
              supporting="↗ 2.1%"
              tone="success"
            />
            <MetricCard
              label="Pending Conflicts"
              value={metrics.pending_conflicts || "12"}
              supporting="△ Action Needed"
              tone="danger"
            />
            <MetricCard
              label="Avg Lecturer Load"
              value={metrics.avg_lecturer_load || "18.5h"}
              supporting="Per week"
            />
            <MetricCard
              label="Resource Efficiency"
              value={metrics.resource_efficiency || "A+"}
              supporting="Top Percentile"
              tone="primary"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_1fr]">
            <VenueHeatmap heatmapData={heatmap} />
            <ConflictVelocity conflictVelocity={conflictVelocity} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
            <LecturerWorkload lecturers={lecturers} />
            <StudentGroupLoad studentGroups={studentGroups} />
          </div>

          <div className="mt-5">
            <ConflictHistory conflictHistory={conflictHistory} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  const items = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Timetable Grid", icon: Table2 },
    { label: "Management", icon: FolderKanban },
    { label: "Academic Structure", icon: Layers3 },
    { label: "Publication", icon: Upload },
    { label: "Reports", icon: BarChart3, active: true },
  ];

  return (
    <aside className="hidden min-h-screen w-64 flex-col bg-[#111b31] text-slate-300 lg:flex">
      <div className="px-6 py-6">
        <h2 className="text-base font-bold text-white">Faculty of Science</h2>
        <p className="mt-1 text-[10px] text-blue-200">Timetable System</p>
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

function TopBar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
      <div className="flex items-center gap-8">
        <h2 className="text-lg font-semibold text-slate-950">
          Timetable Manager
        </h2>
        <div className="hidden items-center gap-6 text-xs text-slate-500 md:flex">
          <button className="font-medium text-slate-800">
            Current Semester
          </button>
          <button>Exam Period</button>
          <button>Archives</button>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <Bell size={19} className="text-slate-500" />
        <History size={19} className="text-slate-500" />
        <div className="hidden h-8 w-px bg-slate-200 md:block" />
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            JD
          </div>
          <p className="hidden text-sm font-medium text-slate-800 md:block">
            Admin Profile
          </p>
        </div>
      </div>
    </header>
  );
}

function MetricCard({ label, value, supporting, tone }) {
  const supportingClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "danger"
      ? "text-red-600"
      : tone === "primary"
      ? "text-blue-600"
      : "text-slate-700";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p
          className={`text-3xl font-bold ${
            tone === "danger" ? "text-red-700" : "text-slate-950"
          }`}
        >
          {value}
        </p>
        <p className={`pb-1 text-xs ${supportingClass}`}>{supporting}</p>
      </div>
    </div>
  );
}

function VenueHeatmap({ heatmapData }) {
  const days = ["MON", "TUE", "WED", "THU", "FRI"];
  const times = [
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "",
  ];
  const heatClasses = {
    0: "bg-slate-100",
    1: "bg-indigo-100",
    2: "bg-indigo-300",
    3: "bg-blue-400",
    4: "bg-blue-600",
    5: "bg-blue-800",
  };

  // Use provided heatmapData or fallback to defaults
  const displayData =
    heatmapData.length > 0
      ? heatmapData
      : [
          [1, 4, 5, 4, 2, 1, 0, 0],
          [5, 5, 5, 5, 2, 1, 0, 0],
          [2, 4, 5, 5, 4, 1, 0, 0],
          [5, 2, 5, 5, 5, 5, 1, 0],
          [1, 1, 2, 4, 5, 1, 0, 0],
        ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">
          Venue Utilization Heatmap
        </h2>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <span className="mr-1">Low</span>
          {[1, 2, 3, 4, 5].map((level) => (
            <span
              key={level}
              className={`h-3 w-3 rounded-sm ${heatClasses[level]}`}
            />
          ))}
          <span className="ml-1">Peak</span>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-[600px]">
          <thead>
            <tr>
              <th className="w-12 p-2 text-center text-[10px] font-medium text-slate-600"></th>
              {times.map((time, index) => (
                <th
                  key={`${time}-${index}`}
                  className="w-14 p-2 text-center text-[10px] font-medium text-slate-600"
                >
                  {time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <td className="p-2 text-center text-xs font-semibold text-slate-700">
                  {days[rowIndex]}
                </td>
                {row.map((level, columnIndex) => (
                  <td key={`${rowIndex}-${columnIndex}`} className="p-1">
                    <div
                      className={`h-10 w-12 rounded-md ${heatClasses[level]}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConflictVelocity({ conflictVelocity }) {
  const displayData =
    conflictVelocity.length > 0
      ? conflictVelocity
      : [38, 58, 49, 72, 63, 42, 31];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">
          Conflict Resolution Velocity
        </h2>
        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
          Auto-Update
        </span>
      </div>
      <div className="mt-8 flex h-48 items-end gap-3 border-b border-slate-200 px-2">
        {displayData.map((value, index) => (
          <div key={index} className="flex flex-1 flex-col items-center">
            {index === displayData.length - 1 && (
              <span className="mb-1 text-[9px] font-semibold text-red-600">
                Current
              </span>
            )}
            <div
              className={`w-full max-w-10 rounded-t-lg ${
                index === displayData.length - 1 ? "bg-red-400" : "bg-blue-700"
              }`}
              style={{ height: `${value * 2}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[9px] font-semibold text-slate-600">
        <span>WEEK 1</span>
        <span>WEEK 7</span>
      </div>
    </section>
  );
}

function LecturerWorkload({ lecturers }) {
  const displayData =
    lecturers.length > 0
      ? lecturers
      : [
          {
            name: "Prof. Chandrasiri G.",
            teaching: 75,
            research: 15,
            hours: "24h / Week",
            warning: false,
          },
          {
            name: "Dr. Perera L.A.",
            teaching: 50,
            research: 30,
            hours: "18h / Week",
            warning: false,
          },
          {
            name: "Mrs. Silva K.",
            teaching: 85,
            research: 10,
            hours: "28h / Week",
            warning: true,
          },
          {
            name: "Dr. Jayawardena R.",
            teaching: 40,
            research: 20,
            hours: "14h / Week",
            warning: false,
          },
        ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">
          Lecturer Workload Distribution
        </h2>
        <div className="flex gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Teaching
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            Research/Admin
          </span>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        {displayData.map((lecturer) => (
          <div key={lecturer.name}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-slate-900">
                {lecturer.name}
              </span>
              <span
                className={
                  lecturer.warning ? "font-medium text-red-600" : "text-slate-600"
                }
              >
                {lecturer.hours}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={lecturer.warning ? "bg-red-600" : "bg-blue-600"}
                style={{ width: `${lecturer.teaching}%` }}
              />
              <div
                className="bg-slate-300"
                style={{ width: `${lecturer.research}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StudentGroupLoad({ studentGroups }) {
  const displayData =
    studentGroups.length > 0
      ? studentGroups
      : [
          {
            title: "YEAR 1 - CS",
            hours: "32h",
            note: "Heavy load on Wed/Fri",
            trend: "up",
          },
          {
            title: "YEAR 2 - BIO",
            hours: "24h",
            note: "Optimal distribution",
            trend: "steady",
          },
          {
            title: "YEAR 3 - MATH",
            hours: "20h",
            note: "Self-study gap days active",
            trend: "down",
          },
          {
            title: "YEAR 4 - CHEM",
            hours: "28h",
            note: "Balanced lab sessions",
            trend: "steady",
          },
        ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        Student Group Load Index
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {displayData.map((group) => (
          <div
            key={group.title}
            className="rounded-lg border border-slate-200 bg-slate-100 p-4"
          >
            <p className="text-[10px] font-semibold text-slate-600">
              {group.title}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl font-bold text-slate-950">
                {group.hours}
                <span className="ml-1 text-xs font-normal">/wk</span>
              </p>
              {group.trend === "up" ? (
                <ArrowUpRight size={19} className="text-red-600" />
              ) : group.trend === "down" ? (
                <ArrowDownRight size={19} className="text-emerald-600" />
              ) : (
                <ArrowRight size={19} className="text-blue-600" />
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">{group.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 h-24 overflow-hidden rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-white opacity-80">
        <div className="flex h-full items-end gap-2 px-4">
          {[30, 50, 25, 68, 40, 75, 45, 83, 58, 90].map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-slate-300"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ConflictHistory({ conflictHistory }) {
  const displayData =
    conflictHistory.length > 0
      ? conflictHistory
      : [
          {
            time: "2 hours ago",
            type: "Room Double-Booking",
            entity: "MLT 01 - Physics I",
            resolvedBy: "Auto-Optimizer",
            status: "Resolved",
          },
          {
            time: "5 hours ago",
            type: "Lecturer Overlap",
            entity: "Dr. Silva (CS 101/CS 302)",
            resolvedBy: "Admin (J. Doe)",
            status: "Resolved",
          },
          {
            time: "Yesterday",
            type: "Resource Conflict",
            entity: "Projector Unit #4",
            resolvedBy: "Pending System",
            status: "In Progress",
          },
        ];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Conflict Resolution History
        </h2>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          View All Logs
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600">
              <th className="px-6 py-4 font-semibold">Time</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Entity</th>
              <th className="px-6 py-4 font-semibold">Resolved By</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((item) => (
              <tr
                key={`${item.time}-${item.type}`}
                className="border-t border-slate-100 text-sm"
              >
                <td className="px-6 py-4 text-slate-700">{item.time}</td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {item.type}
                </td>
                <td className="px-6 py-4 text-slate-600">{item.entity}</td>
                <td className="px-6 py-4 text-slate-600">
                  {item.resolvedBy}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                      item.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
