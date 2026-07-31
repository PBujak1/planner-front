import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import AuthLayout from "./AuthLayout";
import { Link } from "react-router-dom";
import "./styles/RegisterForm.css"
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function RegisterForm() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const { login } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                username,
                email,
                password
            });

            const { token, username: name } = response.data;

            login(token, name);

        } catch (err) {
            setError(
                err.response?.data || "Nie udało się utworzyć konta"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            icon={UserPlus}
            title="Create account"
            subtitle="Register a new user"
            footer={
                <>
                    Already have an account?{" "}
                    <Link to="/login" className="footer-link">
                        Login
                    </Link>
                </>
            }
        >
            <form
                className="form-group"
                onSubmit={handleSubmit}
            >
                <label htmlFor="email" className="form-label">
                    Your Email
                </label>
                <input className="input-field"
                       type="text"
                       placeholder="Email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="username" className="form-label">
                    Your Username
                </label>
                <input className="input-field"
                       type="text"
                       placeholder="Username"
                       value={username}
                       onChange={(e) => setUsername(e.target.value)}
                />
                <label htmlFor="password" className="form-label">
                    Your Password
                </label>
                <input className="input-field"
                       type="password"
                       placeholder="Password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    className="submit-button"
                    type="submit"
                >
                    Create account
                </button>

            </form>
        </AuthLayout>
    );
}