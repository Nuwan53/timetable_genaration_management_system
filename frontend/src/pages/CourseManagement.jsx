import { useMemo, useState, useEffect } from "react";
import {
  Bell,
  History,
  GraduationCap,
  LayoutDashboard,
  Table2,
  FolderKanban,
  Layers3,
  Upload,
  BarChart3,
  HelpCircle,
  Settings,
  LogOut,
  Search,
  Filter,
  CreditCard,
  UploadCloud,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { courses } from "../api";

const emptyForm = {
  code: "",
  name: "",
  credits: "",
  lectureHours: "",
  labHours: "",
  totalHours: "",
  department: "",
};

export default function CourseManagement() {
  const [coursesList, setCoursesList] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [creditsFilter, setCreditsFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState(null);

  useEffect(() => {
    loadCourses();
    loadValidation();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courses.list();
      setCoursesList(response.data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadValidation = async () => {
    try {
      const response = await courses.validate();
      setValidationData(response.data);
    } catch (error) {
      console.error("Failed to load validation data:", error);
    }
  };

  const departments = useMemo(() => {
    return [...new Set(coursesList.map((c) => c.department).filter(Boolean))];
  }, [coursesList]);

  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      const matchesSearch = `${course.code} ${course.name} ${course.department}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDepartment =
        !departmentFilter || course.department === departmentFilter;
      const matchesCredits =
        !creditsFilter || String(course.credits) === creditsFilter;
      return matchesSearch && matchesDepartment && matchesCredits;
    });
  }, [coursesList, search, departmentFilter, creditsFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / rowsPerPage)
  );
  const paginatedCourses = filteredCourses.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalCredits = coursesList.reduce(
    (total, course) => total + Number(course.credits),
    0
  );
  const weeklyContactHours = coursesList.reduce(
    (total, course) => total + Number(course.total_hours),
    0
  );
  const activeDepartments = new Set(
    coursesList.map((course) => course.department)
  ).size;

  const openAddModal = () => {
    setEditingCourse(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setForm({
      code: course.code,
      name: course.name,
      credits: course.credits,
      lectureHours: course.lecture_hours,
      labHours: course.lab_hours,
      totalHours: course.total_hours,
      department: course.department,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );
    if (!confirmed) return;

    try {
      await courses.remove(id);
      await loadCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const courseData = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      credits: Number(form.credits),
      lecture_hours: Number(form.lectureHours),
      lab_hours: Number(form.labHours),
      total_hours: Number(form.totalHours),
      department: form.department,
    };

    try {
      if (editingCourse) {
        await courses.update(editingCourse.id, courseData);
      } else {
        await courses.create(courseData);
      }
      await loadCourses();
      setModalOpen(false);
      setEditingCourse(null);
      setForm(emptyForm);
    } catch (error) {
      console.error("Failed to save course:", error);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await courses.import(file);
      await loadCourses();
      event.target.value = "";
    } catch (error) {
      console.error("Failed to import courses:", error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await courses.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "courses.csv");
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error("Failed to export courses:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("");
    setCreditsFilter("");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading courses...</p>
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
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                <span>Management</span>
                <span>›</span>
                <span className="font-semibold text-blue-600">
                  Course Management
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-950">
                Course Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Configure and manage academic course modules for the Faculty of
                Science.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                <UploadCloud size={17} />
                Import CSV
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Upload size={17} />
                Export CSV
              </button>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Course
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Courses"
              value={coursesList.length}
              supportingText="+12 this year"
              supportingTone="success"
            />
            <StatCard
              label="Total Credits"
              value={totalCredits}
              supportingText={`Avg ${(totalCredits / Math.max(coursesList.length, 1)).toFixed(1)}/course`}
            />
            <StatCard
              label="Weekly Contact Hours"
              value={weeklyContactHours}
              supportingText="Lectures & Labs"
            />
            <StatCard
              label="Active Departments"
              value={String(activeDepartments).padStart(2, "0")}
              supportingText="Full integration"
            />
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center">
              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search course code, name, or department..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Filter
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <select
                    value={departmentFilter}
                    onChange={(event) => {
                      setDepartmentFilter(event.target.value);
                      setPage(1);
                    }}
                    className="rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-700 outline-none"
                  >
                    <option value="">Department</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <CreditCard
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <select
                    value={creditsFilter}
                    onChange={(event) => {
                      setCreditsFilter(event.target.value);
                      setPage(1);
                    }}
                    className="rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-700 outline-none"
                  >
                    <option value="">Credits</option>
                    <option value="2">2 Credits</option>
                    <option value="3">3 Credits</option>
                    <option value="4">4 Credits</option>
                  </select>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-600">
                    <th className="px-5 py-4 font-semibold">Course Code</th>
                    <th className="px-5 py-4 font-semibold">Course Name</th>
                    <th className="px-5 py-4 font-semibold">Credits</th>
                    <th className="px-5 py-4 font-semibold">Hours/Week</th>
                    <th className="px-5 py-4 font-semibold">Department</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCourses.length > 0 ? (
                    paginatedCourses.map((course) => (
                      <tr
                        key={course.id}
                        className="border-t border-slate-100 text-sm transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {course.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[250px] font-semibold text-slate-950">
                            {course.name}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {Number(course.credits).toFixed(1)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-slate-800">
                            Lect: {course.lecture_hours} / Lab:{" "}
                            {course.lab_hours}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {course.total_hours} Hours Total
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                            {course.department || "N/A"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => openEditModal(course)}
                              className="text-blue-600 transition hover:text-blue-800"
                              aria-label={`Edit ${course.code}`}
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              onClick={() => handleDelete(course.id)}
                              className="text-red-500 transition hover:text-red-700"
                              aria-label={`Delete ${course.code}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-12 text-center text-sm text-slate-500"
                      >
                        No courses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-600">
                Showing{" "}
                <span className="font-semibold">
                  {filteredCourses.length === 0
                    ? 0
                    : (page - 1) * rowsPerPage + 1}
                  –{Math.min(page * rowsPerPage, filteredCourses.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold">{filteredCourses.length}</span>{" "}
                courses
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                </button>
                {[1, 2, 3].map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() =>
                      setPage(Math.min(pageNumber, totalPages))
                    }
                    className={`h-8 min-w-8 rounded-md border px-2 text-xs font-semibold ${
                      page === pageNumber
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <span className="px-1 text-xs text-slate-500">...</span>
                <button className="h-8 min-w-8 rounded-md border border-slate-200 px-2 text-xs text-slate-600">
                  25
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Rows per page</span>
                <select
                  value={rowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(Number(event.target.value));
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-200 px-2 py-1 outline-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ValidationCard validationData={validationData} />
            <ConflictCard validationData={validationData} />
          </div>

          <footer className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-6">
              <span>© 2026 University of Ruhuna</span>
              <button className="hover:text-slate-800">Privacy Policy</button>
              <button className="hover:text-slate-800">Terms of Service</button>
            </div>
            <p className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              System Status: All services operational
            </p>
          </footer>
        </div>
      </main>

      {modalOpen && (
        <CourseModal
          form={form}
          setForm={setForm}
          editing={Boolean(editingCourse)}
          departments={departments}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function Sidebar() {
  const items = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Timetable Grid", icon: Table2 },
    { label: "Management", icon: FolderKanban, active: true },
    { label: "Academic Structure", icon: Layers3 },
    { label: "Publication", icon: Upload },
    { label: "Reports", icon: BarChart3 },
  ];

  return (
    <aside className="hidden min-h-screen w-64 flex-col bg-[#111b31] text-slate-300 lg:flex">
      <div className="px-6 py-6">
        <h2 className="text-base font-bold text-white">Faculty of Science</h2>
        <p className="mt-1 text-[10px] font-semibold tracking-widest text-blue-200">
          TIMETABLE SYSTEM
        </p>
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
          <button className="hover:text-slate-800">Exam Period</button>
          <button className="hover:text-slate-800">Archives</button>
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
            <p className="text-xs font-semibold text-slate-900">Admin User</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Registrar Office
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-slate-700 text-white">
            <GraduationCap size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
function StatCard({ label, value, supportingText, supportingTone }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-2xl font-bold text-slate-950">{value}</p>
        <p
          className={`pb-1 text-[10px] ${
            supportingTone === "success"
              ? "text-emerald-600"
              : "text-slate-600"
          }`}
        >
          {supportingText}
        </p>
      </div>
    </div>
  );
}

function ValidationCard({ validationData }) {
  if (!validationData) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-blue-600 p-6 text-white shadow-sm">
      <div className="relative z-10">
        <h3 className="text-lg font-semibold">Automated Validation</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-blue-100">
          Ensure your course codes and credit allocations match the university's
          academic criteria before publication.
        </p>
        <p className="mt-3 text-sm">
          <span className="font-semibold">
            {validationData.conflicting_courses}
          </span>{" "}
          courses with potential issues
        </p>
        <button className="mt-5 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30">
          Review Validator
        </button>
      </div>
      <ShieldCheck
        size={110}
        className="absolute -bottom-5 right-3 text-blue-400 opacity-40"
      />
    </section>
  );
}

function ConflictCard({ validationData }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#111b31] p-6 text-white shadow-sm">
      <div className="relative z-10">
        <h3 className="text-lg font-semibold">Conflict Dashboard</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
          {validationData
            ? `${validationData.conflicting_courses} courses currently have credit-hour discrepancies. Review these modules to avoid scheduling errors.`
            : "Monitor course conflicts and scheduling issues."}
        </p>
        <button className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
          Review Conflicts
        </button>
      </div>
      <AlertTriangle
        size={105}
        className="absolute -bottom-5 right-3 text-slate-500 opacity-30"
      />
    </section>
  );
}

function CourseModal({
  form,
  setForm,
  editing,
  departments,
  onClose,
  onSubmit,
}) {
  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {editing ? "Edit Course" : "Add New Course"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the academic course information.
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
              label="Course Code"
              name="code"
              value={form.code}
              onChange={updateField}
              placeholder="CSC1113"
            />
            <FormInput
              label="Course Name"
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Introduction to Computer Science"
            />
            <FormInput
              label="Credits"
              name="credits"
              type="number"
              min="1"
              max="6"
              step="0.5"
              value={form.credits}
              onChange={updateField}
              placeholder="3"
            />
            <FormSelect
              label="Department"
              name="department"
              value={form.department}
              onChange={updateField}
              options={departments}
            />
            <FormInput
              label="Lecture Hours"
              name="lectureHours"
              type="number"
              min="0"
              value={form.lectureHours}
              onChange={updateField}
              placeholder="30"
            />
            <FormInput
              label="Lab Hours"
              name="labHours"
              type="number"
              min="0"
              value={form.labHours}
              onChange={updateField}
              placeholder="45"
            />
            <FormInput
              label="Weekly Contact Hours"
              name="totalHours"
              type="number"
              min="1"
              value={form.totalHours}
              onChange={updateField}
              placeholder="5"
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
              <Save size={16} />
              {editing ? "Save Changes" : "Add Course"}
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
