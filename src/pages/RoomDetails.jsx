import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Eye, Save, X , Table2, Armchair, DoorOpen, Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";

import api from "../api/axios";
import "./styles/RoomDetails.css";

const MIN_LAYOUT_WIDTH = 800;
const MIN_LAYOUT_HEIGHT = 600;

export default function RoomDetails() {
    const { id } = useParams();

    const [room, setRoom] = useState(null);
    const [layout, setLayout] = useState(null);
    const [savedLayout, setSavedLayout] = useState(null); // ostatni zapisany stan z serwera
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

    // --- czy elementy (pozycja/rozmiar/label/rotacja) mają niezapisane zmiany ---
    const [elementsDirty, setElementsDirty] = useState(false);

    const isColliding = (elementA, elementB) => (
        elementA.x < elementB.x + elementB.width &&
        elementA.x + elementA.width > elementB.x &&
        elementA.y < elementB.y + elementB.height &&
        elementA.y + elementA.height > elementB.y
    );

    const hasCollision = (candidateElement, elementsList, ignoreIds) => {
        return elementsList.some(
            (el) => !ignoreIds.has(el.id) && isColliding(candidateElement, el)
        );
    };

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
                setSavedLayout(layoutResponse.data);
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

    // --- łączna flaga: canvas LUB elementy mają niezapisane zmiany ---
    const isDirty = isCanvasDirty || elementsDirty;

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

        let didMove = false;

        const handleMouseMove = (moveEvent) => {
            let deltaX = moveEvent.clientX - startMouseX;
            let deltaY = moveEvent.clientY - startMouseY;

            if (Number.isNaN(deltaX)) deltaX = 0;
            if (Number.isNaN(deltaY)) deltaY = 0;

            let minDeltaX = -Infinity;
            let maxDeltaX = Infinity;
            let minDeltaY = -Infinity;
            let maxDeltaY = Infinity;

            const startPositions = new Map();
            layout.elements.forEach((el) => {
                if (idsToMove.has(el.id)) {
                    startPositions.set(el.id, { x: el.x, y: el.y, width: el.width, height: el.height });
                }
            });

            // elementy statyczne, względem których sprawdzamy kolizję
            const staticElements = layout.elements.filter((el) => !idsToMove.has(el.id));

            let lastValidPositions = new Map(startPositions);
            let didMove = false;

            const handleMouseMove = (moveEvent) => {
                let deltaX = moveEvent.clientX - startMouseX;
                let deltaY = moveEvent.clientY - startMouseY;

                if (Number.isNaN(deltaX)) deltaX = 0;
                if (Number.isNaN(deltaY)) deltaY = 0;

                let minDeltaX = -Infinity, maxDeltaX = Infinity;
                let minDeltaY = -Infinity, maxDeltaY = Infinity;

                startPositions.forEach((pos) => {
                    minDeltaX = Math.max(minDeltaX, -pos.x);
                    maxDeltaX = Math.min(maxDeltaX, maxWidth - pos.width - pos.x);
                    minDeltaY = Math.max(minDeltaY, -pos.y);
                    maxDeltaY = Math.min(maxDeltaY, maxHeight - pos.height - pos.y);
                });

                deltaX = Math.max(minDeltaX, Math.min(deltaX, maxDeltaX));
                deltaY = Math.max(minDeltaY, Math.min(deltaY, maxDeltaY));

                const candidatePositions = new Map();
                startPositions.forEach((pos, elId) => {
                    candidatePositions.set(elId, { ...pos, x: pos.x + deltaX, y: pos.y + deltaY });
                });

                // sprawdź, czy KAŻDY przesuwany element mieści się bez kolizji ze statycznymi
                const wouldCollide = Array.from(candidatePositions.entries()).some(
                    ([elId, pos]) => hasCollision({ id: elId, ...pos }, staticElements, new Set([elId]))
                );

                if (wouldCollide) {
                    // nie aktualizujemy pozycji — element "zatrzymuje się" na kolizji
                    return;
                }

                lastValidPositions = candidatePositions;
                if (deltaX !== 0 || deltaY !== 0) didMove = true;

                setLayout((currentLayout) => ({
                    ...currentLayout,
                    elements: currentLayout.elements.map((el) =>
                        lastValidPositions.has(el.id)
                            ? { ...el, x: lastValidPositions.get(el.id).x, y: lastValidPositions.get(el.id).y }
                            : el
                    )
                }));
            };

            const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                if (didMove) setElementsDirty(true);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        };


        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            // Nie wysyłamy już PATCH per element — tylko oznaczamy jako "do zapisania".
            // Faktyczny zapis nastąpi zbiorczo przez przycisk "Save changes".
            if (didMove) {
                setElementsDirty(true);
            }
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

            setSavedLayout((currentSaved) => ({
                ...currentSaved,
                elements: [
                    ...currentSaved.elements,
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

            setSavedLayout((currentSaved) => ({
                ...currentSaved,
                elements: currentSaved.elements.filter(
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

    // --- zmiana property elementu: TYLKO lokalnie, bez requestu ---
    const handleElementChange = (property, value) => {
        if (!singleSelectedElement) {
            return;
        }

        const elementId = singleSelectedElement.id;

        setLayout((currentLayout) => ({
            ...currentLayout,
            elements: currentLayout.elements.map(
                (currentElement) =>
                    currentElement.id === elementId
                        ? { ...currentElement, [property]: value }
                        : currentElement
            )
        }));

        setElementsDirty(true);
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

    // --- odrzuca WSZYSTKIE niezapisane zmiany: rozmiar canvasu + pozycje/rozmiary/etykiety elementów ---
    const handleDiscardChanges = () => {
        if (!savedLayout) return;

        setLayout(JSON.parse(JSON.stringify(savedLayout)));
        setCanvasDraft({ width: savedLayout.width, height: savedLayout.height });
        setElementsDirty(false);
        setPreviewMode(false);
        setSelectedElementIds(new Set());
    };

    // --- jeden zbiorczy zapis: rozmiar canvasu + pełna lista elementów ---
    const handleSaveChanges = async () => {
        if (!isDirty || saving) {
            return;
        }

        setSaving(true);

        try {
            const response = await api.put(`/rooms/${id}/layout`, {
                width: canvasDraft.width,
                height: canvasDraft.height,
                elements: layout.elements.map((element) => ({
                    id: element.id,
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
            setSavedLayout(response.data);
            setCanvasDraft({ width: response.data.width, height: response.data.height });
            setElementsDirty(false);
            setPreviewMode(false);
        } catch (error) {
            console.error("Error saving layout:", error);
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

        let didResize = false;

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

            if (
                newX !== startX ||
                newY !== startY ||
                newWidth !== startWidth ||
                newHeight !== startHeight
            ) {
                didResize = true;
            }

            setLayout((currentLayout) => ({
                ...currentLayout,
                elements: currentLayout.elements.map((el) =>
                    el.id === element.id
                        ? {
                            ...el,
                            x: newX,
                            y: newY,
                            width: newWidth,
                            height: newHeight
                        }
                        : el
                )
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            // Bez PATCH — resize też trafia do zbiorczego "Save changes".
            if (didResize) {
                setElementsDirty(true);
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
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
                                   placeholder="800"
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
                                   placeholder="600"
                                   min={MIN_LAYOUT_HEIGHT}
                                   value={canvasDraft.height}
                                   onChange={(event) => handleCanvasDraftChange("height", event.target.value)}
                            />
                        </label>

                        <button
                            type="button"
                            className="preview-toggle-button"
                            onClick={handleTogglePreview}
                            disabled={!isDirty && !previewMode}
                        >
                            <Eye size={16} />
                            {previewMode ? "Exit preview" : "Preview"}
                        </button>

                        <button
                            type="button"
                            className="save-changes-button"
                            onClick={handleSaveChanges}
                            disabled={!isDirty || saving}
                        >
                            <Save size={16} />
                            {saving ? "Saving..." : "Save changes"}
                        </button>

                        {isDirty && (
                            <button
                                type="button"
                                className="discard-changes-button"
                                onClick={handleDiscardChanges}
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
                            <button type="button" onClick={handleDiscardChanges}>
                                Discard
                            </button>
                        </div>
                    </div>
                )}


                <div className="room-editor-layout">
                    <div className="room-editor-sidebar">
                        <div className="room-editor-actions">
                            <button onClick={() => handleAddElement("TABLE")}>
                                <Table2 size={18} />
                                <span>ADD TABLE</span>
                            </button>
                            <button onClick={() => handleAddElement("CHAIR")}>
                                <Armchair size={18} />
                                <span>ADD CHAIR</span>
                            </button>
                            <button onClick={() => handleAddElement("DOOR")}>
                                <DoorOpen size={18} />
                                <span>ADD DOOR</span>
                            </button>
                            <button onClick={() => handleAddElement("WALL")}>
                                <DoorOpen size={18} />
                                <span>ADD WALL</span>
                            </button>
                            {selectedElementIds.size > 0 && (
                                <button className="delete-element-button" onClick={handleDeleteElement}>
                                    <Trash2 size={18} />
                                    <span>DELETE{selectedElementIds.size > 1 ? ` (${selectedElementIds.size})` : ""}</span>
                                </button>
                            )}
                        </div>
                    </div>


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