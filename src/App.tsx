import "./App.css";

import {
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ElementProperties } from "./components/ElementProperties";
import {
    StructureTree,
    type SelectedElement,
    type StructureSelectOptions,
} from "./components/StructureTree";
import { ApiDocs } from "./components/ApiDocs/ApiDocs";
import {
    bmtConverter,
    convertIfcFilesToBmtInWorker,
    Viewer,
    type ViewerApi,
    type ViewerLoadedModels,
    type ViewerLoadModelsOptions,
    type ViewerMaterialMode,
    type ViewerModelSource,
    type ViewerSelection,
    type ViewerUploadMode,
    type WorkerProgressEvent,
} from "bimatter-viewer-react";
import { useViewerApiGui } from "./components/useViewerApiGui";

type RendererInfoState = {
    triangles: number;
};

type LoadedGeometryLike = {
    ind?: {
        length: number;
    };
    pos?: {
        length: number;
    };
};

const numberFormatter = new Intl.NumberFormat("en-US");
const minStructurePanelWidth = 200;
const maxStructurePanelWidth = 560;
const minPropertiesPanelWidth = 260;
const maxPropertiesPanelWidth = 640;
const panelResizeKeyboardStep = 24;
const panelResizeHandleWidth = 6;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function createEmptyRendererInfo(): RendererInfoState {
    return {
        triangles: 0,
    };
}

function getLoadedGeometryTriangleCount(geometry: LoadedGeometryLike) {
    if (geometry.ind?.length) return Math.floor(geometry.ind.length / 3);
    if (geometry.pos?.length) return Math.floor(geometry.pos.length / 9);

    return 0;
}

function getLoadedModelsTriangleCount(modelsData?: ViewerLoadedModels) {
    return Object.values(modelsData ?? {}).reduce((modelTotal, model) => {
        const geometryTotal = Object.values(model.data ?? {}).reduce(
            (total, geometry) =>
                total +
                getLoadedGeometryTriangleCount(
                    geometry as unknown as LoadedGeometryLike,
                ),
            0,
        );

        return modelTotal + geometryTotal;
    }, 0);
}

function getNextRendererInfo(
    modelsData?: ViewerLoadedModels,
): RendererInfoState {
    return {
        triangles: getLoadedModelsTriangleCount(modelsData),
    };
}

function isSameRendererInfo(
    current: RendererInfoState,
    next: RendererInfoState,
) {
    return current.triangles === next.triangles;
}

function waitForNextFrame() {
    return new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
    });
}

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
    const viewerContainerRef = useRef<HTMLElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const exportFileInputRef = useRef<HTMLInputElement | null>(null);
    const rendererInfoFrameIdsRef = useRef<number[]>([]);
    const rendererInfoRefreshIdRef = useRef(0);
    const [modelLoading, setModelLoading] = useState(false);
    const [modelsData, setModelsData] = useState<ViewerLoadedModels>();
    const [selected, setSelected] = useState<ViewerSelection>({});
    const [viewerApi, setViewerApi] = useState<ViewerApi | null>(null);
    const [exportActiveView, setExportActiveView] = useState(false);
    const [exportUseMinVersion, setExportUseMinVersion] = useState(false);
    const [structurePanelVisible, setStructurePanelVisible] = useState(false);
    const [propertiesPanelVisible, setPropertiesPanelVisible] = useState(false);
    const [structurePanelWidth, setStructurePanelWidth] = useState(280);
    const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(340);
    const [showSpaces, setShowSpaces] = useState(false);
    const [useIfcSpace, setUseIfcSpace] = useState(true);
    const [useWorker, setUseWorker] = useState(false);
    const [performanceMode, setPerformanceMode] = useState(false);
    const [usePerformanceMoving, setUsePerformanceMoving] = useState(false);
    const [useWebGPU, setUseWebGPU] = useState(false);
    const [materialMode, setMaterialMode] =
        useState<ViewerMaterialMode>("quality");
    const [uploadMode, setUploadMode] = useState<ViewerUploadMode>("balanced");
    const [useDoubleSideMaterial, setUseDoubleSideMaterial] = useState(false);
    const [workerLoading, setWorkerLoading] = useState(false);
    const [workerProgress, setWorkerProgress] =
        useState<WorkerProgressEvent | null>(null);
    const [rendererInfo, setRendererInfo] = useState<RendererInfoState>(
        createEmptyRendererInfo,
    );
    const setCameraType = useCallback(
        (value: "perspective" | "orthographic") => {
            viewerRef.current?.camera.setProjection(value);
        },
        [],
    );
    const startStructurePanelResize = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            const startX = event.clientX;
            const startWidth = structurePanelWidth;
            const updateWidth = (moveEvent: PointerEvent) => {
                setStructurePanelWidth(
                    clamp(
                        startWidth + moveEvent.clientX - startX,
                        minStructurePanelWidth,
                        maxStructurePanelWidth,
                    ),
                );
            };
            const stopResize = () => {
                window.removeEventListener("pointermove", updateWidth);
            };

            window.addEventListener("pointermove", updateWidth);
            window.addEventListener("pointerup", stopResize, { once: true });
        },
        [structurePanelWidth],
    );
    const startPropertiesPanelResize = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            const startX = event.clientX;
            const startWidth = propertiesPanelWidth;
            const updateWidth = (moveEvent: PointerEvent) => {
                setPropertiesPanelWidth(
                    clamp(
                        startWidth + startX - moveEvent.clientX,
                        minPropertiesPanelWidth,
                        maxPropertiesPanelWidth,
                    ),
                );
            };
            const stopResize = () => {
                window.removeEventListener("pointermove", updateWidth);
            };

            window.addEventListener("pointermove", updateWidth);
            window.addEventListener("pointerup", stopResize, { once: true });
        },
        [propertiesPanelWidth],
    );
    const onStructureResizeKeyDown = (
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

        event.preventDefault();
        setStructurePanelWidth((width) =>
            clamp(
                width +
                    (event.key === "ArrowRight"
                        ? panelResizeKeyboardStep
                        : -panelResizeKeyboardStep),
                minStructurePanelWidth,
                maxStructurePanelWidth,
            ),
        );
    };
    const onPropertiesResizeKeyDown = (
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

        event.preventDefault();
        setPropertiesPanelWidth((width) =>
            clamp(
                width +
                    (event.key === "ArrowLeft"
                        ? panelResizeKeyboardStep
                        : -panelResizeKeyboardStep),
                minPropertiesPanelWidth,
                maxPropertiesPanelWidth,
            ),
        );
    };
    const selectionInfo = useMemo(() => getSelectionInfo(selected), [selected]);
    useViewerApiGui({
        api: viewerApi,
        materialMode,
        modelsData,
        onMaterialModeChange: setMaterialMode,
        onPerformanceModeChange: setPerformanceMode,
        onUploadModeChange: setUploadMode,
        onUsePerformanceMovingChange: setUsePerformanceMoving,
        onUseWebGPUChange: setUseWebGPU,
        onShowIfcSpacesChange: setShowSpaces,
        onUseDoubleSideMaterialChange: setUseDoubleSideMaterial,
        onUseIfcSpaceChange: setUseIfcSpace,
        onCameraTypeChange: setCameraType,
        performanceMode,
        selected,
        showIfcSpaces: showSpaces,
        uploadMode,
        useDoubleSideMaterial,
        useIfcSpace,
        usePerformanceMoving,
        useWebGPU,
        viewerContainerRef,
    });

    useEffect(() => {
        viewerApi?.geometryUtils.setIfcSpacesVisibility(showSpaces);
    }, [modelsData, showSpaces, viewerApi]);

    const clearRendererInfoFrames = useCallback(() => {
        rendererInfoFrameIdsRef.current.forEach((frameId) => {
            window.cancelAnimationFrame(frameId);
        });
        rendererInfoFrameIdsRef.current = [];
    }, []);

    const updateRendererInfo = useCallback(
        (data: ViewerLoadedModels | undefined = modelsData) => {
            const nextInfo = getNextRendererInfo(data);
            setRendererInfo((currentInfo) =>
                isSameRendererInfo(currentInfo, nextInfo)
                    ? currentInfo
                    : nextInfo,
            );
        },
        [modelsData],
    );

    useEffect(() => {
        return () => {
            rendererInfoRefreshIdRef.current += 1;
            clearRendererInfoFrames();
        };
    }, [clearRendererInfoFrames]);

    const getModelRenderOptions = () => ({
        materialMode: materialMode,
        uploadMode,
        useIfcSpace,
        useDoubleSideMaterial,
    });

    const getLargeBmtModelPaths = () =>
        viewerApi?.utils.getUserDevice() === "pc"
            ? ["./mgu_ar.min.bmt", "./mgu_kr.min.bmt"]
            : ["./mgu_ar.min.bmt"];

    const loadModels = async (
        sources: ViewerModelSource[],
        options: ViewerLoadModelsOptions = {},
        clearViewer = false,
    ) => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        setModelLoading(true);
        setWorkerProgress(null);
        setSelected({});

        if (clearViewer) {
            setModelsData({});
            setRendererInfo(createEmptyRendererInfo());
        }

        await waitForNextFrame();

        try {
            await viewer.models.loadModels(sources, {
                ...options,
                ...getModelRenderOptions(),
                clearViewer,
                // fitToView: true,
                onModelLoadingChange: setModelLoading,
                onModelProgress: setWorkerProgress,
                onModelsDataChange: (data) => {
                    updateRendererInfo(data);
                    setModelsData(data);
                },
                useWorker,
            });
        } finally {
            setModelLoading(false);
        }
    };

    const onFilesSelected = async (files: FileList | null) => {
        if (!files?.length) return;
        try {
            await loadModels(Array.from(files), {}, false);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    useEffect(() => {
        let frameID: number | null = null;

        const syncViewerApi = () => {
            if (viewerRef.current) {
                setViewerApi(viewerRef.current);
                return;
            }

            frameID = window.requestAnimationFrame(syncViewerApi);
        };

        frameID = window.requestAnimationFrame(syncViewerApi);

        return () => {
            if (frameID !== null) {
                window.cancelAnimationFrame(frameID);
            }
        };
    }, []);
    const selectElements = (
        modelID: number,
        elementIDs: number[],
        options: StructureSelectOptions = {},
    ) => {
        const uniqueElementIDs = Array.from(new Set(elementIDs));
        const selector = viewerRef.current?.selector;

        if (selector) {
            if (options.add) {
                selector.addSelected(modelID, uniqueElementIDs);
                return;
            }

            selector.setSelected(
                modelID,
                uniqueElementIDs,
                true,
                true,
                Boolean(options.fitTarget),
            );
            return;
        }

        setSelected({
            [modelID]: uniqueElementIDs,
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
        const selectedFiles = Array.from(files);

        setWorkerProgress(null);
        if (useWorker) {
            setWorkerLoading(true);
        }

        try {
            const result = useWorker
                ? await convertIfcFilesToBmtInWorker(selectedFiles, {
                      fileName: "converted-ifc",
                      onProgress: setWorkerProgress,
                      useMinVersion: exportUseMinVersion,
                  })
                : await (
                      viewerRef.current?.converter ?? bmtConverter
                  ).convertIfcFileToBmt(selectedFiles, {
                      fileName: "converted-ifc",
                      useMinVersion: exportUseMinVersion,
                  });

            if (result) {
                downloadFiles(result.files);
            }
        } finally {
            if (useWorker) {
                setWorkerLoading(false);
            }

            if (exportFileInputRef.current) {
                exportFileInputRef.current.value = "";
            }
        }
    };
    const exportModelsExcel = () => {
        const files = viewerRef.current?.properties.exportAllExcel() ?? [];
        if (!files.length) return;

        downloadFiles(files);
    };
    const apiDocsHref = getAppHref("/api");
    const isMobile = viewerApi?.utils.getUserDevice() === "mobile";
    const appBusy = modelLoading || workerLoading;
    const hasModels = !!modelsData && Object.keys(modelsData).length > 0;
    const showStructurePanel = !!viewerApi && !isMobile && structurePanelVisible;
    const showPropertiesPanel =
        !!viewerApi && !isMobile && propertiesPanelVisible;
    const shellGridColumns = [
        ...(showStructurePanel
            ? [`${structurePanelWidth}px`, `${panelResizeHandleWidth}px`]
            : []),
        "minmax(0, 1fr)",
        ...(showPropertiesPanel
            ? [`${panelResizeHandleWidth}px`, `${propertiesPanelWidth}px`]
            : []),
    ].join(" ");
    const rendererInfoLeft = isMobile ? 30 : 20;

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
                        disabled={appBusy}
                        onChange={(event) => setUseWorker(event.target.checked)}
                        type="checkbox"
                    />
                    useWorker
                </label>
                <button
                    disabled={!viewerApi || appBusy}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                >
                    Load files
                </button>
                <button
                    disabled={!viewerApi || appBusy}
                    onClick={() =>
                        loadModels(
                            ["./demo_ar.min.bmt", "./demo_kr.min.bmt"],
                            {},
                            true,
                        )
                    }
                    type="button"
                >
                    Load bmt models
                </button>
                <button
                    disabled={!viewerApi || appBusy}
                    onClick={() =>
                        loadModels(
                            [
                                "./Clinic_Architectural.ifc",
                                "./Clinic_Structural.ifc",
                            ],
                            {
                                ...(useWorker ? { chunk: 500 } : {}),
                            },
                            true,
                        )
                    }
                    type="button"
                >
                    Load ifc models
                </button>
                <button
                    disabled={!viewerApi || appBusy}
                    onClick={() =>
                        loadModels(getLargeBmtModelPaths(), {}, true)
                    }
                    type="button"
                >
                    Load large bmt models
                </button>
                <div className="app-toolbar-group">
                    <span className="app-toolbar-title">Panels</span>
                    <button
                        className={
                            structurePanelVisible
                                ? "app-toolbar-toggle is-active"
                                : "app-toolbar-toggle"
                        }
                        disabled={isMobile}
                        onClick={() =>
                            setStructurePanelVisible((visible) => !visible)
                        }
                        type="button"
                    >
                        Tree
                    </button>
                    <button
                        className={
                            propertiesPanelVisible
                                ? "app-toolbar-toggle is-active"
                                : "app-toolbar-toggle"
                        }
                        disabled={isMobile}
                        onClick={() =>
                            setPropertiesPanelVisible((visible) => !visible)
                        }
                        type="button"
                    >
                        Properties
                    </button>
                </div>
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
                        disabled={!viewerApi || appBusy}
                        onClick={() => exportFileInputRef.current?.click()}
                        type="button"
                    >
                        Convert files to BMT
                    </button>
                    <button
                        disabled={!viewerApi || !hasModels || appBusy}
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
                            disabled={!viewerApi || !hasModels || appBusy}
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

                {workerProgress && appBusy && (
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
            <div
                className={!isMobile ? "app-shell" : "app-shell-mobile"}
                style={!isMobile ? { gridTemplateColumns: shellGridColumns } : undefined}
            >
                {showStructurePanel && (
                    <StructureTree
                        modelsData={modelsData}
                        onSelectElements={selectElements}
                        selected={selected}
                        showIfcSpaces={showSpaces}
                    />
                )}
                {showStructurePanel && (
                    <button
                        aria-label="Resize structure panel"
                        className="app-resize-handle app-resize-handle-left"
                        onKeyDown={onStructureResizeKeyDown}
                        onPointerDown={startStructurePanelResize}
                        type="button"
                    />
                )}
                <main className="app-viewer" ref={viewerContainerRef}>
                    {!hasModels && (
                        <div className="app-empty">Load a model</div>
                    )}
                    <div
                        className="app-renderer-info"
                        style={{
                            left: rendererInfoLeft,
                        }}
                    >
                        <div className="app-renderer-info-row">
                            <span>
                                Triangles:{" "}
                                {numberFormatter.format(rendererInfo.triangles)}
                            </span>
                        </div>
                        <div className="app-renderer-info-row">
                            <span>Selected: {selectionInfo.count}</span>
                        </div>
                    </div>
                    <Viewer
                        dpr={1}
                        autoFitCamera
                        ref={viewerRef}
                        materialMode={materialMode}
                        onReady={(api) => {
                            setViewerApi(api);
                        }}
                        onSelectedChange={setSelected}
                        performanceMode={performanceMode}
                        selected={selected}
                        showStats
                        usePerformanceMoving={usePerformanceMoving}
                        useWebGPU={useWebGPU}
                    />
                </main>
                {showPropertiesPanel && (
                    <button
                        aria-label="Resize properties panel"
                        className="app-resize-handle app-resize-handle-right"
                        onKeyDown={onPropertiesResizeKeyDown}
                        onPointerDown={startPropertiesPanelResize}
                        type="button"
                    />
                )}
                {showPropertiesPanel && (
                    <ElementProperties
                        modelsData={modelsData}
                        selectedElement={selectionInfo.selectedElement}
                    />
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
