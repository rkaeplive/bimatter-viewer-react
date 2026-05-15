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
    selected: ViewerSelection;
};

type CameraParams = {
    fitCamera: () => void;
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
    selected,
}: ViewerApiGuiOptions) {
    const selectedRef = useRef(selected);
    const modelsDataRef = useRef(modelsData);
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

        const cameraParams: CameraParams = {
            fitCamera: () => run(() => api.camera.fitCamera()),
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

        function syncGuiState() {
            const modelID = getFirstModelID(modelsDataRef.current);
            if (!modelsDataRef.current?.[colorsParams.modelID]) {
                colorsParams.modelID = modelID;
            }

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

            syncControllers();
        }

        const cameraFolder = gui.addFolder("camera");
        addController(cameraFolder.add(cameraParams, "fitCamera")).name(
            "fitCamera",
        );

        const colorsFolder = gui.addFolder("colors");
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

        const utilsFolder = gui.addFolder("utils");
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

        syncGuiRef.current = syncGuiState;
        syncGuiState();

        const syncInterval = window.setInterval(syncGuiState, 500);

        return () => {
            window.clearInterval(syncInterval);
            syncGuiRef.current = null;
            gui.destroy();
        };
    }, [api]);
}
