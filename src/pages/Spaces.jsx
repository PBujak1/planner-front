import { useEffect, useState } from "react";


import BuildingCard from "../components/BuildingCard";
import RoomCard from "../components/RoomCard";

import { useLocation } from "react-router-dom";
import NewBuildingDialog from "../components/NewBuildingDialog";
import NewRoomDialog from "../components/NewRoomDialog";

import "./styles/Spaces.css";

import api from "../api/axios";
import {useAuth} from "@/context/AuthContext.jsx";

export default function Spaces() {

    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const { logout } = useAuth();
    const location = useLocation();

    const [selectedBuilding, setSelectedBuilding] = useState(null);

    const [loadingBuildings, setLoadingBuildings] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(false);

    const handleRoomCreated = (newRoom) => {
        setRooms(prevRooms => [
            ...prevRooms,
            newRoom
        ]);
    };

    const handleBuildingDeleted = async (buildingId) => {
        if (!window.confirm("Are you sure you want to delete this building?")) {
            return;
        }
        try {
            await api.delete(`/buildings/${buildingId}`);

            setBuildings(prevBuilds =>
                prevBuilds.filter((building) => building.id !== buildingId)
            );
        } catch (error) {
            console.error("Error while deleting this building", error);
            alert("Failed to delete this building");
        }
    }

    const handleRoomDeleted = async (roomId) => {
        if (!window.confirm("Are you sure you want to delete this room?")) {
            return;
        }

        try {
            await api.delete(`/rooms/${roomId}`);

            setRooms(prevRooms =>
                prevRooms.filter((room) => room.id !== roomId)
            );
        } catch (error) {
            console.error("Error while deleting this room", error);
            alert("Failed to delete this room");
        }
    }

    /*
     * Pobieranie budynków
     */
    useEffect(() => {
        const fetchBuildings = async () => {
            try {
                const response = await api.get("/buildings");
                setBuildings(response.data);
            } catch (error) {
                console.error("Error while fetching buildings:", error);
            } finally {
                setLoadingBuildings(false);
            }
        };
        fetchBuildings();
    }, []);


    /*
     * Pobieranie pokoi po wybraniu budynku
     */
    useEffect(() => {
        if (!selectedBuilding) {
            setRooms([]);
            return;
        }
        const fetchRooms = async () => {
            setLoadingRooms(true);
            try {
                const response = await api.get(
                    `/rooms/building/${selectedBuilding.id}`
                );
                setRooms(response.data);
            } catch (error) {
                console.error("Error while fetching rooms:", error);
            } finally {
                setLoadingRooms(false);
            }
        };
        fetchRooms();
    }, [selectedBuilding]);


    /*
     * Wyświetlanie budynków
     */
    if (!selectedBuilding) {
        return (
            <div className="spaces-container">
                <div className="spaces-header">
                    <div>
                        <h1>Buildings</h1>
                        <p>
                            Manage university buildings
                        </p>
                    </div>
                    <div className="spaces-actions">
                        <NewBuildingDialog
                            onBuildingCreated={(newBuilding) => {
                                setBuildings((prev) => [...prev, newBuilding]);
                            }}
                        />

                        <button
                            className="logout-button"
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
                {loadingBuildings ? (
                    <p>Loading buildings...</p>
                ) : buildings.length === 0 ? (
                    <p>No buildings found.</p>
                ) : (
                    <div className="building-grid">
                        {buildings.map(building => (
                            <BuildingCard
                                key={building.id}
                                building={building}
                                onOpen={setSelectedBuilding}
                                onDelete={handleBuildingDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return (
        <div className="spaces-container">
            <div className="spaces-header">
                <div>
                    <button
                        className="back-button"
                        onClick={() => setSelectedBuilding(null)}
                    >
                        <div className="back-button-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 1024 1024"
                                width="25"
                                height="25"
                            >
                                <path
                                    d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                                    fill="#000"
                                />
                                <path
                                    d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                                    fill="#000"
                                />
                            </svg>
                        </div>
                        <span className="back-button-text">
                            Back
                        </span>
                    </button>
                    <h1>
                        {selectedBuilding.name}
                    </h1>
                    <p>
                        {selectedBuilding.description}
                    </p>
                </div>
                <NewRoomDialog
                    buildingId={selectedBuilding.id}
                    onRoomCreated={handleRoomCreated}
                />
            </div>
            {loadingRooms ? (
                <p>Loading rooms...</p>
            ) : rooms.length === 0 ? (
                <p>
                    No rooms found in this building.
                </p>
            ) : (
                <div className="room-grid">
                    {rooms.map(room => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onDelete={handleRoomDeleted}
                            from={location.pathname}
                            building={selectedBuilding}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}