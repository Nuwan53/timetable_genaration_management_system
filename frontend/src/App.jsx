import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/student-signup" element={<StudentSignup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;