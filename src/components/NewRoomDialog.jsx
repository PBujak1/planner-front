import { useState } from "react";
import "./styles/buildings/NewRoomDialog.css";
import api from "../api/axios"

export default function NewRoomDialog({buildingId, onRoomCreated}) {
    const [open, setOpen] = useState(false);

    const [roomNumber, setRoomNumber] = useState("");
    const [floor, setFloor] = useState("");
    const [capacity, setCapacity] = useState("");
    const [description, setDescription] = useState("");

    const [roomType, setRoomType] = useState("CLASSROOM");
    const [layoutType, setLayoutType] = useState("ROWS");

    const [loading, setLoading] = useState(false);

    /*
     * Generowanie miejsc tylko do podglądu.
     */
    function generateSeats(count) {
        const seats = [];
        const number = Number(count);

        if (!number || number <= 0) {
            return seats;
        }

        /*
         * Maksymalnie pokazujemy 40 miejsc
         * w podglądzie, żeby duża sala
         * nie rozwaliła formularza.
         */
        const previewCount = Math.min(number, 40);
        for (let i = 0; i < previewCount; i++) {
            seats.push({
                id: i + 1
            });
        }
        return seats;
    }

    /*
     * Miejsca widoczne w podglądzie.
     */
    const seats = generateSeats(capacity);

    /*
     * Utworzenie sali
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!buildingId) {
            alert("Select a building.");
            return;
        }

        if (!roomNumber.trim()) {
            alert("Enter room number.");
            return;
        }

        if (!capacity || Number(capacity) <= 0) {
            alert("Enter valid capacity.");
            return;
        }

        try {
            setLoading(true);

            const room = {
                roomNumber: roomNumber.trim(),
                building: {
                    id: Number(buildingId)
                },
                floor: Number(floor),
                capacity: Number(capacity),
                description: description.trim(),
                roomType: roomType,
                layoutType: layoutType,
                active: true
            };

            console.log("Sending room:", room);

            const response = await api.post("/rooms", room);

            console.log("Room created:", response.data);

            if (onRoomCreated) {
                onRoomCreated(response.data);
            }

            alert("Room created successfully!");

            resetForm();

        } catch (error) {
            console.error("Error while creating room:", error);

            if (error.response) {
                console.error("Backend response:", error.response.data);
                console.error("Status:", error.response.status);
            }

            alert("Could not create room.");

        } finally {
            setLoading(false);
        }
    };


    /*
     * Wyczyszczenie formularza
     */
    const resetForm = () => {

        setRoomNumber("");
        setFloor("");
        setCapacity("");
        setDescription("");

        setRoomType("CLASSROOM");
        setLayoutType("ROWS");

        setOpen(false);
    };


    /*
     * Podgląd miejsc w zależności
     * od wybranego układu.
     */
    const renderSeats = () => {

        if (seats.length === 0) {
            return (
                <div className="empty-seat-preview">
                    Enter room capacity
                </div>
            );
        }


        /*
         * SEMICIRCLE
         */
        if (layoutType === "SEMICIRCLE") {
            return (
                <div className="semicircle-seat-layout">
                    {seats.map((seat, index) => {
                        const angle =
                            Math.PI *
                            (index / Math.max(seats.length - 1, 1));
                        const x =
                            50 + Math.cos(angle) * 40;
                        const y =
                            75 - Math.sin(angle) * 45;
                        return (
                            <div
                                key={seat.id}
                                className="preview-seat"
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`
                                }}
                            >
                                {seat.id}
                            </div>
                        );
                    })}
                </div>
            );
        }


        /*
         * CLASSROOM / ROWS
         */
        const columns = 5;

        return (
            <div className="rows-seat-layout">
                {seats.map((seat, index) => {
                    const row =
                        Math.floor(index / columns);
                    const column =
                        index % columns;
                    return (
                        <div
                            key={seat.id}
                            className="preview-seat"
                            style={{
                                left: `${15 + column * 18}%`,
                                top: `${15 + row * 17}%`
                            }}
                        >
                            {seat.id}
                        </div>
                    );
                })}
            </div>
        );
    };


    return (
        <>
            {/* ADD ROOM BUTTON */}
            <button
                className="add-room-button"
                onClick={() => setOpen(true)}
            >
                + Add Room
            </button>


            {/* DIALOG */}
            {open && (
                <div className="room-dialog-overlay">
                    <div className="room-dialog">
                        {/* HEADER */}
                        <div className="room-dialog-header">
                            <div>
                                <span>
                                    ROOM MANAGEMENT
                                </span>

                                <h2>
                                    Add Room
                                </h2>

                            </div>

                            <button
                                type="button"
                                className="room-close-button"
                                onClick={resetForm}
                            >
                                ×
                            </button>

                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSubmit}>
                            {/* ROOM NUMBER */}
                            <label>
                                Room number
                                <input
                                    type="text"
                                    value={roomNumber}
                                    onChange={(e) =>
                                        setRoomNumber(e.target.value)
                                    }
                                    placeholder="A101"
                                    required
                                />
                            </label>

                            {/* FLOOR + CAPACITY */}
                            <div className="room-form-row">
                                <label>
                                    Floor
                                    <input
                                        type="number"
                                        value={floor}
                                        onChange={(e) =>
                                            setFloor(e.target.value)
                                        }
                                        min="0"
                                        required
                                    />
                                </label>
                                <label>
                                    Capacity
                                    <input
                                        type="number"
                                        value={capacity}
                                        onChange={(e) =>
                                            setCapacity(e.target.value)
                                        }
                                        min="1"
                                        max="200"
                                        required
                                    />
                                </label>
                            </div>


                            {/* ROOM TYPE */}
                            <label>
                                Room type
                                <select
                                    value={roomType}
                                    onChange={(e) =>
                                        setRoomType(e.target.value)
                                    }
                                >
                                    <option value="CLASSROOM">
                                        Classroom
                                    </option>
                                    <option value="LECTURE_HALL">
                                        Lecture hall
                                    </option>
                                    <option value="MEETING_ROOM">
                                        Meeting room
                                    </option>
                                </select>
                            </label>
                            {/* ROOM LAYOUT */}
                            <label>
                                Room layout
                                <div className="layout-options">
                                    {/* ROWS */}
                                    <button
                                        type="button"
                                        className={
                                            layoutType === "ROWS"
                                                ? "layout-option selected"
                                                : "layout-option"
                                        }
                                        onClick={() =>
                                            setLayoutType("ROWS")
                                        }
                                    >
                                        <div className="layout-preview rows">
                                            <i></i>
                                            <i></i>
                                            <i></i>
                                            <i></i>
                                        </div>
                                        <strong>
                                            Rows
                                        </strong>
                                        <span>
                                            Standard classroom
                                        </span>
                                    </button>

                                    {/* SEMICIRCLE */}
                                    <button
                                        type="button"
                                        className={
                                            layoutType === "SEMICIRCLE"
                                                ? "layout-option selected"
                                                : "layout-option"
                                        }
                                        onClick={() =>
                                            setLayoutType("SEMICIRCLE")
                                        }
                                    >
                                        <div className="layout-preview semicircle">
                                            <i></i>
                                            <i></i>
                                            <i></i>
                                            <i></i>
                                        </div>
                                        <strong>
                                            Semicircle
                                        </strong>
                                        <span>
                                            Lecture hall
                                        </span>
                                    </button>

                                    {/* CLASSROOM */}
                                    <button
                                        type="button"
                                        className={
                                            layoutType === "CLASSROOM"
                                                ? "layout-option selected"
                                                : "layout-option"
                                        }
                                        onClick={() =>
                                            setLayoutType("CLASSROOM")
                                        }
                                    >
                                        <div className="layout-preview classroom">
                                            <i></i>
                                            <i></i>
                                            <i></i>
                                            <i></i>
                                        </div>
                                        <strong>
                                            Classroom
                                        </strong>
                                        <span>
                                            Desk arrangement
                                        </span>
                                    </button>
                                </div>
                            </label>
                            {/* SEAT PREVIEW */}
                            <div className="room-preview">
                                <div className="front-of-room">
                                    FRONT OF ROOM
                                </div>
                                <div className="seat-preview">
                                    {renderSeats()}
                                </div>
                            </div>
                            {/* DESCRIPTION */}
                            <label>
                                Description
                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Describe this room..."
                                />
                            </label>
                            {/* CREATE */}
                            <button
                                type="submit"
                                className="create-room-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating..."
                                    : "Create Room"
                                }
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}