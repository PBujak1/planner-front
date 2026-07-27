import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import RoomList from "./components/RoomList";

function AppContent() {
    const { user } = useAuth();
    return user ? <RoomList /> : <LoginForm />;
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}