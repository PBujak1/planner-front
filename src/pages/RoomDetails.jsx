import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import api from "../api/axios";
import "./styles/RoomDetails.css";

export default function RoomDetails() {
    const {id} = useParams();

    const [room, setRoom] = useState(null);
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadRoom = async () => {
            try {
                setLoading(true);
                setError("");

                const [roomResponse, layoutResponse] = await Promise.all([
                    api.get(`/rooms/${id}`),
                    api.get(`/rooms/${id}/layout`)
                ]);

                setRoom(roomResponse.data);
                setLayout(layoutResponse.data);
            } catch (err) {
                console.error("Error loading room:", err);
                setError("Nie udało się pobrać danych pokoju.");
            } finally {
                setLoading(false);
            }
        };

        loadRoom();
    }, [id]);

    if (loading) {
        return (
            <div className="room-details-loading">
                <Loader2 className="loading-icon" size={32}/>
                <span>Ładowanie pokoju...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="room-details-error">
                <p>{error}</p>

                <Link to="/rooms" className="back-button">
                    <ArrowLeft size={18}/>
                    Powrót do pokoi
                </Link>
            </div>
        );
    }

    if (!room || !layout) {
        return null;
    }

    return (
        <div className="room-details">

            <header className="room-details-header">

                <div className="room-details-title">
                    <Link to="/rooms" className="back-button">
                        <ArrowLeft size={18}/>
                    </Link>

                    <div>
                        <h1>Sala {room.roomNumber}</h1>

                        <p>
                            {room.building}
                            {room.floor !== null && ` • Piętro ${room.floor}`}
                        </p>
                    </div>
                </div>

                <div className="room-details-info">
                    <div>
                        <span>Pojemność</span>
                        <strong>{room.capacity} osób</strong>
                    </div>

                    <div>
                        <span>Typ</span>
                        <strong>{room.roomType}</strong>
                    </div>

                    <div>
                        <span>Układ</span>
                        <strong>{room.layoutType}</strong>
                    </div>
                </div>

            </header>


            <main className="room-editor">

                <div className="room-editor-toolbar">
                    <div>
                        <h2>Struktura pokoju</h2>
                        <p>
                            {layout.elements.length} elementów
                        </p>
                    </div>
                </div>


                <div className="room-canvas-container">

                    <div
                        className="room-canvas"
                        style={{
                            width: `${layout.width}px`,
                            height: `${layout.height}px`
                        }}
                    >

                        {layout.elements.map((element) => (
                            <div
                                key={element.id}
                                className={`room-element room-element-${element.type.toLowerCase()}`}
                                style={{
                                    left: `${element.x}px`,
                                    top: `${element.y}px`,
                                    width: `${element.width}px`,
                                    height: `${element.height}px`,
                                    transform: `rotate(${element.rotation || 0}deg)`
                                }}
                            >
                                {element.type}
                            </div>
                        ))}

                    </div>

                </div>

            </main>

        </div>
    );
}