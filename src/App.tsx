import "./App.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { ElementProperties } from "./components/ElementProperties";
import {
    StructureTree,
    type SelectedElement,
} from "./components/StructureTree";
import { ApiDocs } from "./components/ApiDocs/ApiDocs";
import {
    bmtConverter,
    loader,
    Viewer,
    type ViewerApi,
    type ViewerLoadedModels,
    type ViewerLoaderWorkerChunk,
    type ViewerLoadModelOptions,
    type ViewerModelSource,
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

function getAppRoutePath() {
    const base = import.meta.env.BASE_URL;
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    const redirectPath = new URLSearchParams(window.location.search).get(
        "redirect",
    );

    if (redirectPath?.startsWith("/")) {
        const redirectUrl = new URL(redirectPath, window.location.origin);
        const restoredPath = `${normalizedBase}${redirectPath.replace(/^\/+/, "")}`;

        window.history.replaceState(null, "", restoredPath);

        return redirectUrl.pathname;
    }

    const { pathname } = window.location;

    if (pathname.startsWith(normalizedBase)) {
        return `/${pathname.slice(normalizedBase.length)}`;
    }

    return pathname;
}

function getAppHref(path: string) {
    const base = import.meta.env.BASE_URL;
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    const normalizedPath = path.replace(/^\/+/, "");

    return `${normalizedBase}${normalizedPath}`;
}

function ViewerDemo() {
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
    const [useWorker, setUseWorker] = useState(false);
    const [workerLoading, setWorkerLoading] = useState(false);
    const [workerProgress, setWorkerProgress] =
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

    const addWorkerChunk = (chunk: ViewerLoaderWorkerChunk) => {
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
    };

    const getLargeBmtModelPaths = () =>
        viewerApi?.utils.getUserDevice() === "pc"
            ? ["./mgu_ar.min.bmt", "./mgu_kr.min.bmt"]
            : ["./mgu_ar.min.bmt"];

    const loadModels = async (
        sources: ViewerModelSource[],
        options: ViewerLoadModelOptions = {},
        showInitialLoader = true,
        clearViewer = false,
    ) => {
        setWorkerProgress(null);

        if (useWorker) {
            setSelected({});
            if (clearViewer) {
                setModelsData({});
            }
            setWorkerLoading(true);

            try {
                const models = await loader.loadModel(sources, {
                    ...options,
                    collectWorkerChunks: false,
                    onChunk: addWorkerChunk,
                    onProgress: setWorkerProgress,
                    useWorker: true,
                });

                setModelsData((currentModels) =>
                    mergeLoadedModelMetadata(currentModels, models),
                );
            } finally {
                setWorkerLoading(false);
            }

            return;
        }

        if (clearViewer) {
            setSelected({});
            setModelsData({});
        }

        const shouldShowLoader =
            showInitialLoader || !modelsData || !Object.keys(modelsData).length;

        if (shouldShowLoader) {
            setLoading(true);
        }

        try {
            const models = await loader.loadModel(sources, {
                ...options,
                useWorker: false,
            });
            setLoadedModels(models);
        } finally {
            if (shouldShowLoader) {
                setLoading(false);
            }
        }
    };

    const onFilesSelected = async (files: FileList | null) => {
        if (!files?.length) return;
        try {
            await loadModels(
                Array.from(files),
                {
                    useIfcSpace: showSpaces,
                },
                false,
            );
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
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
    const apiDocsHref = getAppHref("/api");
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
                <label className="app-toolbar-checkbox">
                    <input
                        checked={useWorker}
                        disabled={workerLoading}
                        onChange={(event) => setUseWorker(event.target.checked)}
                        type="checkbox"
                    />
                    useWorker
                </label>
                <button
                    disabled={workerLoading}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                >
                    Load files
                </button>
                <button
                    disabled={workerLoading}
                    onClick={() =>
                        loadModels(
                            ["./demo_ar.min.bmt", "./demo_kr.min.bmt"],
                            {},
                            true,
                            true,
                        )
                    }
                    type="button"
                >
                    Load bmt models
                </button>
                <button
                    disabled={workerLoading}
                    onClick={() =>
                        loadModels(
                            [
                                "./Clinic_Architectural.ifc",
                                "./Clinic_Structural.ifc",
                            ],
                            {
                                ...(useWorker ? { chunk: 500 } : {}),
                                useIfcSpace: showSpaces,
                            },
                            true,
                            true,
                        )
                    }
                    type="button"
                >
                    Load ifc models
                </button>
                <button
                    disabled={workerLoading}
                    onClick={() =>
                        loadModels(getLargeBmtModelPaths(), {}, true, true)
                    }
                    type="button"
                >
                    Load large bmt models
                </button>
                <div className="app-toolbar-group">
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
                        onClick={() =>
                            viewerRef.current?.geometryUtils.showAll()
                        }
                        type="button"
                    >
                        Show all
                    </button>
                </div>
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
                    <div className="app-toolbar-group">
                        <span className="app-toolbar-title">Viewer API</span>
                        <a className="app-toolbar-link" href={apiDocsHref}>
                            API
                        </a>
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
                {workerProgress && (
                    <span
                        style={{
                            position: "absolute",
                            left: 520,
                            top: 50,
                        }}
                    >
                        Worker: {workerProgress.phase}{" "}
                        {Math.round(workerProgress.progress * 100)}%
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

function App() {
    const routePath = getAppRoutePath();

    if (routePath === "/api" || routePath.startsWith("/api/")) {
        return <ApiDocs />;
    }

    return <ViewerDemo />;
}

export default App;
