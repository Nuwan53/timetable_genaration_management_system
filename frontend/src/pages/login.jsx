import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log({ email, password, rememberMe });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Section - Dark Navy with University Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {/* Logo and University Name */}
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

          {/* System Badge */}
          <div className="inline-flex items-center gap-2 border border-blue-400/40 rounded-full px-4 py-2 mb-12 bg-blue-500/10 backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Timetable Management System</span>
          </div>

          {/* Main Heading */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold leading-tight mb-4">
              Academic scheduling,
              <span className="text-blue-300 block">perfectly orchestrated.</span>
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Plan lectures, allocate venues and resolve conflicts in one premium workspace built for administrators, lecturers and students.
            </p>
          </div>

          {/* Weekly Schedule Preview */}
          <div className="bg-blue-900/40 backdrop-blur-md border border-blue-400/20 rounded-2xl p-6 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Week 06 · Semester 1</h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/40">
                +15 courses
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {[
                { day: 'MON', courses: ['PHY 201'] },
                { day: 'TUE', courses: [] },
                { day: 'WED', courses: ['MAT 220'] },
                { day: 'THU', courses: ['BIO 162'] },
                { day: 'FRI', courses: ['ZOO 220'] }
              ].map((slot, idx) => (
                <div key={idx}>
                  <p className="text-xs font-semibold text-blue-300 mb-2">{slot.day}</p>
                  <div className="space-y-2">
                    {slot.day === 'MON' && (
                      <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">PHY 201</div>
                    )}
                    {slot.day === 'MON' && (
                      <div className="bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">ENG 1004</div>
                    )}
                    {slot.day === 'WED' && (
                      <div className="bg-blue-400 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">MAT 220</div>
                    )}
                    {slot.day === 'WED' && (
                      <div className="bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">CHE 201</div>
                    )}
                    {slot.day === 'THU' && (
                      <div className="bg-emerald-400 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">BIO 162</div>
                    )}
                    {slot.day === 'FRI' && (
                      <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">ZOO 220</div>
                    )}
                    {slot.day === 'FRI' && (
                      <div className="bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center">STA 201</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '📅', label: 'Timetable Scheduling' },
              { icon: '⏱️', label: 'Conflict Detection' },
              { icon: '👨‍🏫', label: 'Lecturer Management' },
              { icon: '📍', label: 'Venue Allocation' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-blue-100">
                <span className="text-xl">{feature.icon}</span>
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome back</h1>
            <p className="text-gray-600">
              Sign in to access your timetable, schedules and academic resources.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sci.ruh.ac.lk"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 hover:bg-white"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 hover:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer font-medium">
                Keep me signed in on this device
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              This is a secure university system. Access is restricted to authorized faculty, staff and students. Activity may be monitored.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-8">
            Need an account?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition">
              Contact the Faculty IT Office
            </a>
          </p>
          <p className="text-center text-xs text-gray-500 mt-4">
            © 2026 University of Ruhuna · Faculty of Science
          </p>
        </div>
      </div>
    </div>
  );
}