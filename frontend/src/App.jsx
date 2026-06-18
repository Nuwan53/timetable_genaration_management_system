import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import LecturerSignup from "./pages/LecturerSignup";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lecturer-signup" element={<LecturerSignup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;