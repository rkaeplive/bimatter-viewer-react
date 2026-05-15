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
import { useViewerApiGui } from "./components/useViewerApiGui";
import BimatterLoader from "./components/Loaders/BimatterLoader";

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
    const [loading, setLoading] = useState<boolean>(false);
    const [modelsData, setModelsData] = useState<ViewerLoadedModels>();
    const [selected, setSelected] = useState<ViewerSelection>({});
    const [viewerApi, setViewerApi] = useState<ViewerApi | null>(null);
    const selectionInfo = useMemo(() => getSelectionInfo(selected), [selected]);
    useViewerApiGui({
        api: viewerApi,
        modelsData,
        selected,
    });
    const setLoadedModels = (models: ViewerLoadedModels) => {
        setSelected({});
        setModelsData((currentModels) => ({
            ...(currentModels ?? {}),
            ...models,
        }));
    };

    const onFilesSelected = async (files: FileList | null) => {
        if (!files?.length) return;
        if (!modelsData || !Object.keys(modelsData).length) {
            setLoading(true);
        }
        const models = await loader.loadModel(Array.from(files));
        setLoadedModels(models);
        setLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const selectElements = (modelID: number, elementIDs: number[]) => {
        setSelected({
            [modelID]: Array.from(new Set(elementIDs)),
        });
    };

    const isMobile = viewerApi?.utils.getUserDevice() === "mobile";
    if (loading) {
        return <BimatterLoader loading isTransparent></BimatterLoader>;
    }
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
                        setLoading(true);
                        loader
                            // .loadModel(["./mgu_ar.min.bmt", "./mgu_kr.min.bmt"])
                            .loadModel([
                                "./demo_ar.min.bmt",
                                "./demo_kr.min.bmt",
                            ])
                            .then((models) => {
                                setLoading(false);
                                setLoadedModels(models);
                            });
                    }}
                    type="button"
                >
                    Load bmt models
                </button>
                <button
                    onClick={() => {
                        setLoading(true);
                        loader
                            .loadModel(["./Clinic_Architectural.ifc"])
                            .then((models) => {
                                setLoading(false);
                                setLoadedModels(models);
                            });
                    }}
                    type="button"
                >
                    Load ifc model
                </button>
                <button
                    onClick={() => {
                        setLoading(true);
                        loader
                            .loadModel(["./mgu_ar.min.bmt", "./mgu_kr.min.bmt"])
                            .then((models) => {
                                setLoading(false);
                                setLoadedModels(models);
                            });
                    }}
                    type="button"
                >
                    Load large bmt models
                </button>
                <button
                    onClick={() => {
                        setLoading(true);
                        loader
                            .loadModel([
                                "./demo_kr.min.bmt",
                                "./Clinic_Architectural.ifc",
                            ])
                            .then((models) => {
                                setLoading(false);
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
            </div>
            <div className={!isMobile ? "app-shell" : "app-shell-mobile"}>
                {!isMobile && (
                    <StructureTree
                        modelsData={modelsData}
                        onSelectElements={selectElements}
                        selectedElement={selectionInfo.selectedElement}
                    />
                )}
                <main className="app-viewer">
                    {modelsData ? (
                        <Viewer
                            ref={viewerRef}
                            modelsData={modelsData}
                            onReady={(api) => {
                                setViewerApi(api);
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
                {!isMobile && (
                    <ElementProperties
                        modelsData={modelsData}
                        selectedElement={selectionInfo.selectedElement}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
