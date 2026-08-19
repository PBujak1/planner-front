import "./styles/buildings/RoomCard.css";
import { Users, MapPin, Trash2 } from "lucide-react";

export default function RoomCard({ room, onDelete }) {

    return (
        <div className="room-card">

            <div className="room-header">
                <div>
                    <h2>
                        {room.roomNumber}

                        <button
                            className="delete-room-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(building.id);
                            }}
                        >
                            <Trash2 size={17} />
                        </button>
                    </h2>

                    <p>
                        {room.building}
                    </p>
                </div>

                <MapPin className="room-icon"/>
            </div>

            <div className="room-details">

                <div>
                    <Users size={18}/>
                    {room.capacity} people
                </div>

                <span
                    className={
                        room.active
                            ? "room-status active"
                            : "room-status inactive"
                    }
                >
                    {room.active ? "Free" : "Reserved"}
                </span>

            </div>

            <button className="details-button">
                Details
            </button>

        </div>
    );
}