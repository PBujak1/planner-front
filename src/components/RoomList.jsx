import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function RoomList() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();

    useEffect(() => {
        api
            .get("/rooms")
            .then((res) => setRooms(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Ładowanie pokoi...</p>;

    return (
        <div style={{ maxWidth: 600, margin: "40px auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h2>Witaj, {user.username}!</h2>
                <button onClick={logout}>Wyloguj</button>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12 }}
                    >
                        <strong>Pokój {room.roomNumber}</strong> — {room.roomType}
                        <br />
                        Pojemność: {room.capacity} os.
                        <br />
                        Cena: {room.pricePerNight} zł / noc
                    </div>
                ))}
            </div>
        </div>
    );
}