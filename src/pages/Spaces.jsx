import { useState } from "react";

import BuildingCard from "../components/BuildingCard";
import RoomCard from "../components/RoomCard";
import NewBuildingDialog from "../components/NewBuildingDialog";
import NewRoomDialog from "../components/NewRoomDialog";

export default function Spaces() {

    const [selectedBuilding, setSelectedBuilding] = useState(null);

    const buildings = [
        {
            id: 1,
            name: "Building A",
            description: "Engineering Faculty",
            roomCount: 12,
            activeRooms: 10,
        },
        {
            id: 2,
            name: "Building B",
            description: "Computer Science",
            roomCount: 18,
            activeRooms: 17,
        },
    ];

    const rooms = [
        {
            id: 1,
            roomNumber: "A101",
            building: "Building A",
            capacity: 30,
            active: true,
        },
        {
            id: 2,
            roomNumber: "A102",
            building: "Building A",
            capacity: 20,
            active: true,
        },
        {
            id: 3,
            roomNumber: "B205",
            building: "Building B",
            capacity: 60,
            active: true,
        },
    ];

    return (
        <div className="max-w-7xl mx-auto p-8">

            {!selectedBuilding ? (
                <>
                    <div className="flex justify-between items-end mb-10">

                        <div>

                            <p className="uppercase tracking-[0.25em] text-gray-400 text-xs">
                                Buildings Management
                            </p>

                            <h1 className="text-4xl font-bold mt-2">
                                Buildings
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Manage all university buildings.
                            </p>

                        </div>

                        <NewBuildingDialog />

                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {buildings.map(building => (
                            <BuildingCard
                                key={building.id}
                                building={building}
                                onOpen={setSelectedBuilding}
                            />
                        ))}

                    </div>

                </>
            ) : (
                <>
                    <div className="flex justify-between items-end mb-10">

                        <div>

                            <button
                                onClick={() => setSelectedBuilding(null)}
                                className="text-blue-600 mb-3"
                            >
                                ← Back to buildings
                            </button>

                            <p className="uppercase tracking-[0.25em] text-gray-400 text-xs">
                                Rooms Management
                            </p>

                            <h1 className="text-4xl font-bold mt-2">
                                {selectedBuilding.name}
                            </h1>

                            <p className="text-gray-500 mt-2">
                                Manage rooms in this building.
                            </p>

                        </div>

                        <NewRoomDialog />

                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {rooms
                            .filter(
                                room => room.building === selectedBuilding.name
                            )
                            .map(room => (
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