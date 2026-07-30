import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import RoomList from "./components/RoomList";


function AppContent() {
    const { user } = useAuth();

    return (
        <Routes>

            <Route
                path="/login"
                element={user ? <Navigate to="/rooms" /> : <LoginForm />}
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