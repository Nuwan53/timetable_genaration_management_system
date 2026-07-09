import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const validate = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);

    try {
      // Replace this block with a real API call, e.g.:
      // const res = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password, role, rememberMe }),
      // });
      // if (!res.ok) throw new Error("Invalid email or password.");

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const destinations = {
        student: "/student-timetable",
        lecturer: "/lecturer-timetable",
      };

      const destination = destinations[role];
      if (!destination) {
        throw new Error("Unrecognized role selected.");
      }

      navigate(destination);
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">University of Ruhuna</h1>
              <p className="text-blue-300 text-sm">Faculty of Science</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 border border-blue-400/40 rounded-full px-4 py-2 mb-12 bg-blue-500/10 backdrop-blur-sm">
            <span className="text-sm font-medium">Timetable Management System</span>
          </div>

          <div className="mb-12">
            <h2 className="text-5xl font-bold leading-tight mb-4">
              Academic scheduling,
              <span className="text-blue-300 block">perfectly orchestrated.</span>
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Plan lectures, allocate venues and resolve conflicts in one premium
              workspace built for administrators, lecturers and students.
            </p>
          </div>

          <div className="bg-blue-900/40 backdrop-blur-md border border-blue-400/20 rounded-2xl p-6 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Week 06 · Semester 1</h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/40">
                No conflicts
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {[
                ["MON", "MAT121β", "CHE1212"],
                ["TUE", "", ""],
                ["WED", "PHY1214", "COM1213"],
                ["THU", "BOT1231", ""],
                ["FRI", "ZOO1202", "STA1201"],
              ].map(([day, c1, c2]) => (
                <div key={day}>
                  <p className="text-xs font-semibold text-blue-300 mb-2">{day}</p>
                  <div className="space-y-2">
                    {c1 && (
                      <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">
                        {c1}
                      </div>
                    )}
                    {c2 && (
                      <div className="bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">
                        {c2}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              "📅 Timetable Scheduling",
              "⏱️ Conflict Detection",
              "👨‍🏫 Lecturer Management",
              "📍 Venue Allocation",
            ].map((item) => (
              <div key={item} className="text-blue-100 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome back</h1>
            <p className="text-gray-600">
              Sign in to access your timetable, schedules and academic resources.
            </p>
          </div>

          {formError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Login As
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`py-3 rounded-lg border text-sm font-semibold transition ${
                    role === "student"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  Student
                </button>

                <button
                  type="button"
                  onClick={() => setRole("lecturer")}
                  className={`py-3 rounded-lg border text-sm font-semibold transition ${
                    role === "lecturer"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  Lecturer
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="name@sci.ruh.ac.lk"
                aria-invalid={Boolean(errors.email)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 ${
                  errors.email
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:ring-blue-500"
                }`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1.5">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-900">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Forgot password?
                </a>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 ${
                    errors.password
                      ? "border-red-400 focus:ring-red-400"
                      : "border-gray-200 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1.5">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 accent-blue-600"
              />
              <label htmlFor="remember" className="text-sm text-gray-700 font-medium">
                Keep me signed in on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              Student accounts are created by faculty administrators. New lecturers
              may request an account after joining the faculty.
            </p>
          </div>

          <p className="text-center text-sm text-gray-600 mt-8">
            New lecturer?{" "}
            <Link
              to="/lecturer-signup"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Request an Account
            </Link>
          </p>

          <p className="text-center text-xs text-gray-500 mt-4">
            © 2026 University of Ruhuna · Faculty of Science
          </p>
        </div>
      </div>
    </div>
  );
}