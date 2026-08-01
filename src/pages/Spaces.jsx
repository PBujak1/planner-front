import {useState} from "react";

import BuildingCard from "../components/BuildingCard";
import RoomCard from "../components/RoomCard";

import NewBuildingDialog from "../components/NewBuildingDialog";
import NewRoomDialog from "../components/NewRoomDialog";

import "../components/styles/buildings/Spaces.css";


export default function Spaces(){
    const [selectedBuilding,setSelectedBuilding] = useState(null);

    const buildings=[
        {
            id:1,
            name:"Building A",
            description:"Engineering Faculty",
            roomCount:12,
            activeRooms:10
        },
        {
            id:2,
            name:"Building B",
            description:"Computer Science",
            roomCount:20,
            activeRooms:18
        },
        {
            id:3,
            name:"Building B2",
            description:"WieIk",
            roomCount:20,
            activeRooms:20
        }
    ];

    const rooms=[
        {
            id:1,
            roomNumber:"A101",
            building:"Building A",
            capacity:30,
            active:true
        },
        {
            id:2,
            roomNumber:"A102",
            building:"Building A",
            capacity:20,
            active:true
        }
    ];

    return (
        <div className="spaces-container">
            {!selectedBuilding ? (
                <>
                    <div className="spaces-header">
                        <div>
                            <h1>Buildings</h1>
                            <p>
                                Manage university buildings
                            </p>
                        </div>
                        <NewBuildingDialog/>
                    </div>
                    <div className="building-grid"> {
                            buildings.map(building=>(
                                <BuildingCard
                                    key={building.id}
                                    building={building}
                                    onOpen={setSelectedBuilding}
                                />
                            ))}
                    </div>
                </>
            ):(
                <>
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
                        <span className="back-button-text">Back</span>
                    </button>
                            <h1>
                                {selectedBuilding.name}
                            </h1>
                        </div>
                        <NewRoomDialog/>
                    </div>
                    <div className="room-grid"> {
                            rooms
                                .filter(r=>r.building===selectedBuilding.name)
                                .map(room=>(
                                    <RoomCard
                                        key={room.id}
                                        room={room}
                                    />
                                ))}
                    </div>
                </>
            )}
        </div>
    );
}