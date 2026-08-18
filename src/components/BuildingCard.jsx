import "./styles/buildings/BuildingCard.css";
import { Building2 } from "lucide-react";

export default function BuildingCard({ building, onOpen, onDelete }) {
    return (
        <div
            className="building-card"
            onClick={() => onOpen(building)}
        >
            <Building2 className="building-icon"/>

            <h2>{building.name}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(building.id);
                    }}
                >
                    🗑️
                </button>
            </h2>

            <p className="building-description">
                {building.description}
            </p>

            <div className="building-info">
                <span>{building.roomCount} rooms</span>
                <span>{building.activeRooms} active</span>
            </div>
        </div>
    );
}