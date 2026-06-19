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

export default function LecturerDashboard() {
  const todaySessions = [
    {
      time: "08:00 - 09:55",
      course: "COM1213",
      title: "Computer Systems",
      venue: "CS AUD",
      group: "PS6 / PS7",
      type: "Lecture",
    },
    {
      time: "13:00 - 14:55",
      course: "COM2212",
      title: "Database Systems",
      venue: "CS LAB",
      group: "Level II",
      type: "Practical",
    },
  ];

    const assignedCourses = ["COM1213", "COM2212", "COM3232", "CSC3262"];
    const studentGroups = ["PS6", "PS7", "Level II - Group A", "Practical Group 01"];

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

          <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10">
              <LogOut size={18} /> Logout
          </button>
        </div>
        
        </aside>
      </div>
    )
}