import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Eye, Save, X } from "lucide-react";
import { useLocation } from "react-router-dom";

import api from "../api/axios";
import "./styles/RoomDetails.css";

const MIN_LAYOUT_WIDTH = 800;
const MIN_LAYOUT_HEIGHT = 600;

export default function RoomDetails() {
    const { id } = useParams();

    const [room, setRoom] = useState(null);
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const location = useLocation();
    const backTo = location.state?.from || "/buildings";
    const backBuilding = location.state?.building;

    const [selectedElementIds, setSelectedElementIds] = useState(new Set());
    const [selectionBox, setSelectionBox] = useState(null);

    // --- draft rozmiaru canvasu: edytowany lokalnie, niezapisany do API ---
    const [canvasDraft, setCanvasDraft] = useState({ width: MIN_LAYOUT_WIDTH, height: MIN_LAYOUT_HEIGHT });
    const [previewMode, setPreviewMode] = useState(false);
    const [saving, setSaving] = useState(false);

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
                setCanvasDraft({
                    width: layoutResponse.data.width,
                    height: layoutResponse.data.height
                });
            } catch (err) {
                console.error("Error loading room:", err);
                setError("Failed to load room layout!");
            } finally {
                setLoading(false);
            }
        };

        loadRoom();
    }, [id]);

    const isSelected = (elementId) => selectedElementIds.has(elementId);

    const isCanvasDirty =
        layout != null &&
        (canvasDraft.width !== layout.width || canvasDraft.height !== layout.height);

    // --- przesuwanie (pojedynczego elementu lub całej grupy) ---
    const handleElementMouseDown = (event, element) => {
        event.stopPropagation();

        const isModifierPressed = event.shiftKey || event.ctrlKey || event.metaKey;

        if (isModifierPressed) {
            setSelectedElementIds((current) => {
                const next = new Set(current);
                if (next.has(element.id)) {
                    next.delete(element.id);
                } else {
                    next.add(element.id);
                }
                return next;
            });
            return;
        }

        let idsToMove;
        if (selectedElementIds.has(element.id) && selectedElementIds.size > 1) {
            idsToMove = new Set(selectedElementIds);
        } else {
            idsToMove = new Set([element.id]);
            setSelectedElementIds(idsToMove);
        }

        const node = event.currentTarget;
        const startMouseX = event.clientX;
        const startMouseY = event.clientY;

        const canvas = node.parentElement;
        const maxWidth = layout?.width ?? canvas.clientWidth;
        const maxHeight = layout?.height ?? canvas.clientHeight;

        const startPositions = new Map();
        layout.elements.forEach((el) => {
            if (idsToMove.has(el.id)) {
                startPositions.set(el.id, { x: el.x, y: el.y, width: el.width, height: el.height });
            }
        });

        let finalPositions = new Map(startPositions);

        const handleMouseMove = (moveEvent) => {
            let deltaX = moveEvent.clientX - startMouseX;
            let deltaY = moveEvent.clientY - startMouseY;

            if (Number.isNaN(deltaX)) deltaX = 0;
            if (Number.isNaN(deltaY)) deltaY = 0;

            let minDeltaX = -Infinity;
            let maxDeltaX = Infinity;
            let minDeltaY = -Infinity;
            let maxDeltaY = Infinity;

            startPositions.forEach((pos) => {
                minDeltaX = Math.max(minDeltaX, -pos.x);
                maxDeltaX = Math.min(maxDeltaX, maxWidth - pos.width - pos.x);
                minDeltaY = Math.max(minDeltaY, -pos.y);
                maxDeltaY = Math.min(maxDeltaY, maxHeight - pos.height - pos.y);
            });

            deltaX = Math.max(minDeltaX, Math.min(deltaX, maxDeltaX));
            deltaY = Math.max(minDeltaY, Math.min(deltaY, maxDeltaY));

            const nextPositions = new Map();
            startPositions.forEach((pos, elId) => {
                nextPositions.set(elId, { ...pos, x: pos.x + deltaX, y: pos.y + deltaY });
            });

            finalPositions = nextPositions;

            setLayout((currentLayout) => ({
                ...currentLayout,
                elements: currentLayout.elements.map((el) =>
                    nextPositions.has(el.id)
                        ? { ...el, x: nextPositions.get(el.id).x, y: nextPositions.get(el.id).y }
                        : el
                )
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            finalPositions.forEach((pos, elId) => {
                api.patch(`/rooms/${id}/layout/elements/${elId}`, { x: pos.x, y: pos.y });
            });
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleCanvasMouseDown = (event) => {
        if (event.target !== event.currentTarget) return;

        const isModifierPressed = event.shiftKey || event.ctrlKey || event.metaKey;
        const baseSelection = isModifierPressed ? new Set(selectedElementIds) : new Set();

        if (!isModifierPressed) {
            setSelectedElementIds(new Set());
        }

        const canvas = event.currentTarget;
        const canvasRect = canvas.getBoundingClientRect();

        const startX = event.clientX - canvasRect.left;
        const startY = event.clientY - canvasRect.top;

        setSelectionBox({ x: startX, y: startY, width: 0, height: 0 });

        const handleMouseMove = (moveEvent) => {
            const currentX = moveEvent.clientX - canvasRect.left;
            const currentY = moveEvent.clientY - canvasRect.top;

            const boxX = Math.min(startX, currentX);
            const boxY = Math.min(startY, currentY);
            const boxWidth = Math.abs(currentX - startX);
            const boxHeight = Math.abs(currentY - startY);

            setSelectionBox({ x: boxX, y: boxY, width: boxWidth, height: boxHeight });

            const idsInBox = new Set(baseSelection);

            layout.elements.forEach((element) => {
                const intersects =
                    element.x < boxX + boxWidth &&
                    element.x + element.width > boxX &&
                    element.y < boxY + boxHeight &&
                    element.y + element.height > boxY;

                if (intersects) {
                    idsInBox.add(element.id);
                }
            });

            setSelectedElementIds(idsInBox);
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            setSelectionBox(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleAddElement = async (type) => {
        try {
            const newElement = {
                type: type,
                label: type,
                x: 100,
                y: 100,
                width: type === "CHAIR" ? 50 : 120,
                height: type === "CHAIR" ? 50 : 60,
                rotation: 0,
                capacity: null
            };

            const response = await api.post(`/rooms/${id}/layout/elements`, newElement);

            setLayout((currentLayout) => ({
                ...currentLayout,
                elements: [
                    ...currentLayout.elements,
                    response.data
                ]
            }));

            setSelectedElementIds(new Set([response.data.id]));

        } catch (error) {
            console.error("Error adding element:", error);
        }
    };

    const handleDeleteElement = async () => {
        if (selectedElementIds.size === 0) {
            return;
        }

        const idsToDelete = Array.from(selectedElementIds);

        try {
            await Promise.all(
                idsToDelete.map((elId) =>
                    api.delete(`/rooms/${id}/layout/elements/${elId}`)
                )
            );

            setLayout((currentLayout) => ({
                ...currentLayout,
                elements: currentLayout.elements.filter(
                    (element) => !selectedElementIds.has(element.id)
                )
            }));

            setSelectedElementIds(new Set());

        } catch (error) {
            console.error("Error deleting elements:", error);
        }
    };

    const singleSelectedElement =
        selectedElementIds.size === 1
            ? layout?.elements.find((element) => selectedElementIds.has(element.id))
            : null;

    const handleElementChange = async (property, value) => {
        if (!singleSelectedElement) {
            return;
        }

        const elementId = singleSelectedElement.id;

        const updatedElement = {
            ...singleSelectedElement,
            [property]: value
        };

        setLayout((currentLayout) => ({
            ...currentLayout,
            elements: currentLayout.elements.map(
                (currentElement) =>
                    currentElement.id === elementId
                        ? updatedElement
                        : currentElement
            )
        }));

        try {
            await api.patch(`/rooms/${id}/layout/elements/${elementId}`, { [property]: value });
        } catch (error) {
            console.error("Error updating element:", error);
        }
    };

    // --- rozmiar canvasu: TYLKO zmiana draftu, żadnego requestu ---
    const handleCanvasDraftChange = (property, rawValue) => {
        const minValue = property === "width" ? MIN_LAYOUT_WIDTH : MIN_LAYOUT_HEIGHT;

        let value = Number(rawValue);
        if (Number.isNaN(value)) {
            value = minValue;
        }
        value = Math.max(minValue, value);

        setCanvasDraft((current) => ({ ...current, [property]: value }));
    };

    const handleTogglePreview = () => {
        setPreviewMode((current) => !current);
    };

    const handleDiscardCanvasChanges = () => {
        setCanvasDraft({ width: layout.width, height: layout.height });
        setPreviewMode(false);
    };

    // --- jeden zbiorczy zapis: rozmiar canvasu + pełna lista elementów ---
    const handleSaveChanges = async () => {
        if (!isCanvasDirty || saving) {
            return;
        }

        setSaving(true);

        try {
            const response = await api.put(`/rooms/${id}/layout`, {
                width: canvasDraft.width,
                height: canvasDraft.height,
                elements: layout.elements.map((element) => ({
                    type: element.type,
                    label: element.label,
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                    rotation: element.rotation,
                    capacity: element.capacity
                }))
            });

            setLayout(response.data);
            setCanvasDraft({ width: response.data.width, height: response.data.height });
            setPreviewMode(false);
        } catch (error) {
            console.error("Error saving layout size:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleResizeMouseDown = (event, element, direction) => {
        event.stopPropagation();
        event.preventDefault();

        const startMouseX = event.clientX;
        const startMouseY = event.clientY;

        const startX = element.x;
        const startY = element.y;

        const startWidth = element.width;
        const startHeight = element.height;

        const minWidth = 30;
        const minHeight = 30;

        let finalX = startX;
        let finalY = startY;
        let finalWidth = startWidth;
        let finalHeight = startHeight;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startMouseX;
            const deltaY = moveEvent.clientY - startMouseY;

            let newX = startX;
            let newY = startY;
            let newWidth = startWidth;
            let newHeight = startHeight;

            /*
             * PRAWA STRONA
             */
            if (direction.includes("e")) {
                const maxWidthAvailable = (layout.width ?? Infinity) - startX;

                newWidth = Math.max(
                    minWidth,
                    Math.min(startWidth + deltaX, maxWidthAvailable)
                );
            }

            if (direction.includes("s")) {
                const maxHeightAvailable = (layout.height ?? Infinity) - startY;

                newHeight = Math.max(
                    minHeight,
                    Math.min(startHeight + deltaY, maxHeightAvailable)
                );
            }

            /*
             * LEWA STRONA
             */
            if (direction.includes("w")) {
                const maxX = startX + startWidth - minWidth;

                newX = Math.max(
                    0,
                    Math.min(
                        startX + deltaX,
                        maxX
                    )
                );

                newWidth =
                    startWidth + (startX - newX);
            }

            /*
             * GÓRNA STRONA
             */
            if (direction.includes("n")) {
                const maxY = startY + startHeight - minHeight;

                newY = Math.max(
                    0,
                    Math.min(
                        startY + deltaY,
                        maxY
                    )
                );

                newHeight =
                    startHeight + (startY - newY);
            }

            finalX = newX;
            finalY = newY;
            finalWidth = newWidth;
            finalHeight = newHeight;

            setLayout((currentLayout) => ({
                ...currentLayout,
                elements: currentLayout.elements.map((el) =>
                    el.id === element.id
                        ? {
                            ...el,
                            x: finalX,
                            y: finalY,
                            width: finalWidth,
                            height: finalHeight
                        }
                        : el
                )
            }));
        };

        const handleMouseUp = async () => {
            document.removeEventListener(
                "mousemove",
                handleMouseMove
            );

            document.removeEventListener(
                "mouseup",
                handleMouseUp
            );

            try {
                await api.patch(
                    `/rooms/${id}/layout/elements/${element.id}`,
                    {
                        x: finalX,
                        y: finalY,
                        width: finalWidth,
                        height: finalHeight
                    }
                );
            } catch (error) {
                console.error(
                    "Error resizing element:",
                    error
                );
            }
        };

        document.addEventListener(
            "mousemove",
            handleMouseMove
        );

        document.addEventListener(
            "mouseup",
            handleMouseUp
        );
    };

    if (loading) {
        return (
            <div className="room-details-loading">
                <Loader2 className="loading-icon" size={32} />
                <span>Ładowanie pokoju...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="room-details-error">
                <p>{error}</p>

                <Link
                    to={backTo}
                    state={{ selectedBuilding: backBuilding }}
                    className="back-button-details"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </Link>
            </div>
        );
    }

    if (!room || !layout) {
        return null;
    }

    // w trybie preview canvas renderuje się w wymiarach draftu, nie zapisanego layoutu
    const displayWidth = previewMode ? canvasDraft.width : layout.width;
    const displayHeight = previewMode ? canvasDraft.height : layout.height;

    const isElementOutOfBounds = (element) =>
        previewMode &&
        (element.x + element.width > displayWidth || element.y + element.height > displayHeight);

    return (
        <div className="room-details">
            <header className="room-details-header">
                <div className="room-details-title">
                    <Link to={backTo} className="back-button-details">
                        <ArrowLeft size={18} />
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
                        <strong>{room.capacity} People</strong>
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
                            {selectedElementIds.size > 1 && ` • ${selectedElementIds.size} zaznaczonych`}
                        </p>
                    </div>

                    <div className="room-editor-actions">
                        <button onClick={() => handleAddElement("TABLE")}>+ Table</button>
                        <button onClick={() => handleAddElement("CHAIR")}>+ Chair</button>
                        <button onClick={() => handleAddElement("DOOR")}>+ Door</button>

                        {selectedElementIds.size > 0 && (
                            <button className="delete-element-button" onClick={handleDeleteElement}>
                                Delete{selectedElementIds.size > 1 ? ` (${selectedElementIds.size})` : ""}
                            </button>
                        )}
                    </div>
                </div>

                <div className="element-properties">
                    <div className="elements-size-controls">
                        <h3>Element properties</h3>

                        <label>
                            Label
                            <input
                                value={singleSelectedElement?.label ?? ""}
                                disabled={!singleSelectedElement}
                                placeholder={selectedElementIds.size > 1 ? "Wiele elementów zaznaczonych" : ""}
                                onChange={(event) => handleElementChange("label", event.target.value)}
                            />
                        </label>

                        <label>
                            Width
                            <input
                                type="number"
                                value={singleSelectedElement?.width ?? ""}
                                disabled={!singleSelectedElement}
                                onChange={(event) => handleElementChange("width", Number(event.target.value))}
                            />
                        </label>

                        <label>
                            Height
                            <input
                                type="number"
                                value={singleSelectedElement?.height ?? ""}
                                disabled={!singleSelectedElement}
                                onChange={(event) => handleElementChange("height", Number(event.target.value))}
                            />
                        </label>

                        <label>
                            Rotation
                            <input
                                type="number"
                                value={singleSelectedElement?.rotation ?? ""}
                                disabled={!singleSelectedElement}
                                onChange={(event) => handleElementChange("rotation", Number(event.target.value))}
                            />
                        </label>
                    </div>

                    <div className="canvas-size-controls">
                        <label className="canvas-size-controls-label">
                            Layout width
                            <input className="canvas-size-input"
                                   type="number"
                                   min={MIN_LAYOUT_WIDTH}
                                   value={canvasDraft.width}
                                   onChange={(event) => handleCanvasDraftChange("width", event.target.value)}
                            />
                        </label>

                        <label className="canvas-size-controls-label">
                            Layout height
                            <input className="canvas-size-input"
                                   type="number"
                                   min={MIN_LAYOUT_HEIGHT}
                                   value={canvasDraft.height}
                                   onChange={(event) => handleCanvasDraftChange("height", event.target.value)}
                            />
                        </label>

                        <button
                            type="button"
                            className="preview-toggle-button"
                            onClick={handleTogglePreview}
                            disabled={!isCanvasDirty && !previewMode}
                        >
                            <Eye size={16} />
                            {previewMode ? "Exit preview" : "Preview"}
                        </button>

                        <button
                            type="button"
                            className="save-changes-button"
                            onClick={handleSaveChanges}
                            disabled={!isCanvasDirty || saving}
                        >
                            <Save size={16} />
                            {saving ? "Saving..." : "Save changes"}
                        </button>

                        {isCanvasDirty && (
                            <button
                                type="button"
                                className="discard-changes-button"
                                onClick={handleDiscardCanvasChanges}
                            >
                                <X size={16} />
                                Discard
                            </button>
                        )}
                    </div>

                </div>

                {previewMode && (
                    <div className="preview-banner">
                        <span>
                            Podgląd: {canvasDraft.width}×{canvasDraft.height} (niezapisane zmiany)
                        </span>
                        <div className="preview-banner-actions">
                            <button type="button" onClick={handleSaveChanges} disabled={saving}>
                                {saving ? "Saving..." : "Save changes"}
                            </button>
                            <button type="button" onClick={handleDiscardCanvasChanges}>
                                Discard
                            </button>
                        </div>
                    </div>
                )}


                <div className="room-canvas-container">
                    <div
                        className={`room-canvas ${previewMode ? "room-canvas-preview" : ""}`}
                        style={{
                            width: `${displayWidth}px`,
                            height: `${displayHeight}px`,
                            position: "relative"
                        }}
                        onMouseDown={previewMode ? undefined : handleCanvasMouseDown}
                    >
                        {layout.elements.map((element) => (
                            <div
                                key={element.id}
                                className={`
                                    room-element
                                    room-element-${element.type.toLowerCase()}
                                    ${isSelected(element.id) ? "room-element-selected" : ""}
                                    ${isElementOutOfBounds(element) ? "room-element-out-of-bounds" : ""}
                                `}
                                style={{
                                    left: `${element.x}px`,
                                    top: `${element.y}px`,
                                    width: `${element.width}px`,
                                    height: `${element.height}px`,
                                    transform: `rotate(${element.rotation || 0}deg)`
                                }}
                                onMouseDown={previewMode ? undefined : (event) => handleElementMouseDown(event, element)}
                            >
                                {element.label || element.type}

                                {!previewMode && selectedElementIds.size === 1 && isSelected(element.id) && (
                                    <>
                                        <div className="resize-handle resize-handle-nw" onMouseDown={(event) => handleResizeMouseDown(event, element, "nw")} />
                                        <div className="resize-handle resize-handle-n" onMouseDown={(event) => handleResizeMouseDown(event, element, "n")} />
                                        <div className="resize-handle resize-handle-ne" onMouseDown={(event) => handleResizeMouseDown(event, element, "ne")} />
                                        <div className="resize-handle resize-handle-e" onMouseDown={(event) => handleResizeMouseDown(event, element, "e")} />
                                        <div className="resize-handle resize-handle-se" onMouseDown={(event) => handleResizeMouseDown(event, element, "se")} />
                                        <div className="resize-handle resize-handle-s" onMouseDown={(event) => handleResizeMouseDown(event, element, "s")} />
                                        <div className="resize-handle resize-handle-sw" onMouseDown={(event) => handleResizeMouseDown(event, element, "sw")} />
                                        <div className="resize-handle resize-handle-w" onMouseDown={(event) => handleResizeMouseDown(event, element, "w")} />
                                    </>
                                )}
                            </div>
                        ))}

                        {selectionBox && !previewMode && (
                            <div
                                className="selection-box"
                                style={{
                                    left: `${selectionBox.x}px`,
                                    top: `${selectionBox.y}px`,
                                    width: `${selectionBox.width}px`,
                                    height: `${selectionBox.height}px`
                                }}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}