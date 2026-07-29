import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await api.post("/auth/login", { username, password });
            const { token, username: name, role } = response.data;
            login(token, name, role);
        } catch (err) {
            setError("Błędny login lub hasło");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: "40px auto" }}>
            <h2>Logowanie</h2>

            <div style={{ marginBottom: 12 }}>
                <label>Login</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                    required
                />
            </div>

            <div style={{ marginBottom: 12 }}>
                <label>Hasło</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                    required
                />
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button type="submit" style={{ width: "100%", padding: 10 }}>
                Zaloguj
            </button>
        </form>
    );
}
