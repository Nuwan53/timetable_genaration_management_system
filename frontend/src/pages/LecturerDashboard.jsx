import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Clock,
  Download,
  GraduationCap,
  MapPin,
  User,
  BookOpen,
  CalendarCheck,
  LogOut,
  Settings,
  Printer,
  Mail,
  Building2,
  AlertCircle,
  Users,
  ClipboardList,
} from "lucide-react";
import { slots, auth } from "../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) setUser(JSON.parse(userStr));
        
        // Fetch lecturer's schedule
        const response = await slots.mySchedule();
        setSchedule(response.data || []);
      } catch (err) {
        toast.error("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (err) {
      console.log("Logout error");
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const todaySessions = schedule.filter(s => {
    // Filter sessions for today based on day of week
    // This is a simplified version - actual implementation would check current day
    return true;
  });

  const uniqueCourses = [...new Set(schedule.map(s => s.course?.code))].length;
  const uniqueGroups = [...new Set(schedule.map(s => s.group?.id))].length;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-72 flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-blue-100 lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-400">
              <GraduationCap className="text-blue-950" size={22} />

          </div>

          <div>
            <p className="text-sm font-semibold leading-tight text-white">
                Faculty of <br /> Science
            </p>

            <p className="text-[10px] tracking-wide text-blue-200">
                LECTURER PORTAL
            </p>
          </div>
        </div>
        <nav className="mt-4 flex-1 px-3">
        {[
          ["Dashboard", CalendarCheck],
          ["My Timetable", CalendarDays],
          ["Assigned Courses", BookOpen],
          ["Student Groups", Users],
          ["Profile", User],
        ].map(([item, Icon], index) => (
          <button
            key={item}
            className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              index === 0
                ? "border border-blue-300/20 bg-blue-500/20 text-white"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {item}
          </button>
        ))}
      </nav>

      <div className="border-t border-blue-300/20 px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10">
            <Settings size={18} /> Settings
        </button>

        <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10">
            <LogOut size={18} /> Logout
        </button>
      </div>
      
      </aside>

      <main className="flex-1">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Lecturer Dashboard
            </h1>

            <p className="text-sm text-slate-500">
              View teaching schedule, courses, groups and timetable updates.
            </p>
          </div>

          <div className="flex items-center gap-5">
          <button className="text-slate-400 hover:text-slate-600">
            <Bell size={20} />
          </button>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div>
              <p className="text-right text-sm font-medium text-slate-800">
                {user?.first_name || "Lecturer"}
              </p>
              <p className="text-right text-xs text-slate-400">
                Faculty of Science
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white">
              <User size={18} />
            </div>
          </div>
        </div>
        </header>

        <div className="p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome Back, {user?.first_name || "Lecturer"}
            </h2>
            <p className="text-sm text-slate-500">
              Here is your academic timetable overview for this week.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
              <Printer size={16} />
              Print
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <StatCard icon={<CalendarDays size={20} />} label="Total Sessions" value={schedule.length} />
          <StatCard icon={<Clock size={20} />} label="Weekly Teaching Hours" value="12 hrs" />
          <StatCard icon={<BookOpen size={20} />} label="Assigned Courses" value={uniqueCourses} />
          <StatCard icon={<Users size={20} />} label="Student Groups" value={uniqueGroups} />

        </div>

        <div>
          {schedule.length > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                    Next Class
                </h3>

                <p className="text-sm text-slate-500">

                  Your nearest upcoming session.
                </p>
                
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                Starts soon

              </span>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
              <p className="text-sm text-blue-100">{schedule[0].course?.code}</p>
              <h4 className="mt-1 text-2xl font-bold">{schedule[0].course?.name}</h4>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoPill icon={<Clock size={16} />} label={`${schedule[0].timeslot?.start_time} - ${schedule[0].timeslot?.end_time}`} />
                <InfoPill icon={<MapPin size={16} />} label={schedule[0].venue?.code} />
                <InfoPill icon={<Users size={16} />} label={`${schedule[0].group?.level} ${schedule[0].group?.stream}`} />
              </div>
            </div>

          </section>
          )}

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Profile Summary
            </h3>

            <div className="mt-5 space-y-4 text-sm">
              <ProfileRow icon={<User size={16} />} label="Name" value={`${user?.first_name} ${user?.last_name}`} />
              <ProfileRow icon={<Mail size={16} />} label="Email" value={user?.email || "N/A"} />
              <ProfileRow icon={<Building2 size={16} />} label="Role" value={user?.role || "Lecturer"} />
            </div>
          </section>
        </div>

        <div>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              My Classes
            </h3>
            <p className="text-sm text-slate-500">
              All scheduled teaching sessions.
            </p>

            <div className="mt-5 space-y-4">
              {schedule.length === 0 ? (
                <p className="text-sm text-slate-500">No classes scheduled</p>
              ) : (
                schedule.map((session, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-700">
                          {session.course?.code}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">
                          {session.course?.name}
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {session.group?.level} {session.group?.stream}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        Lecture
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <Clock size={15} /> {session.timeslot?.day} {session.timeslot?.start_time} - {session.timeslot?.end_time}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin size={15} /> {session.venue?.code}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

      </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InfoPill({ icon, label }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm">
      {icon}
      {label}
    </div>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
      <span className="flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
