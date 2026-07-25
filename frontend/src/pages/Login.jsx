import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ClipboardList,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left side - login form */}
      <section className="w-[45%] min-h-screen px-10 py-10 flex flex-col bg-white">
        <div className="flex items-center gap-3 mb-20">
          <div className="w-12 h-12 rounded-xl bg-green-700 text-white flex items-center justify-center">
            <BookOpen size={26} />
          </div>

          <div>
            <h2 className="text-base font-bold text-black">
              University of Ruhuna
            </h2>
            <p className="text-xs tracking-wider text-gray-500 font-medium">
              FACULTY OF SCIENCE
            </p>
          </div>
        </div>

        <div className="max-w-[390px]">
          <h1 className="text-4xl font-bold text-black mb-2">Sign In</h1>
          <p className="text-sm text-gray-500 leading-6 mb-8">
            Enter your credentials to access the Timetable Manager.
          </p>

          <form onSubmit={handleSignIn}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institutional Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  placeholder="name@sci.ruh.ac.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-11 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="w-4 h-4 accent-blue-700"
              />
              Keep me logged in for 30 days
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 py-3.5 text-white text-sm font-semibold hover:bg-blue-800 transition"
            >
              Sign In
            </button>
          </form>

          <div className="mt-12 border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-400 mb-1">
              Authorized Personnel Only.
            </p>
            <p className="text-xs text-gray-400">
              Contact{" "}
              <span className="text-blue-700 font-medium">
                Academic Registry
              </span>{" "}
              for access issues.
            </p>
          </div>
        </div>
      </section>

      {/* Right side - preview */}
      <section className="w-[55%] min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-10 py-10 bg-gradient-to-br from-slate-800 to-slate-700">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.4),transparent_40%)]" />

        <div className="relative z-10 w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <div className="flex items-center gap-2 text-base font-semibold text-black">
              <ClipboardList size={22} />
              Weekly Overview
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <DayColumn
              day="MON"
              items={[
                { time: "08:00", code: "PHY 101", color: "bg-blue-100" },
                {
                  time: "10:00",
                  code: "⚠ CONFLICT",
                  color: "bg-orange-100",
                  text: "text-red-700 font-semibold",
                },
              ]}
            />

            <DayColumn
              day="WED"
              items={[
                { time: "08:00", code: "MAT 201", color: "bg-green-100" },
                { time: "10:00", code: "STA 301", color: "bg-purple-100" },
              ]}
            />

            <DayColumn
              day="FRI"
              items={[
                { time: "08:00", code: "CHM 111", color: "bg-purple-100" },
                { time: "10:00", code: "CSC 201", color: "bg-yellow-100" },
              ]}
            />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-700" />
                Lectures
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                Tutorials
              </span>
            </div>

            <button className="text-xs font-semibold text-blue-700">
              View Full Semester →
            </button>
          </div>
        </div>

        <p className="relative z-10 mt-10 max-w-[420px] text-center text-white/90 italic leading-7">
          “Organizing the future of academic excellence through precision
          scheduling.”
        </p>
      </section>
    </div>
  );
}

function DayColumn({ day, items }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-center text-xs font-semibold text-gray-400 mb-1">
        {day}
      </div>

      {items.map((item, index) => (
        <div key={index} className={`${item.color} rounded-lg p-2`}>
          <div className="text-[10px] text-gray-500 font-medium mb-1">
            {item.time}
          </div>
          <div
            className={`rounded-md bg-white/50 px-2 py-1.5 text-center text-xs font-medium ${item.text || "text-gray-700"
              }`}
          >
            {item.code}
          </div>
        </div>
      ))}
    </div>
  );
}