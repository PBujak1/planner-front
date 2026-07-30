import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, LogIn, Loader2 } from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import AuthLayout from "../components/AuthLayout";
import "./styles/LoginForm.css";

export default function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", { username, password });
            const { token, username: name, role } = response.data;
            login(token, name, role);
        } catch (err) {
            setError("Błędny login lub hasło");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            icon={LogIn}
            title="Welcome back"
            subtitle="Log in to your account"
            footer={
                <>
                    Don't have an account?{" "}
                    <Link to="/register" className="footer-link">
                        Create one
                    </Link>
                </>
            }
        >
            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="username" className="form-label">
                        Login
                    </label>
                    <div className="input-wrapper">
                        <Mail className="input-icon" />
                        <input
                            id="username"
                            type="text"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field"
                            autoFocus
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">
                        Password
                    </label>
                    <div className="input-wrapper">
                        <Lock className="input-icon" />
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" style={{ width: "1rem", height: "1rem" }} />
                            Logging in...
                        </>
                    ) : (
                        "Log in"
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}