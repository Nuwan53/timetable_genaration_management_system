import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Bell,
  History,
  GraduationCap,
  LayoutGrid,
  Table2,
  FolderKanban,
  Layers,
  Send,
  BarChart3,
  HelpCircle,
  Settings,
  ChevronDown,
  AlertTriangle,
  UserPlus,
  SlidersHorizontal,
  BookOpen,
  Users,
  Building2,
  CalendarCheck,
  LogOut,
} from "lucide-react";
import { dashboard,courses, auth } from "../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) setUser(JSON.parse(userStr));

        const re = await courses.stats();
        setStats(re.data);

        
        const response = await dashboard.stats();
        setStats(response.data);
      } catch (err) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.logout();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
      toast.success("Logged out successfully");
    } catch (err) {
      console.log("Logout error (expected):", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1">
        <TopBar user={user} onLogout={handleLogout} />

        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome Back, {user?.first_name || "Admin"}
            </h1>
            <p className="text-sm text-slate-500">
              Manage courses, lecturers, venues and timetable publications.
            </p>
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                <StatCard icon={<BookOpen size={18} />} label="Total Courses" value={stats.total_courses} badge="Active" />
                <StatCard icon={<Users size={18} />} label="Total Lecturers" value={stats.total_lecturers} badge="Staff" />
                <StatCard icon={<Building2 size={18} />} label="Total Venues" value={stats.total_venues} badge="Rooms" />
                <StatCard icon={<CalendarCheck size={18} />} label="Published Timetables" value={stats.published_timetables} badge="Ready" />
                <StatCard icon={<AlertTriangle size={18} />} label="Active Conflicts" value={stats.active_conflicts} badge="Needs attention" alert />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
                <div className="space-y-6">
                  <ConflictChart weeklyData={stats.weekly_conflicts} />
                  <ResourceTable />
                </div>

                <div className="space-y-6">
                  <PublicationStatus />
                  <RecentActivities />
                  <QuickActions />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Sidebar({ onLogout }) {
  const navItems = [
    { label: "Dashboard", icon: LayoutGrid, active: true },
    { label: "Timetable Grid", icon: Table2 },
    { label: "Timetable Management", icon: FolderKanban },
    { label: "Academic Structure", icon: Layers },
    { label: "Courses", icon: BookOpen },
    { label: "Lecturers", icon: Users },
    { label: "Venues", icon: Building2 },
    { label: "Publication", icon: Send },
    { label: "Reports", icon: BarChart3 },
  ];

  return (
    <aside className="flex min-h-screen w-72 flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-blue-100">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-400">
          <GraduationCap size={22} className="text-blue-950" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">
            Faculty of
            <br />
            Science
          </p>
          <p className="text-[10px] tracking-wide text-blue-200">
            TIMETABLE SYSTEM
          </p>
        </div>
      </div>

      <nav className="mt-2 flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <li key={label}>
              <button
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-blue-500/20 text-white border border-blue-300/20"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-blue-300/20 px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10">
          <HelpCircle size={18} /> Help Center
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10">
          <Settings size={18} /> Settings
        </button>
        <button onClick={onLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

function TopBar({ user, onLogout }) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
      <div className="flex items-center gap-8">
        <h1 className="text-[15px] font-semibold text-slate-900">
          Timetable Manager
        </h1>

        <input
          type="text"
          placeholder="Search courses, lecturers, venues..."
          className="hidden w-80 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 md:block"
        />
      </div>

      <div className="flex items-center gap-5">
        <button className="text-slate-400 hover:text-slate-600">
          <Bell size={19} />
        </button>
        <button className="text-slate-400 hover:text-slate-600">
          <History size={19} />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div>
            <p className="text-right text-sm font-medium text-slate-800">
              {user?.first_name || "Admin"}
            </p>
            <p className="text-right text-xs text-slate-400">
              Faculty of Science
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white">
            <GraduationCap size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon, label, value, badge, alert }) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-sm ${
        alert ? "border-l-4 border-red-500" : "border border-slate-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            alert ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"
          }`}
        >
          {alert ? "⚠ " : ""}
          {badge}
        </span>
      </div>

      <p className="mt-4 text-[13px] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ConflictChart({ weeklyData = [] }) {
  const chartData = weeklyData.length > 0 
    ? weeklyData.map(d => ({ day: d.day, conflicts: d.conflicts }))
    : [
        { day: "Mon", conflicts: 0 },
        { day: "Tue", conflicts: 0 },
        { day: "Wed", conflicts: 0 },
        { day: "Thu", conflicts: 0 },
        { day: "Fri", conflicts: 0 },
      ];

  const HIGHLIGHTED_DAYS = ["Wed", "Fri"];

  function HighlightDot({ cx, cy, payload }) {
    if (!HIGHLIGHTED_DAYS.includes(payload.day)) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="#2563eb"
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  function ConflictTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-lg bg-slate-900 px-4 py-2.5 text-white shadow-lg">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-slate-300">
          Conflicts: {payload[0].value}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">
            Weekly Conflict Summary
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Monitoring clashes across departments
          </p>
        </div>
        <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          Mon - Fri <ChevronDown size={14} />
        </button>
      </div>

      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 40, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="conflictFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <YAxis hide domain={[0, "dataMax + 6"]} />
            <Tooltip content={<ConflictTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="conflicts"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#conflictFill)"
              dot={<HighlightDot />}
              activeDot={{
                r: 5,
                fill: "#2563eb",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PublicationStatus() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-[15px] font-semibold text-slate-900">
        Publication Status
      </h2>
      <p className="mt-0.5 text-[13px] text-slate-400">
        Current Draft Readiness
      </p>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-slate-500">Validation Pass</span>
        <span className="text-lg font-semibold text-blue-600">92%</span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[92%] rounded-full bg-blue-600" />
      </div>

      <div className="mt-5 flex items-start gap-2.5">
        <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
        <p className="text-[13px] leading-snug text-slate-500">
          Live publishing scheduled for Friday 10:00 AM
        </p>
      </div>
    </div>
  );
}

function RecentActivities() {
  const activities = [
    {
      icon: Send,
      color: "bg-blue-50 text-blue-600",
      text: "Semester II timetable draft published by Admin",
      time: "Today at 10:45 AM",
    },
    {
      icon: AlertTriangle,
      color: "bg-red-50 text-red-500",
      text: "Venue conflict detected in CS AUD",
      time: "Yesterday at 4:20 PM",
    },
    {
      icon: UserPlus,
      color: "bg-slate-100 text-slate-500",
      text: "New Lecturer request submitted to Computer Science",
      time: "Oct 24, 2026",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-[15px] font-semibold text-slate-900">
        Recent Activities
      </h2>

      <ul className="mt-5 space-y-5">
        {activities.map(({ icon: Icon, color, text, time }, i) => (
          <li key={i} className="flex gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}
            >
              <Icon size={15} />
            </span>
            <div>
              <p className="text-[13px] text-slate-600">{text}</p>
              <p className="mt-0.5 text-xs text-slate-400">{time}</p>
            </div>
          </li>
        ))}
      </ul>

      <button className="mt-4 text-[13px] font-medium text-blue-600 hover:underline">
        View All Activities
      </button>
    </div>
  );
}

function ResourceTable() {
  const rows = [
    ["CS", "Computer Science", "240 hrs", "12 Halls", 0, "READY"],
    ["MA", "Mathematics", "180 hrs", "8 Halls", 2, "RESOLVING"],
    ["PH", "Physics", "160 hrs", "6 Labs", 1, "RESOLVING"],
    ["CH", "Chemistry", "210 hrs", "9 Labs", 1, "RESOLVING"],
    ["BO", "Botany", "130 hrs", "5 Labs", 0, "READY"],
    ["ZO", "Zoology", "150 hrs", "6 Labs", 0, "READY"],
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-slate-900">
          Departmental Resource Allocation
        </h2>
        <SlidersHorizontal size={17} className="text-slate-400" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase text-slate-400">
              <th className="py-3 font-medium">Department</th>
              <th className="py-3 font-medium">Scheduled Hours</th>
              <th className="py-3 font-medium">Assigned Venues</th>
              <th className="py-3 font-medium">Conflicts</th>
              <th className="py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([code, name, hours, venues, conflicts, status]) => (
              <tr key={code} className="border-b border-slate-50 last:border-0">
                <td className="py-4 text-sm font-medium text-slate-800">
                  {code} - {name}
                </td>
                <td className="py-4 text-sm text-slate-600">{hours}</td>
                <td className="py-4 text-sm text-slate-600">{venues}</td>
                <td
                  className={`py-4 text-sm font-medium ${
                    conflicts === 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {conflicts}
                </td>
                <td className="py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      status === "READY"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-[15px] font-semibold text-slate-900">
        Quick Actions
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {["Create Timetable", "Add Course", "Add Lecturer", "Add Venue"].map(
          (item) => (
            <button
              key={item}
              className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-4 text-sm font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-100"
            >
              {item}
            </button>
          )
        )}
      </div>
    </div>
  );
}