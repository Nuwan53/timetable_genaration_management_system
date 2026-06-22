import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import LecturerSignup from "./pages/LecturerSignup";
import Dashboard from "./pages/Dashboard";
import LecturerDashboard from "./pages/LecturerDashboard";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lecturer-signup" element={<LecturerSignup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}


export default App;