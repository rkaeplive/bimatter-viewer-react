import "./App.css";

import { useMemo, useRef, useState } from "react";
import { ElementProperties } from "./components/ElementProperties";
import {
    StructureTree,
    type SelectedElement,
} from "./components/StructureTree";
import {
    loader,
    Viewer,
    type ViewerApi,
    type ViewerLoadedModels,
    type ViewerSelection,
} from "bimatter-viewer-react";

function getSelectionInfo(selected: ViewerSelection) {
    let selectedElement: SelectedElement | null = null;
    let count = 0;

    Object.entries(selected).forEach(([modelID, ids]) => {
        ids.forEach((elementID) => {
            count++;
            if (count === 1) {
                selectedElement = {
                    elementID,
                    modelID: Number(modelID),
                };
            }
        });
    });

    return {
        count,
        selectedElement: count === 1 ? selectedElement : null,
    };
}

function App() {
    const viewerRef = useRef<ViewerApi>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [modelsData, setModelsData] = useState<ViewerLoadedModels>();
    const [selected, setSelected] = useState<ViewerSelection>({});
    const [paintColor, setPaintColor] = useState("#ff002b");
    const selectionInfo = useMemo(() => getSelectionInfo(selected), [selected]);

    const setLoadedModels = (models: ViewerLoadedModels) => {
        setSelected({});
        setModelsData((currentModels) => ({
            ...(currentModels ?? {}),
            ...models,
        }));
    };

    const onFilesSelected = async (files: FileList | null) => {
        if (!files?.length) return;

        const models = await loader.loadModel(Array.from(files));
        setLoadedModels(models);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const selectElements = (modelID: number, elementIDs: number[]) => {
        setSelected({
            [modelID]: Array.from(new Set(elementIDs)),
        });
    };

    const forEachSelectedModel = (
        callback: (modelID: number, ids: number[]) => void,
    ) => {
        Object.entries(selected).forEach(([modelID, ids]) => {
            if (!ids.length) return;
            callback(Number(modelID), ids);
        });
    };

    const paintSelected = () => {
        forEachSelectedModel((modelID, ids) => {
            viewerRef.current?.colors.setColor(modelID, ids, paintColor);
        });
    };

    const clearSelectedColors = () => {
        forEachSelectedModel((modelID, ids) => {
            viewerRef.current?.colors.clearColor(modelID, ids);
        });
    };

    return (
        <div className="app">
            <div className="app-toolbar">
                <input
                    accept=".bmt,.ifc"
                    multiple
                    onChange={(event) => onFilesSelected(event.target.files)}
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    type="file"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                >
                    Load files
                </button>
                <button
                    onClick={() => {
                        loader
                            // .loadModel(["./mgu_ar.min.bmt", "./mgu_kr.min.bmt"])
                            .loadModel([
                                "./demo_ar.min.bmt",
                                "./demo_kr.min.bmt",
                            ])
                            .then((models) => {
                                setLoadedModels(models);
                            });
                    }}
                    type="button"
                >
                    Load bmt models
                </button>
                <button
                    onClick={() => {
                        loader
                            .loadModel(["./Clinic_Architectural.ifc"])
                            .then((models) => {
                                setLoadedModels(models);
                            });
                    }}
                    type="button"
                >
                    Load ifc model
                </button>
                <button
                    onClick={() => {
                        loader
                            .loadModel([
                                "./demo_kr.min.bmt",
                                "./Clinic_Architectural.ifc",
                            ])
                            .then((models) => {
                                setLoadedModels(models);
                            });
                    }}
                    type="button"
                >
                    Load bmt and ifc models
                </button>
                <button
                    onClick={() => viewerRef.current?.camera.fitCamera()}
                    type="button"
                >
                    Fit
                </button>
                <button
                    onClick={() =>
                        viewerRef.current?.geometryUtils.hideSelected()
                    }
                    type="button"
                >
                    Hide
                </button>
                <button
                    onClick={() =>
                        viewerRef.current?.geometryUtils.isolateSelected()
                    }
                    type="button"
                >
                    Isolate
                </button>
                <button
                    onClick={() => viewerRef.current?.geometryUtils.showAll()}
                    type="button"
                >
                    Show all
                </button>
                <span>Selected: {selectionInfo.count}</span>
                <div className="app-color-panel">
                    <span>Paint</span>
                    <input
                        aria-label="Paint color"
                        onChange={(event) => setPaintColor(event.target.value)}
                        type="color"
                        value={paintColor}
                    />
                    <button
                        disabled={selectionInfo.count === 0}
                        onClick={paintSelected}
                        type="button"
                    >
                        Paint selected
                    </button>
                    <button
                        disabled={selectionInfo.count === 0}
                        onClick={clearSelectedColors}
                        type="button"
                    >
                        Clear selected
                    </button>
                    <button
                        onClick={() =>
                            viewerRef.current?.colors.clearAllColors()
                        }
                        type="button"
                    >
                        Clear colors
                    </button>
                </div>
            </div>
            <div className="app-shell">
                <StructureTree
                    modelsData={modelsData}
                    onSelectElements={selectElements}
                    selectedElement={selectionInfo.selectedElement}
                />
                <main className="app-viewer">
                    {modelsData ? (
                        <Viewer
                            ref={viewerRef}
                            modelsData={modelsData}
                            onReady={(api) => {
                                api.camera.fitCamera();
                            }}
                            onSelectedChange={setSelected}
                            selected={selected}
                            showStats
                        />
                    ) : (
                        <div className="app-empty">Load a model</div>
                    )}
                </main>
                <ElementProperties
                    modelsData={modelsData}
                    selectedElement={selectionInfo.selectedElement}
                />
            </div>
        </div>
    );
}

export default App;
