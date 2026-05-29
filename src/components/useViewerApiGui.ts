import { useEffect, useRef } from "react";
import GUI, { type Controller } from "lil-gui";
import type {
    IfcClass,
    ViewerApi,
    ViewerLoadedModels,
    ViewerMaterialMode,
    ViewerModelLevel,
    ViewerSelection,
} from "bimatter-viewer-react";

type ViewerApiGuiOptions = {
    api: ViewerApi | null;
    materialMode?: ViewerMaterialMode;
    modelsData?: ViewerLoadedModels;
    onMaterialModeChange?: (materialMode: ViewerMaterialMode) => void;
    onPerformanceModeChange?: (performanceMode: boolean) => void;
    onShowIfcSpacesChange?: (showIfcSpaces: boolean) => void;
    onUseDoubleSideMaterialChange?: (useDoubleSideMaterial: boolean) => void;
    onUseIfcSpaceChange?: (useIfcSpace: boolean) => void;
    onUsePerformanceMovingChange?: (usePerformanceMoving: boolean) => void;
    performanceMode?: boolean;
    selected: ViewerSelection;
    showIfcSpaces?: boolean;
    useDoubleSideMaterial?: boolean;
    useIfcSpace?: boolean;
    usePerformanceMoving?: boolean;
};

type ColorsParams = {
    clearAllColors: () => void;
    clearModelColors: () => void;
    clearSelectedColors: () => void;
    clearColor: () => void;
    color: string;
    ids: string;
    modelID: number;
    paintSelected: () => void;
    setColor: () => void;
};

type ClippingParams = {
    active: boolean;
    capsActive: boolean;
    createClippingRectangle: () => void;
    createClippingRectangleBySelected: () => void;
    deleteAllPlanes: () => void;
    edgesActive: boolean;
    helpersActive: boolean;
};

type CollectorParams = {
    collect: () => void;
    ifcClass: CollectorIfcClass;
    levelKey: string;
    modelID: number;
};

type UtilsParams = {
    defaultHotkeysEnabled: boolean;
    gridBottom: boolean;
    gridLeft: boolean;
    gridRight: boolean;
    gridTop: boolean;
    showGridAxes: boolean;
    showNavCube: boolean;
    showStats: boolean;
};

type SpacesParams = {
    showIfcSpaces: boolean;
    useIfcSpace: boolean;
};

type PerformanceParams = {
    materialMode: ViewerMaterialMode;
    performanceMode: boolean;
    useDoubleSideMaterial: boolean;
    usePerformanceMoving: boolean;
};

type DimensionsParams = {
    active: boolean;
    cancelDrawing: () => void;
    changeAxes: () => void;
    color: string;
    delete: () => void;
    deleteAll: () => void;
    endpointScaleFactor: number;
    snapDistance: number;
    unit: "m" | "mm";
    width: number;
};

const ifcClasses = [
    "IfcActuator",
    "IfcAirTerminal",
    "IfcAirTerminalBox",
    "IfcBeam",
    "IfcBuilding",
    "IfcBuildingElementProxy",
    "IfcBuildingStorey",
    "IfcCableCarrierFitting",
    "IfcCableCarrierSegment",
    "IfcCableSegment",
    "IfcColumn",
    "IfcCovering",
    "IfcCurtainWall",
    "IfcDamper",
    "IfcDistributionChamberElement",
    "IfcDoor",
    "IfcDuctFitting",
    "IfcDuctSegment",
    "IfcElectricAppliance",
    "IfcElementAssembly",
    "IfcEnergyConversionDevice",
    "IfcFan",
    "IfcFastener",
    "IfcFilter",
    "IfcFlowController",
    "IfcFlowFitting",
    "IfcFlowMovingDevice",
    "IfcFlowSegment",
    "IfcFlowStorageDevice",
    "IfcFlowTerminal",
    "IfcFlowTreatmentDevice",
    "IfcFooting",
    "IfcFurniture",
    "IfcFurnishingElement",
    "IfcGrid",
    "IfcMember",
    "IfcOpeningElement",
    "IfcPile",
    "IfcPipeFitting",
    "IfcPipeSegment",
    "IfcPlate",
    "IfcPump",
    "IfcRailing",
    "IfcRamp",
    "IfcRoof",
    "IfcSanitaryTerminal",
    "IfcSite",
    "IfcSlab",
    "IfcSpace",
    "IfcStair",
    "IfcSwitchingDevice",
    "IfcSystemFurnitureElement",
    "IfcTransportElement",
    "IfcUnitaryEquipment",
    "IfcValve",
    "IfcWall",
    "IfcWallStandardCase",
    "IfcWindow",
] satisfies IfcClass[];

const allIfcClassesKey = "All Classes";
const defaultIfcClass: IfcClass | typeof allIfcClassesKey = allIfcClassesKey;

type CollectorIfcClass = IfcClass | typeof allIfcClassesKey;
const collectorIfcClasses: CollectorIfcClass[] = [
    allIfcClassesKey,
    ...ifcClasses,
];
const allCollectorLevelsKey = "__all_levels__";

function parseIds(value: string) {
    if (!value.trim()) return [];

    return value
        .split(/[,\s]+/)
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
}

function getFirstModelID(modelsData?: ViewerLoadedModels) {
    return getModelIDs(modelsData)[0] ?? 0;
}

function getModelIDs(modelsData?: ViewerLoadedModels) {
    return Object.keys(modelsData ?? {})
        .map(Number)
        .filter((modelID) => Number.isFinite(modelID))
        .sort((a, b) => a - b);
}

function hasLoadedModels(modelsData?: ViewerLoadedModels) {
    return getModelIDs(modelsData).length > 0;
}

function getModelIDOptions(modelsData?: ViewerLoadedModels) {
    const modelIDs = getModelIDs(modelsData);
    if (!modelIDs.length) return { "No models": 0 };

    return Object.fromEntries(
        modelIDs.map((modelID) => [`Model ${modelID}`, modelID]),
    );
}

function getControllerOptionsKey(options: Record<string, number | string>) {
    return Object.entries(options)
        .map(([label, value]) => `${label}:${value}`)
        .join("|");
}

function getCollectorLevelKey(modelID: number, levelIndex: number) {
    return `${modelID}:${levelIndex}`;
}

function getCollectorLevelLabel(level: ViewerModelLevel, levelIndex: number) {
    const name = typeof level.name === "string" ? level.name.trim() : "";
    const type = typeof level.type === "string" ? level.type.trim() : "";
    const id =
        typeof level.id === "number" || typeof level.id === "string"
            ? String(level.id)
            : "";
    const title = name || type || `Level ${levelIndex + 1}`;
    const meta = [
        type && type !== title ? type : "",
        id ? `id ${id}` : "",
        level.elements?.length ? `${level.elements.length} elements` : "",
    ].filter(Boolean);

    const indexedTitle = `${levelIndex + 1}. ${title}`;

    return meta.length ? `${indexedTitle} (${meta.join(", ")})` : indexedTitle;
}

function getCollectorLevels(api: ViewerApi, modelID: number) {
    try {
        return api.properties.getAllModelLevels(modelID, true);
    } catch {
        return [];
    }
}

function getCollectorLevelOptions(api: ViewerApi, modelID: number) {
    const levels = getCollectorLevels(api, modelID);

    return {
        "All levels": allCollectorLevelsKey,
        ...Object.fromEntries(
            levels.map((level, index) => [
                getCollectorLevelLabel(level, index),
                getCollectorLevelKey(modelID, index),
            ]),
        ),
    };
}

function getCollectorLevelByKey(api: ViewerApi, levelKey: string) {
    if (levelKey === allCollectorLevelsKey) return null;

    const [modelIDValue, levelIndexValue] = levelKey.split(":");
    const modelID = Number(modelIDValue);
    const levelIndex = Number(levelIndexValue);

    if (!Number.isFinite(modelID) || !Number.isInteger(levelIndex)) return null;

    return getCollectorLevels(api, modelID)[levelIndex] ?? null;
}

export function useViewerApiGui({
    api,
    materialMode = "quality",
    modelsData,
    onMaterialModeChange,
    onPerformanceModeChange,
    onShowIfcSpacesChange,
    onUseDoubleSideMaterialChange,
    onUseIfcSpaceChange,
    onUsePerformanceMovingChange,
    performanceMode = false,
    selected,
    showIfcSpaces = false,
    useDoubleSideMaterial = false,
    useIfcSpace = true,
    usePerformanceMoving = false,
}: ViewerApiGuiOptions) {
    const selectedRef = useRef(selected);
    const modelsDataRef = useRef(modelsData);
    const materialModeRef = useRef(materialMode);
    const performanceModeRef = useRef(performanceMode);
    const showIfcSpacesRef = useRef(showIfcSpaces);
    const useDoubleSideMaterialRef = useRef(useDoubleSideMaterial);
    const useIfcSpaceRef = useRef(useIfcSpace);
    const usePerformanceMovingRef = useRef(usePerformanceMoving);
    const syncGuiRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        selectedRef.current = selected;
        syncGuiRef.current?.();
    }, [selected]);

    useEffect(() => {
        modelsDataRef.current = modelsData;
        syncGuiRef.current?.();
    }, [modelsData]);

    useEffect(() => {
        materialModeRef.current = materialMode;
        syncGuiRef.current?.();
    }, [materialMode]);

    useEffect(() => {
        performanceModeRef.current = performanceMode;
        syncGuiRef.current?.();
    }, [performanceMode]);

    useEffect(() => {
        showIfcSpacesRef.current = showIfcSpaces;
        syncGuiRef.current?.();
    }, [showIfcSpaces]);

    useEffect(() => {
        useDoubleSideMaterialRef.current = useDoubleSideMaterial;
        syncGuiRef.current?.();
    }, [useDoubleSideMaterial]);

    useEffect(() => {
        useIfcSpaceRef.current = useIfcSpace;
        syncGuiRef.current?.();
    }, [useIfcSpace]);

    useEffect(() => {
        usePerformanceMovingRef.current = usePerformanceMoving;
        syncGuiRef.current?.();
    }, [usePerformanceMoving]);

    useEffect(() => {
        if (!api) return;
        const viewerApi = api;
        const isMobile = viewerApi.utils.getUserDevice() === "mobile";

        const gui = new GUI({
            title: "Viewer API",
            width: 330,
        });
        gui.domElement.style.top = "48px";
        gui.domElement.style.right = isMobile ? "20px" : "350px";
        gui.domElement.style.maxHeight = "calc(50vh )";
        if (isMobile) {
            gui.close();
        }
        const controllers: Controller[] = [];
        const addController = (controller: Controller) => {
            controllers.push(controller);
            return controller;
        };
        const syncControllers = () => {
            controllers.forEach((controller) => controller.updateDisplay());
        };
        const run = (callback: () => void) => {
            callback();
            syncGuiState();
        };
        const forEachSelectedModel = (
            callback: (modelID: number, ids: number[]) => void,
        ) => {
            Object.entries(selectedRef.current).forEach(([modelID, ids]) => {
                if (!ids.length) return;
                callback(Number(modelID), ids);
            });
        };

        const colorsParams: ColorsParams = {
            clearAllColors: () => run(() => api.colors.clearAllColors()),
            clearModelColors: () =>
                run(() => api.colors.clearModelColors(colorsParams.modelID)),
            clearSelectedColors: () =>
                run(() => {
                    forEachSelectedModel((modelID, ids) => {
                        api.colors.clearColor(modelID, ids);
                    });
                }),
            clearColor: () =>
                run(() =>
                    api.colors.clearColor(
                        colorsParams.modelID,
                        parseIds(colorsParams.ids),
                    ),
                ),
            color: "#ff002b",
            ids: "",
            modelID: getFirstModelID(modelsDataRef.current),
            paintSelected: () =>
                run(() => {
                    forEachSelectedModel((modelID, ids) => {
                        api.colors.setColor(modelID, ids, colorsParams.color);
                    });
                }),
            setColor: () =>
                run(() =>
                    api.colors.setColor(
                        colorsParams.modelID,
                        parseIds(colorsParams.ids),
                        colorsParams.color,
                    ),
                ),
        };

        const clippingParams: ClippingParams = {
            active: api.clipping.getActive(),
            capsActive: api.clipping.getCapsActive(),
            createClippingRectangle: () =>
                run(() => api.clipping.createClippingRectangle()),
            createClippingRectangleBySelected: () =>
                run(() => api.clipping.createClippingRectangle(true)),
            deleteAllPlanes: () => run(() => api.clipping.deleteAllPlanes()),
            edgesActive: api.clipping.getEdgesActive(),
            helpersActive: api.clipping.getHelpersActive(),
        };
        const collectorParams: CollectorParams = {
            collect: () => {
                const modelID = Number(collectorParams.modelID);
                const modelIDs = getModelIDs(modelsDataRef.current);
                if (!modelIDs.includes(modelID)) return;

                const level = getCollectorLevelByKey(
                    api,
                    collectorParams.levelKey,
                );
                const selectedModelID = level?.modelID ?? modelID;
                const collector = level
                    ? api.selector.collector().ofLevel(level)
                    : api.selector.collector().ofModel(modelID);
                const elementIDs =
                    collectorParams.ifcClass === allIfcClassesKey
                        ? collector.toElementIds()
                        : collector
                              .ofType(collectorParams.ifcClass)
                              .toElementIds();

                api.selector.setSelected(selectedModelID, elementIDs, true);
                console.info("Collected elements", {
                    elementIDs,
                    ifcClass: collectorParams.ifcClass,
                    level,
                    modelID: selectedModelID,
                });
            },
            ifcClass: defaultIfcClass,
            levelKey: allCollectorLevelsKey,
            modelID: getFirstModelID(modelsDataRef.current),
        };
        const dimensionsParams: DimensionsParams = {
            active: api.dimensions.getActive(),
            cancelDrawing: () => run(() => api.dimensions.cancelDrawing()),
            changeAxes: () => run(() => api.dimensions.changeAxes()),
            color: "#111827",
            delete: () => run(() => api.dimensions.delete()),
            deleteAll: () => run(() => api.dimensions.deleteAll()),
            endpointScaleFactor: 0.015,
            snapDistance: api.dimensions.getSnapDistance(),
            unit: api.dimensions.getUnit(),
            width: 1,
        };
        const gridAxesVisibility = api.utils.getGridAxesVisibility();
        const utilsParams: UtilsParams = {
            defaultHotkeysEnabled: api.utils.getDefaultHotkeysEnabled(),
            gridBottom: gridAxesVisibility.bottom,
            gridLeft: gridAxesVisibility.left,
            gridRight: gridAxesVisibility.right,
            gridTop: gridAxesVisibility.top,
            showGridAxes: api.utils.getShowGridAxes(),
            showNavCube: api.utils.getShowNavCube(),
            showStats: api.utils.getShowStats(),
        };
        const spacesParams: SpacesParams = {
            showIfcSpaces: showIfcSpacesRef.current,
            useIfcSpace: useIfcSpaceRef.current,
        };
        const performanceParams: PerformanceParams = {
            materialMode: materialModeRef.current,
            performanceMode: performanceModeRef.current,
            useDoubleSideMaterial: useDoubleSideMaterialRef.current,
            usePerformanceMoving: usePerformanceMovingRef.current,
        };
        viewerApi.geometryUtils.setIfcSpacesVisibility(
            spacesParams.showIfcSpaces,
        );
        let collectorModelIDOptionsKey: string | null = null;
        let collectorModelIDController: Controller | null = null;
        let collectorLevelOptionsKey: string | null = null;
        let collectorLevelController: Controller | null = null;
        let colorizeModelIDController: Controller | null = null;
        let materialModeController: Controller | null = null;
        let useIfcSpaceController: Controller | null = null;
        let useDoubleSideMaterialController: Controller | null = null;

        function syncGuiState() {
            const hasModels = hasLoadedModels(modelsDataRef.current);
            const modelID = getFirstModelID(modelsDataRef.current);
            if (!modelsDataRef.current?.[colorsParams.modelID]) {
                colorsParams.modelID = modelID;
            }
            const modelIDs = getModelIDs(modelsDataRef.current);
            if (!modelIDs.includes(collectorParams.modelID)) {
                collectorParams.modelID = modelID;
            }
            const collectorLevelOptions = getCollectorLevelOptions(
                viewerApi,
                collectorParams.modelID,
            );
            const collectorLevelValues = Object.values(collectorLevelOptions);
            if (!collectorLevelValues.includes(collectorParams.levelKey)) {
                collectorParams.levelKey = allCollectorLevelsKey;
            }
            const nextCollectorLevelOptionsKey = getControllerOptionsKey(
                collectorLevelOptions,
            );
            if (collectorLevelOptionsKey !== nextCollectorLevelOptionsKey) {
                collectorLevelOptionsKey = nextCollectorLevelOptionsKey;
                collectorLevelController?.options(collectorLevelOptions);
                collectorLevelController?.enable(
                    modelIDs.length > 0 && collectorLevelValues.length > 1,
                );
            }
            const modelIDOptionsKey = modelIDs.join(",");
            if (collectorModelIDOptionsKey !== modelIDOptionsKey) {
                collectorModelIDOptionsKey = modelIDOptionsKey;
                collectorModelIDController?.options(
                    getModelIDOptions(modelsDataRef.current),
                );
                collectorModelIDController?.enable(modelIDs.length > 0);
                colorizeModelIDController?.options(
                    getModelIDOptions(modelsDataRef.current),
                );
                colorizeModelIDController?.enable(modelIDs.length > 0);
            }
            dimensionsParams.active = viewerApi.dimensions.getActive();
            dimensionsParams.snapDistance =
                viewerApi.dimensions.getSnapDistance();
            dimensionsParams.unit = viewerApi.dimensions.getUnit();
            clippingParams.active = viewerApi.clipping.getActive();
            clippingParams.capsActive = viewerApi.clipping.getCapsActive();
            clippingParams.edgesActive = viewerApi.clipping.getEdgesActive();
            clippingParams.helpersActive =
                viewerApi.clipping.getHelpersActive();

            const visibility = viewerApi.utils.getGridAxesVisibility();
            utilsParams.defaultHotkeysEnabled =
                viewerApi.utils.getDefaultHotkeysEnabled();
            utilsParams.gridBottom = visibility.bottom;
            utilsParams.gridLeft = visibility.left;
            utilsParams.gridRight = visibility.right;
            utilsParams.gridTop = visibility.top;
            utilsParams.showGridAxes = viewerApi.utils.getShowGridAxes();
            utilsParams.showNavCube = viewerApi.utils.getShowNavCube();
            utilsParams.showStats = viewerApi.utils.getShowStats();

            spacesParams.showIfcSpaces = showIfcSpacesRef.current;
            spacesParams.useIfcSpace = useIfcSpaceRef.current;

            if (
                viewerApi.geometryUtils.getIfcSpacesVisibility() !==
                spacesParams.showIfcSpaces
            ) {
                viewerApi.geometryUtils.setIfcSpacesVisibility(
                    spacesParams.showIfcSpaces,
                );
            }
            performanceParams.materialMode = materialModeRef.current;
            performanceParams.performanceMode = performanceModeRef.current;
            performanceParams.useDoubleSideMaterial =
                useDoubleSideMaterialRef.current;
            performanceParams.usePerformanceMoving =
                usePerformanceMovingRef.current;
            materialModeController?.enable(!hasModels);
            useIfcSpaceController?.enable(!hasModels);
            useDoubleSideMaterialController?.enable(!hasModels);

            syncControllers();
        }

        const colorsFolder = gui.addFolder("colorizing");
        colorsFolder.close();

        colorizeModelIDController = addController(
            colorsFolder.add(
                colorsParams,
                "modelID",
                getModelIDOptions(modelsDataRef.current),
            ),
        )
            .name("modelID")
            .onChange((value: number | string) => {
                colorsParams.modelID = Number(value);
                syncGuiState();
            });

        addController(colorsFolder.add(colorsParams, "ids")).name("ids");
        addController(colorsFolder.addColor(colorsParams, "color")).name(
            "color",
        );
        addController(colorsFolder.add(colorsParams, "setColor")).name(
            "setColor",
        );
        addController(colorsFolder.add(colorsParams, "clearColor")).name(
            "clearColor",
        );
        addController(colorsFolder.add(colorsParams, "clearModelColors")).name(
            "clearModelColors",
        );
        addController(colorsFolder.add(colorsParams, "clearAllColors")).name(
            "clearAllColors",
        );
        addController(colorsFolder.add(colorsParams, "paintSelected")).name(
            "setColor(selected)",
        );
        addController(
            colorsFolder.add(colorsParams, "clearSelectedColors"),
        ).name("clearColor(selected)");

        const clippingFolder = gui.addFolder("clipping");
        clippingFolder.close();
        addController(clippingFolder.add(clippingParams, "active"))
            .name("setActive")
            .onChange((value: boolean) =>
                run(() => api.clipping.setActive(value)),
            );
        addController(clippingFolder.add(clippingParams, "edgesActive"))
            .name("setEdgesActive")
            .onChange((value: boolean) =>
                run(() => api.clipping.setEdgesActive(value)),
            );
        addController(clippingFolder.add(clippingParams, "capsActive"))
            .name("setCapsActive")
            .onChange((value: boolean) =>
                run(() => api.clipping.setCapsActive(value)),
            );
        addController(clippingFolder.add(clippingParams, "helpersActive"))
            .name("setHelpersActive")
            .onChange((value: boolean) =>
                run(() => api.clipping.setHelpersActive(value)),
            );
        addController(
            clippingFolder.add(clippingParams, "createClippingRectangle"),
        ).name("createClippingRectangle");
        addController(
            clippingFolder.add(
                clippingParams,
                "createClippingRectangleBySelected",
            ),
        ).name("createClippingRectangleBySelected");
        addController(
            clippingFolder.add(clippingParams, "deleteAllPlanes"),
        ).name("deleteAllPlanes");

        const collectorFolder = gui.addFolder("collector");
        // collectorFolder.close();
        collectorModelIDController = addController(
            collectorFolder.add(
                collectorParams,
                "modelID",
                getModelIDOptions(modelsDataRef.current),
            ),
        )
            .name("modelID")
            .onChange((value: number | string) => {
                collectorParams.modelID = Number(value);
                syncGuiState();
            });
        addController(
            collectorFolder.add(
                collectorParams,
                "ifcClass",
                collectorIfcClasses,
            ),
        ).name("ifcClass");
        collectorLevelController = addController(
            collectorFolder.add(
                collectorParams,
                "levelKey",
                getCollectorLevelOptions(viewerApi, collectorParams.modelID),
            ),
        )
            .name("level")
            .onChange((value: string) => {
                collectorParams.levelKey = value;
                syncGuiState();
            });
        addController(collectorFolder.add(collectorParams, "collect")).name(
            "collect",
        );

        const dimensionsFolder = gui.addFolder("dimensions");
        dimensionsFolder.close();
        addController(dimensionsFolder.add(dimensionsParams, "active"))
            .name("setActive")
            .onChange((value: boolean) =>
                run(() => api.dimensions.setActive(value)),
            );
        addController(
            dimensionsFolder.add(dimensionsParams, "unit", ["m", "mm"]),
        )
            .name("setUnit")
            .onChange((value: "m" | "mm") =>
                run(() => api.dimensions.setUnit(value)),
            );
        addController(
            dimensionsFolder.add(dimensionsParams, "snapDistance", 0, 10, 0.1),
        )
            .name("setSnapDistance")
            .onChange((value: number) =>
                run(() => api.dimensions.setSnapDistance(value)),
            );
        addController(
            dimensionsFolder.add(
                dimensionsParams,
                "endpointScaleFactor",
                0.001,
                0.1,
                0.001,
            ),
        )
            .name("setEndpointScaleFactor")
            .onChange((value: number) =>
                run(() => api.dimensions.setEndpointScaleFactor(value)),
            );
        addController(dimensionsFolder.add(dimensionsParams, "width", 1, 8, 1))
            .name("setWidth")
            .onChange((value: number) =>
                run(() => api.dimensions.setWidth(value)),
            );
        addController(dimensionsFolder.addColor(dimensionsParams, "color"))
            .name("setColor")
            .onChange((value: string) =>
                run(() => api.dimensions.setColor(value)),
            );
        addController(
            dimensionsFolder.add(dimensionsParams, "changeAxes"),
        ).name("changeAxes");
        addController(
            dimensionsFolder.add(dimensionsParams, "cancelDrawing"),
        ).name("cancelDrawing");
        addController(dimensionsFolder.add(dimensionsParams, "delete")).name(
            "delete",
        );
        addController(dimensionsFolder.add(dimensionsParams, "deleteAll")).name(
            "deleteAll",
        );

        const utilsFolder = gui.addFolder("utils");
        utilsFolder.close();
        addController(utilsFolder.add(utilsParams, "defaultHotkeysEnabled"))
            .name("setDefaultHotkeysEnabled")
            .onChange((value: boolean) =>
                run(() => api.utils.setDefaultHotkeysEnabled(value)),
            );
        addController(utilsFolder.add(utilsParams, "showStats"))
            .name("setShowStats")
            .onChange((value: boolean) =>
                run(() => api.utils.setShowStats(value)),
            );
        addController(utilsFolder.add(utilsParams, "showNavCube"))
            .name("setShowNavCube")
            .onChange((value: boolean) =>
                run(() => api.utils.setShowNavCube(value)),
            );
        addController(utilsFolder.add(utilsParams, "showGridAxes"))
            .name("setShowGridAxes")
            .onChange((value: boolean) =>
                run(() => api.utils.setShowGridAxes(value)),
            );
        addController(utilsFolder.add(utilsParams, "gridBottom"))
            .name("setGridAxisVisibility(bottom)")
            .onChange((value: boolean) =>
                run(() => api.utils.setGridAxisVisibility("bottom", value)),
            );
        addController(utilsFolder.add(utilsParams, "gridLeft"))
            .name("setGridAxisVisibility(left)")
            .onChange((value: boolean) =>
                run(() => api.utils.setGridAxisVisibility("left", value)),
            );
        addController(utilsFolder.add(utilsParams, "gridRight"))
            .name("setGridAxisVisibility(right)")
            .onChange((value: boolean) =>
                run(() => api.utils.setGridAxisVisibility("right", value)),
            );
        addController(utilsFolder.add(utilsParams, "gridTop"))
            .name("setGridAxisVisibility(top)")
            .onChange((value: boolean) =>
                run(() => api.utils.setGridAxisVisibility("top", value)),
            );

        const performanceFolder = gui.addFolder("performance");
        performanceFolder.close();
        addController(
            performanceFolder.add(performanceParams, "performanceMode"),
        )
            .name("performanceMode")
            .onChange((value: boolean) => {
                performanceModeRef.current = value;
                onPerformanceModeChange?.(value);
                syncGuiState();
            });
        addController(
            performanceFolder.add(performanceParams, "usePerformanceMoving"),
        )
            .name("usePerformanceMoving")
            .onChange((value: boolean) => {
                usePerformanceMovingRef.current = value;
                onUsePerformanceMovingChange?.(value);
                syncGuiState();
            });
        materialModeController = addController(
            performanceFolder.add(
                performanceParams,
                "materialMode",
                ["quality", "performance"],
            ),
        )
            .name("materialMode")
            .onChange((value: ViewerMaterialMode | string) => {
                if (hasLoadedModels(modelsDataRef.current)) {
                    syncGuiState();
                    return;
                }

                const nextMaterialMode =
                    value === "performance" ? "performance" : "quality";

                materialModeRef.current = nextMaterialMode;
                onMaterialModeChange?.(nextMaterialMode);
                syncGuiState();
            });
        useDoubleSideMaterialController = addController(
            performanceFolder.add(
                performanceParams,
                "useDoubleSideMaterial",
            ),
        )
            .name("useDoubleSideMaterial")
            .onChange((value: boolean) => {
                if (hasLoadedModels(modelsDataRef.current)) {
                    syncGuiState();
                    return;
                }

                useDoubleSideMaterialRef.current = value;
                onUseDoubleSideMaterialChange?.(value);
                syncGuiState();
            });

        const spaceFolder = gui.addFolder("spaces");
        spaceFolder.close();
        useIfcSpaceController = addController(
            spaceFolder.add(spacesParams, "useIfcSpace"),
        )
            .name("useIfcSpace")
            .onChange((value: boolean) => {
                if (hasLoadedModels(modelsDataRef.current)) {
                    syncGuiState();
                    return;
                }

                useIfcSpaceRef.current = value;
                onUseIfcSpaceChange?.(value);
                syncGuiState();
            });
        addController(spaceFolder.add(spacesParams, "showIfcSpaces"))
            .name("setIfcSpacesVisibility")
            .onChange((value: boolean) => {
                showIfcSpacesRef.current = value;
                onShowIfcSpacesChange?.(value);
                run(() => api.geometryUtils.setIfcSpacesVisibility(value));
            });

        syncGuiRef.current = syncGuiState;
        syncGuiState();

        const syncInterval = window.setInterval(syncGuiState, 500);

        return () => {
            window.clearInterval(syncInterval);
            syncGuiRef.current = null;
            gui.destroy();
        };
    }, [
        api,
        onMaterialModeChange,
        onPerformanceModeChange,
        onShowIfcSpacesChange,
        onUseDoubleSideMaterialChange,
        onUseIfcSpaceChange,
        onUsePerformanceMovingChange,
    ]);
}
