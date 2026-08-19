import "./styles/buildings/BuildingCard.css";
import { Building2, Trash2 } from "lucide-react";

export default function BuildingCard({ building, onOpen, onDelete }) {
    return (
        <div
            className="building-card"
            onClick={() => onOpen(building)}
        >
            <Building2 className="building-icon"/>

            <button
                className="delete-building-button"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(building.id);
                }}
            >
                <Trash2 size={17} />
            </button>

            <h2>{building.name}</h2>

            <p className="building-description">
                {building.description}
            </p>

            <div className="building-info">
                <span>{building.roomCount} rooms</span>
            </div>
        </div>
    );
}