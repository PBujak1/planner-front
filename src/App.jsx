import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginForm from "./pages/loginPage/LoginForm.jsx";
import RegisterForm from "./pages/loginPage/RegisterForm.jsx";
import RoomList from "./components/RoomList";
import Spaces from "./pages/Spaces";


function AppContent() {
    const { user } = useAuth();

    return (
        <Routes>

            <Route
                path="/login"
                element={user ? <Navigate to="/buildings" replace /> : <LoginForm />}
            />

            <Route
                path="/register"
                element={user ? <Navigate to="/rooms" /> : <RegisterForm />}
            />

            <Route
                path="/rooms"
                element={user ? <RoomList /> : <Navigate to="/login" />}
            />

            <Route
                path="/buildings"
                element={user ? <Spaces /> : <Navigate to="/login" replace />}
            />

            <Route
                path="*"
                element={<Navigate to="/login" />}
            />

        </Routes>
    );
}


export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}