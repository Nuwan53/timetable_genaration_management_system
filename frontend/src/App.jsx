import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import LecturerSignup from "./pages/LecturerSignup";
import Dashboard from "./pages/Dashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import Courses from "./pages/Courses";
import Lecturers from "./pages/Lecturers";
import Venues from "./pages/Venues";
import Groups from "./pages/Groups";
import TimeSlots from "./pages/TimeSlots";
import Timetable from "./pages/Timetable";

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (userStr && token) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (!user || !localStorage.getItem("token")) {
    return <Navigate to="/" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lecturer-signup" element={<LecturerSignup />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/lecturer-dashboard" 
          element={
            <ProtectedRoute requiredRole="lecturer">
              <LecturerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Admin CRUD Routes */}
        <Route 
          path="/courses" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Courses />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/lecturers" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Lecturers />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/venues" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Venues />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/groups" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Groups />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/timeslots" 
          element={
            <ProtectedRoute requiredRole="admin">
              <TimeSlots />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/timetable" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Timetable />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;