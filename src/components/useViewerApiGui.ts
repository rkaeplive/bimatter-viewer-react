import { useEffect, useRef } from "react";
import GUI, { type Controller } from "lil-gui";
import type {
    ViewerApi,
    ViewerLoadedModels,
    ViewerSelection,
} from "bimatter-viewer-react";

type ViewerApiGuiOptions = {
    api: ViewerApi | null;
    modelsData?: ViewerLoadedModels;
    onShowIfcSpacesChange?: (showIfcSpaces: boolean) => void;
    onUseIfcSpaceChange?: (useIfcSpace: boolean) => void;
    selected: ViewerSelection;
    showIfcSpaces?: boolean;
    useIfcSpace?: boolean;
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
    createClippingRectangle: () => void;
    deleteAllPlanes: () => void;
    edgesActive: boolean;
    helpersActive: boolean;
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

function parseIds(value: string) {
    if (!value.trim()) return [];

    return value
        .split(/[,\s]+/)
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
}

function getFirstModelID(modelsData?: ViewerLoadedModels) {
    const firstModelID = Object.keys(modelsData ?? {})
        .map(Number)
        .filter((modelID) => Number.isFinite(modelID))
        .sort((a, b) => a - b)[0];

    return firstModelID ?? 0;
}

export function useViewerApiGui({
    api,
    modelsData,
    onShowIfcSpacesChange,
    onUseIfcSpaceChange,
    selected,
    showIfcSpaces = true,
    useIfcSpace = true,
}: ViewerApiGuiOptions) {
    const selectedRef = useRef(selected);
    const modelsDataRef = useRef(modelsData);
    const showIfcSpacesRef = useRef(showIfcSpaces);
    const useIfcSpaceRef = useRef(useIfcSpace);
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
        showIfcSpacesRef.current = showIfcSpaces;
        syncGuiRef.current?.();
    }, [showIfcSpaces]);

    useEffect(() => {
        useIfcSpaceRef.current = useIfcSpace;
        syncGuiRef.current?.();
    }, [useIfcSpace]);

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
            createClippingRectangle: () =>
                run(() => api.clipping.createClippingRectangle()),
            deleteAllPlanes: () => run(() => api.clipping.deleteAllPlanes()),
            edgesActive: api.clipping.getEdgesActive(),
            helpersActive: api.clipping.getHelpersActive(),
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
        viewerApi.geometryUtils.setIfcSpacesVisibility(
            spacesParams.showIfcSpaces,
        );

        function syncGuiState() {
            const modelID = getFirstModelID(modelsDataRef.current);
            if (!modelsDataRef.current?.[colorsParams.modelID]) {
                colorsParams.modelID = modelID;
            }
            dimensionsParams.active = viewerApi.dimensions.getActive();
            dimensionsParams.snapDistance =
                viewerApi.dimensions.getSnapDistance();
            dimensionsParams.unit = viewerApi.dimensions.getUnit();
            clippingParams.active = viewerApi.clipping.getActive();
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

            spacesParams.showIfcSpaces =
                viewerApi.geometryUtils.getIfcSpacesVisibility();
            spacesParams.useIfcSpace = useIfcSpaceRef.current;
            if (showIfcSpacesRef.current !== spacesParams.showIfcSpaces) {
                showIfcSpacesRef.current = spacesParams.showIfcSpaces;
                onShowIfcSpacesChange?.(spacesParams.showIfcSpaces);
            }

            syncControllers();
        }

        const colorsFolder = gui.addFolder("colorizing");
        colorsFolder.close();
        addController(colorsFolder.add(colorsParams, "modelID").step(1)).name(
            "modelID",
        );
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
        addController(clippingFolder.add(clippingParams, "helpersActive"))
            .name("setHelpersActive")
            .onChange((value: boolean) =>
                run(() => api.clipping.setHelpersActive(value)),
            );
        addController(
            clippingFolder.add(clippingParams, "createClippingRectangle"),
        ).name("createClippingRectangle");
        addController(
            clippingFolder.add(clippingParams, "deleteAllPlanes"),
        ).name("deleteAllPlanes");
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

        const spaceFolder = gui.addFolder("spaces");
        spaceFolder.close();
        addController(spaceFolder.add(spacesParams, "useIfcSpace"))
            .name("useIfcSpace")
            .onChange((value: boolean) => {
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
    }, [api, onShowIfcSpacesChange, onUseIfcSpaceChange]);
}
