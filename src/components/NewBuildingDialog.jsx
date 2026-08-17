import "./styles/buildings/NewBuildingDialog.css";
import { useState } from "react";
import api from "../api/axios";

export default function NewBuildingDialog({ onBuildingCreated }) {

    const [isOpen, setIsOpen] = useState(false);

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("/buildings", {
                name,
                address,
                description
            });

            console.log("Building created:", response.data);

            // poinformuj Buildings/Spaces, że pojawił się nowy budynek
            if (onBuildingCreated) {
                onBuildingCreated(response.data);
            }

            // wyczyść formularz
            setName("");
            setAddress("");
            setDescription("");

            // zamknij dialog
            setIsOpen(false);

        } catch (error) {
            console.error("Error creating building:", error);

            setError(
                error.response?.data?.message ||
                "Failed to create building"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                className="add-button"
                onClick={() => setIsOpen(true)}
            >
                <span>+ Add Building</span>
            </button>

            {isOpen && (
                <div className="dialog-overlay">
                    <div className="building-dialog">

                        <div className="dialog-header">
                            <h2>Add Building</h2>

                            <button
                                className="close-button"
                                onClick={() => setIsOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <label>
                                Building name

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    placeholder="e.g. Building A"
                                    required
                                />
                            </label>

                            <label>
                                Address

                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) =>
                                        setAddress(e.target.value)
                                    }
                                    placeholder="e.g. Warszawska 24"
                                />
                            </label>

                            <label>
                                Description

                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Building description..."
                                    rows={4}
                                />
                            </label>

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <div className="dialog-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="create-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Creating..."
                                        : "Create Building"
                                    }
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
}