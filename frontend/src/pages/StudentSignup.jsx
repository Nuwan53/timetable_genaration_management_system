import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Mail, Lock, User, IdCard, Eye, EyeOff } from "lucide-react";


export default function StudentSignup() {

    const navigate = useNavigate();

     const [showPassword, setShowPassword] = useState(false);
     const [form, setForm] = useState({
        fullName: "",
        email: "",
        regNo: "",
        password: "",
        confirmPassword: "",
        stream: "",
        pathway: "",
        level: "",
        studentGroup: "",
        practicalGroup: "",
    });


    form.stream === "Physical Science"
      ? ["PS1", "PS2", "PS3", "PS4", "PS5", "PS6", "PS7", "PS8"]
      : form.stream === "Biological Science"
      ? ["BS1", "BS2", "BS3", "BS4"]
      : [];

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSignup = (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        alert("Student account request submitted. Wait for admin approval.");
        navigate("/");

    };

    return (
        <div>
            <section>
                <div>
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center">
                            <BookOpen size={26} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold">University of Ruhuna</h1>
                            <p className="text-blue-200 text-sm">Faculty of Science</p>
                        </div>
                    </div>

                    <p>
                        Student Registration
                    </p>

                    <h2>
                        Join the timetable platform.
                    </h2>
                </div>
            </section>
        </div>
    );

}