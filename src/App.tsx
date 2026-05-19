import "./App.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { ElementProperties } from "./components/ElementProperties";
import {
    StructureTree,
    type SelectedElement,
} from "./components/StructureTree";
import {
    bmtConverter,
    loader,
    Viewer,
    type ViewerApi,
    type ViewerLoadedModels,
    type ViewerSelection,
    type WorkerProgressEvent,
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
function downloadFiles(files: { blob: Blob; name: string }[]) {
    files.forEach((file) => {
        const url = URL.createObjectURL(file.blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    });
}
function mergeLoadedModelMetadata(
    currentModels: ViewerLoadedModels | undefined,
    loadedModels: ViewerLoadedModels,
) {
    const nextModels: ViewerLoadedModels = { ...(currentModels ?? {}) };

    Object.entries(loadedModels).forEach(([modelID, model]) => {
        const numericModelID = Number(modelID);

        nextModels[numericModelID] = {
            ...model,
            data: {
                ...(currentModels?.[numericModelID]?.data ?? {}),
                ...model.data,
            },
        };
    });

    return nextModels;
}
function App() {
    const viewerRef = useRef<ViewerApi>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const exportFileInputRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [modelsData, setModelsData] = useState<ViewerLoadedModels>();
    const [selected, setSelected] = useState<ViewerSelection>({});
    const [viewerApi, setViewerApi] = useState<ViewerApi | null>(null);
    const [exportActiveView, setExportActiveView] = useState(false);
    const [exportUseMinVersion, setExportUseMinVersion] = useState(false);
    const [showSpaces, setShowSpaces] = useState(true);
    const [useIfcSpace, setUseIfcSpace] = useState(true);
    const [bmtWorkerLoading, setBmtWorkerLoading] = useState(false);
    const [bmtWorkerProgress, setBmtWorkerProgress] =
        useState<WorkerProgressEvent | null>(null);
    const [ifcWorkerLoading, setIfcWorkerLoading] = useState(false);
    const [ifcWorkerProgress, setIfcWorkerProgress] =
        useState<WorkerProgressEvent | null>(null);

    const selectionInfo = useMemo(() => getSelectionInfo(selected), [selected]);
    useViewerApiGui({
        api: viewerApi,
        modelsData,
        onShowIfcSpacesChange: setShowSpaces,
        onUseIfcSpaceChange: setUseIfcSpace,
        selected,
        showIfcSpaces: showSpaces,
        useIfcSpace,
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
        const models = await loader.loadModel(Array.from(files), {
            useIfcSpace: showSpaces,
        });
        setLoadedModels(models);
        setLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    useEffect(() => {
        setViewerApi(viewerRef.current);
    }, []);
    const selectElements = (modelID: number, elementIDs: number[]) => {
        setSelected({
            [modelID]: Array.from(new Set(elementIDs)),
        });
    };
    const exportBmt = () => {
        const result = viewerRef.current?.converter.convertToBmt({
            activeView: exportActiveView,
            fileName: "viewer-export",
            useMinVersion: exportUseMinVersion,
        });

        if (result) {
            downloadFiles(result.files);
        }
    };

    const onExportFilesSelected = async (files: FileList | null) => {
        if (!files?.length) return;

        const converter = viewerRef.current?.converter ?? bmtConverter;
        const result = await converter.convertIfcFileToBmt(Array.from(files), {
            fileName: "converted-ifc",
            useIfcSpace,
            useMinVersion: exportUseMinVersion,
        });

        if (result) {
            downloadFiles(result.files);
        }

        if (exportFileInputRef.current) {
            exportFileInputRef.current.value = "";
        }
    };
    const exportModelsExcel = () => {
        const files = viewerRef.current?.properties.exportAllExcel() ?? [];
        if (!files.length) return;

        downloadFiles(files);
    };
    const loadIfcModelsByWorker = async () => {
        setSelected({});
        setModelsData({});
        setIfcWorkerLoading(true);
        setIfcWorkerProgress(null);

        try {
            const models = await loader.loadModel(
                ["./Clinic_Architectural.ifc"],
                {
                    chunk: 500,
                    collectWorkerChunks: false,
                    onChunk: (chunk) => {
                        setModelsData((currentModels) => {
                            const model = currentModels?.[chunk.modelID] ?? {
                                data: {},
                                name: chunk.modelName,
                                props: {},
                                structure: {},
                            };

                            return {
                                ...(currentModels ?? {}),
                                [chunk.modelID]: {
                                    ...model,
                                    data: {
                                        ...model.data,
                                        [chunk.geometryID]: chunk.geometry,
                                    },
                                },
                            };
                        });
                    },
                    onProgress: setIfcWorkerProgress,
                    useIfcSpace,
                    useWorker: true,
                },
            );

            setModelsData((currentModels) =>
                mergeLoadedModelMetadata(currentModels, models),
            );
        } finally {
            setIfcWorkerLoading(false);
        }
    };

    const loadBmtModelsByWorker = async () => {
        setSelected({});
        setModelsData({});
        setBmtWorkerLoading(true);
        setBmtWorkerProgress(null);

        try {
            const models = await loader.loadModel(
                ["./mgu_ar.min.bmt", "./mgu_kr.min.bmt"],
                {
                    collectWorkerChunks: false,
                    onChunk: (chunk) => {
                        setModelsData((currentModels) => {
                            const model = currentModels?.[chunk.modelID] ?? {
                                data: {},
                                name: chunk.modelName,
                                props: {},
                                structure: {},
                            };

                            return {
                                ...(currentModels ?? {}),
                                [chunk.modelID]: {
                                    ...model,
                                    data: {
                                        ...model.data,
                                        [chunk.geometryID]: chunk.geometry,
                                    },
                                },
                            };
                        });
                    },
                    onProgress: setBmtWorkerProgress,
                    useWorker: true,
                },
            );

            setModelsData((currentModels) =>
                mergeLoadedModelMetadata(currentModels, models),
            );
        } finally {
            setBmtWorkerLoading(false);
        }
    };
    const isMobile = viewerApi?.utils.getUserDevice() === "mobile";
    if (loading) {
        return <BimatterLoader loading isTransparent></BimatterLoader>;
    }
    return (
        <div className="app">
            <div className="app-toolbar">
                <input
                    accept=".bmt,.ifc,.json"
                    multiple
                    onChange={(event) => onFilesSelected(event.target.files)}
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    type="file"
                />
                <input
                    accept=".ifc"
                    multiple
                    onChange={(event) =>
                        onExportFilesSelected(event.target.files)
                    }
                    ref={exportFileInputRef}
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
                            .loadModel(["./Clinic_Architectural.ifc"], {
                                useIfcSpace: showSpaces,
                            })
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
                    disabled={ifcWorkerLoading}
                    onClick={loadIfcModelsByWorker}
                    type="button"
                >
                    {ifcWorkerLoading ? "IFC worker..." : "Load ifc worker"}
                </button>
                <button
                    disabled={bmtWorkerLoading}
                    onClick={loadBmtModelsByWorker}
                    type="button"
                >
                    {bmtWorkerLoading ? "BMT worker..." : "Load bmt worker"}
                </button>
                <button
                    onClick={() => {
                        setLoading(true);
                        const modelPaths =
                            viewerApi?.utils.getUserDevice() === "pc"
                                ? ["./mgu_ar.min.bmt", "./mgu_kr.min.bmt"]
                                : ["./mgu_ar.min.bmt"];
                        loader.loadModel(modelPaths).then((models) => {
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
                            .loadModel(
                                [
                                    "./demo_kr.min.bmt",
                                    "./Clinic_Architectural.ifc",
                                ],
                                { useIfcSpace: showSpaces },
                            )
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
                <div className="app-toolbar-group">
                    <span className="app-toolbar-title">Export</span>
                    <button
                        onClick={() => exportFileInputRef.current?.click()}
                        type="button"
                    >
                        Export file
                    </button>
                    <button
                        disabled={!viewerApi || !modelsData}
                        onClick={exportBmt}
                        type="button"
                    >
                        ExportToBmt
                    </button>
                    <label className="app-toolbar-checkbox">
                        <input
                            checked={exportUseMinVersion}
                            onChange={(event) =>
                                setExportUseMinVersion(event.target.checked)
                            }
                            type="checkbox"
                        />
                        useMinVersion
                    </label>
                    <label className="app-toolbar-checkbox">
                        <input
                            checked={exportActiveView}
                            onChange={(event) =>
                                setExportActiveView(event.target.checked)
                            }
                            type="checkbox"
                        />
                        activeView
                    </label>
                    <div className="app-toolbar-group">
                        <span className="app-toolbar-title">Excel</span>
                        <button
                            disabled={!viewerApi || !modelsData}
                            onClick={exportModelsExcel}
                            type="button"
                        >
                            Export Excel
                        </button>
                    </div>
                </div>
                <span
                    style={{
                        position: "absolute",
                        left:
                            viewerApi?.utils.getUserDevice() === "mobile"
                                ? 30
                                : 300,
                        top: 50,
                    }}
                >
                    Selected: {selectionInfo.count}
                </span>
                {ifcWorkerProgress && (
                    <span
                        style={{
                            position: "absolute",
                            left: 520,
                            top: 50,
                        }}
                    >
                        Worker: {ifcWorkerProgress.phase}{" "}
                        {Math.round(ifcWorkerProgress.progress * 100)}%
                    </span>
                )}
                {bmtWorkerProgress && (
                    <span
                        style={{
                            position: "absolute",
                            left: 720,
                            top: 50,
                        }}
                    >
                        BMT worker: {bmtWorkerProgress.phase}{" "}
                        {Math.round(bmtWorkerProgress.progress * 100)}%
                    </span>
                )}
            </div>
            <div className={!isMobile ? "app-shell" : "app-shell-mobile"}>
                {viewerApi && !isMobile ? (
                    <StructureTree
                        modelsData={modelsData}
                        onSelectElements={selectElements}
                        selectedElement={selectionInfo.selectedElement}
                        showIfcSpaces={showSpaces}
                    />
                ) : (
                    <div></div>
                )}
                <main className="app-viewer">
                    {!modelsData && (
                        <div className="app-empty">Load a model</div>
                    )}
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
                </main>
                {viewerApi && !isMobile ? (
                    <ElementProperties
                        modelsData={modelsData}
                        selectedElement={selectionInfo.selectedElement}
                    />
                ) : (
                    <div></div>
                )}
            </div>
        </div>
    );
}

export default App;
