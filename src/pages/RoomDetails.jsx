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

    const [selectedElementId, setSelectedElementId] = useState(null);

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

    const handleElementMouseDown = (event, element) => {
        event.stopPropagation();
        setSelectedElementId(element.id);

        const node = event.currentTarget;

        const startMouseX = event.clientX;
        const startMouseY = event.clientY;

        const startElementX = element.x;
        const startElementY = element.y;

        // Fallback: jeśli layout.width/height z jakiegoś powodu nie istnieje,
        // weź wymiary bezpośrednio z canvasu w DOM
        const canvas = node.parentElement;
        const maxWidth = layout?.width ?? canvas.clientWidth;
        const maxHeight = layout?.height ?? canvas.clientHeight;

        let finalX = startElementX;
        let finalY = startElementY;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startMouseX;
            const deltaY = moveEvent.clientY - startMouseY;

            let newX = startElementX + deltaX;
            let newY = startElementY + deltaY;

            // Zabezpieczenie przed NaN / undefined w obliczeniach
            if (Number.isNaN(newX)) newX = startElementX;
            if (Number.isNaN(newY)) newY = startElementY;

            finalX = Math.max(0, Math.min(newX, maxWidth - element.width));
            finalY = Math.max(0, Math.min(newY, maxHeight - element.height));

            node.style.left = `${finalX}px`;
            node.style.top = `${finalY}px`;
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            setLayout((currentLayout) => ({
                ...currentLayout,
                elements: currentLayout.elements.map((el) =>
                    el.id === element.id ? { ...el, x: finalX, y: finalY } : el
                )
            }));

            // opcjonalnie: zapis do API tutaj, z finalX/finalY
            // api.patch(`/rooms/${id}/layout/elements/${element.id}`, { x: finalX, y: finalY });
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleCanvasMouseDown = () => {
        setSelectedElementId(null);
    };


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

                <Link to="/rooms" className="back-button-details">
                    <ArrowLeft size={18}/>
                    <span>Back</span>
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
                    <Link to="/rooms" className="back-button-details">
                        <ArrowLeft size={18}/>
                        <span>Back</span>
                    </Link>

                    <div>
                        <h1>Room: {room.roomNumber}</h1>
                        <p>
                            {room.building}
                            {room.floor !== null && ` • Piętro ${room.floor}`}
                        </p>
                    </div>
                </div>

                <div className="room-details-info">
                    <div>
                        <span>Capacity</span>
                        <strong>{room.capacity} osób</strong>
                    </div>

                    <div>
                        <span>Type</span>
                        <strong>{room.roomType}</strong>
                    </div>

                    <div>
                        <span>Layout</span>
                        <strong>{room.layoutType}</strong>
                    </div>
                </div>

            </header>


            <main className="room-editor">

                <div className="room-editor-toolbar">
                    <div>
                        <h2>Room Structure</h2>
                        <p>
                            {layout.elements.length} elements
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
                        onMouseDown={handleCanvasMouseDown}
                    >

                        {layout.elements.map((element) => (
                            <div
                                key={element.id}
                                className={`
                                    room-element
                                    room-element-${element.type.toLowerCase()}
                                    ${selectedElementId === element.id ? "room-element-selected" : ""}
                                `}
                                style={{
                                    left: `${element.x}px`,
                                    top: `${element.y}px`,
                                    width: `${element.width}px`,
                                    height: `${element.height}px`,
                                    transform: `rotate(${element.rotation || 0}deg)`
                                }}
                                onMouseDown={(event) => handleElementMouseDown(event, element)}
                            >
                                {element.label || element.type}
                            </div>
                        ))}

                    </div>

                </div>

            </main>

        </div>
    );
}