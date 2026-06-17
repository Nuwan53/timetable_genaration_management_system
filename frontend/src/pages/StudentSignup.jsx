{/*import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  GraduationCap,
  Phone,
} from "lucide-react";

export default function LecturerSignup() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    alert("Lecturer account request submitted. Please wait for admin approval.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <section className="hidden lg:flex w-[42%] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <BookOpen size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">University of Ruhuna</h1>
              <p className="text-blue-200 text-sm">Faculty of Science</p>
            </div>
          </div>

          <p className="inline-flex rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-sm">
            Lecturer Account Request
          </p>

          <h2 className="mt-10 text-5xl font-bold leading-tight">
            Request access to the timetable system.
          </h2>

          <p className="mt-5 text-blue-100 leading-7">
            New lecturers can request an account to view personal teaching
            schedules and assigned academic sessions.
          </p>
        </div>

        <p className="text-sm text-blue-100">
          Lecturer accounts require admin approval before login.
        </p>
      </section>

      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Lecturer Signup Request
            </h1>
            <p className="mt-2 text-gray-500">
              Submit your details to request lecturer access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              icon={<User size={18} />}
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
            />

            <Input
              icon={<Mail size={18} />}
              label="Faculty Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@sci.ruh.ac.lk"
            />

            <Input
              icon={<Phone size={18} />}
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="07X XXX XXXX"
            />

            <Select
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              options={[
                "Computer Science",
                "Mathematics",
                "Physics",
                "Chemistry",
                "Botany",
                "Zoology",
              ]}
            />

            <Input
              icon={<GraduationCap size={18} />}
              label="Designation"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              placeholder="Senior Lecturer / Lecturer / Professor"
            />

            <Input
              icon={<Building2 size={18} />}
              label="Office / Room"
              name="office"
              value={form.office}
              onChange={handleChange}
              placeholder="Optional"
              required={false}
            />

            <PasswordInput
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            <div className="md:col-span-2 mt-3">
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition"
              >
                Submit Account Request
              </button>

              <p className="mt-5 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/" className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Input({ icon, label, required = true, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
        <input
          required={required}
          {...props}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
      </label>
      <select
        required
        {...props}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select {label}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function PasswordInput({
  label,
  name,
  value,
  onChange,
  showPassword,
  setShowPassword,
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label}
      </label>
      <div className="relative">
        <Lock
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          required
          name={name}
          value={value}
          onChange={onChange}
          type={showPassword ? "text" : "password"}
          placeholder="Enter password"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}      lectrure signup
      */}




      