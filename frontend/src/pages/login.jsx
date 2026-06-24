import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { auth } from "../api";
import toast from "react-hot-toast";
import Ruhuna from '../assets/Ruhuna.jpg';

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const validate = () => {
    const nextErrors = {};

    if (!username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
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
      const response = await auth.login(username, password);
      const { token, user } = response.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Redirect based on role
      const roleRedirects = {
        admin: "/dashboard",
        lecturer: "/lecturer-dashboard",
        student: "/student-dashboard",
      };
      
      const destination = roleRedirects[user.role] || "/dashboard";
      navigate(destination);
      toast.success("Login successful!");
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Login failed";
      setFormError(msg);
      toast.error(msg);
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

          <div className="mb-12">
            <img src={Ruhuna} alt="Timetable Preview" className="w-full rounded-lg shadow-lg" />
          </div>

          {/* <div className="bg-blue-900/40 backdrop-blur-md border border-blue-400/20 rounded-2xl p-6 mb-12">
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
          </div> */}

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
              <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                placeholder="Enter your username"
                aria-invalid={Boolean(errors.username)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 ${
                  errors.username
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:ring-blue-500"
                }`}
              />
              {errors.username && (
                <p className="text-sm text-red-600 mt-1.5">{errors.username}</p>
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
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">Test Credentials:</p>
              <p>Admin: <strong>admin</strong> / <strong>admin123</strong></p>
              <p>Lecturer: <strong>j.smith</strong> / <strong>lecturer123</strong></p>
              <p>Student: <strong>student1</strong> / <strong>student123</strong></p>
            </div>
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