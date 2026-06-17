import { useState } from "react";
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
    office: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    alert(
      "Lecturer account request submitted. Please wait for admin approval."
    );
    navigate("/");
  };

  return (
    <div>
      <section>
        <div>
          <div>
            <div>
              <BookOpen size={26} />
            </div>

            <div>
              <h1>University of Ruhuna</h1>

              <p>Faculty of Science</p>
            </div>
          </div>

          <p>Lecturer Account Request</p>

          <h2>Request access to the timetable system.</h2>

          <p>
            New lecturers can request an account to view personal teaching
            schedules and assigned academic sessions.
          </p>
        </div>

        <p>
          Lecturer accounts require admin approval before login.
        </p>
      </section>

      <section>
        <div>
          <div>
            <h1>Lecturer Signup Request</h1>

            <p>
              Submit your details to request lecturer access.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
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
          

          <div>
            <button>
                Submit Account Request
            </button>

            <P>
                Already have an account?{" "}

                <Link>
                    Sign in
                </Link>
            </P>
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
           <label>
                {label}
           </label>

           <div>
                <span>
                    {icon}
                </span>

                <input
                    required={required}
                    {...props}
                
                />
           </div>
        </div>
    );

}

function Select({ label, options, ...props }) {
    return (
        <div>
            <label>
                {label}
            </label>

            <select>
                 {...props}
            </select>
        </div>
    );
}