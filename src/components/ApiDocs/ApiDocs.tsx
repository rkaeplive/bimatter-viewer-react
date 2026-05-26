import { type FormEvent, useEffect, useMemo, useState } from "react";

const installCode = `npm install bimatter-viewer-react`;

const basicUsageCode = `import { Viewer } from "bimatter-viewer-react";

function App() {
    return (
        <Viewer
            modelUrls={[
                "/models/architecture.bmt",
                "/models/structure.ifc",
            ]}
        />
    );
}`;

const controlledLoaderCode = `import { useEffect, useState } from "react";
import {
    loader,
    Viewer,
    type ViewerLoadedModels,
} from "bimatter-viewer-react";

function App() {
    const [modelsData, setModelsData] = useState<ViewerLoadedModels>();

    useEffect(() => {
        loader
            .loadModel(["/models/architecture.bmt", "/models/structure.ifc"])
            .then(setModelsData);
    }, []);

    return <Viewer modelsData={modelsData} />;
}`;

const workerCode = `await loader.loadModel(["/models/model.ifc"], {
    chunk: 500,
    collectWorkerChunks: false,
    useWorker: true,
    onChunk: (chunk) => {
        // Add chunk.geometry to your progressive render state.
    },
    onProgress: (event) => {
        console.log(event.phase, Math.round(event.progress * 100));
    },
});`;

const performanceCode = `<Viewer modelUrls={["/models/model.bmt"]} performanceMode />

<Viewer modelUrls={["/models/model.bmt"]} materialMode="performance" />

await loader.loadModel(["/models/model.bmt"], {
    materialMode: "performance",
    useDoubleSideMaterial: true,
});`;

const refCode = `import { useRef } from "react";
import { Viewer, type ViewerApi } from "bimatter-viewer-react";

function App() {
    const viewerRef = useRef<ViewerApi>(null);

    return (
        <>
            <button onClick={() => viewerRef.current?.camera.fitCamera()}>
                Fit
            </button>
            <button onClick={() => viewerRef.current?.geometryUtils.hideSelected()}>
                Hide selected
            </button>
            <Viewer ref={viewerRef} modelUrls={["/models/model.bmt"]} />
        </>
    );
}`;

const converterCode = `const result = viewerRef.current?.converter.convertToBmt({
    activeView: true,
    fileName: "viewer-export",
    useMinVersion: true,
});

await viewerRef.current?.converter.convertIfcFileToBmt(files, {
    fileName: "converted-ifc",
    useIfcColors: true,
    useIfcElementAssembly: true,
    useMinVersion: true,
});`;

const converterWorkerCode = `import { convertIfcFilesToBmtInWorker } from "bimatter-viewer-react";

const result = await convertIfcFilesToBmtInWorker(files, {
    chunk: 500,
    fileName: "converted-ifc",
    onProgress: (event) => {
        console.log(event.phase, Math.round(event.progress * 100));
    },
    useMinVersion: true,
});

downloadFiles(result.files);`;

const colorRebuildByPropertiesCode = `const viewer = viewerRef.current;

viewer?.colors.rebuildModelByColors(
    0,
    {
        "#ff3355": viewer.selector
            .collector()
            .ofModel(0)
            .Where(
                (element) =>
                    viewer.properties.getParamValueByName(
                        element.props,
                        "System Name",
                        "Mechanical",
                    ) === "Mechanical Supply Air 2",
            )
            .toElementsIds(),
    },
    "#d1d5db",
);`;

const viewerProps = [
    ["modelUrls", "string[]", "Loads BMT or IFC files from public URLs."],
    ["modelSources", "ViewerModelSource[]", "Loads URL or File sources."],
    [
        "modelsData",
        "ViewerLoadedModels",
        "Render models that were loaded by loader.loadModel.",
    ],
    [
        "camera",
        "Canvas camera props",
        "Initial React Three Fiber camera settings.",
    ],
    ["dpr", "number | [number, number]", "Canvas pixel ratio."],
    [
        "materialMode",
        "ViewerMaterialMode",
        'Overrides model material mode. Use "performance" for a cheaper unlit material.',
    ],
    [
        "selected",
        "ViewerSelection",
        "Controlled selected element ids by model id.",
    ],
    ["defaultSelected", "ViewerSelection", "Initial uncontrolled selection."],
    ["onSelectedChange", "(selected) => void", "Selection change callback."],
    ["onReady", "(api) => void", "Receives ViewerApi when scene API is ready."],
    [
        "performanceMode",
        "boolean",
        "Optimizes the canvas for heavy scenes and defaults materialMode to performance.",
    ],
    ["showNavCube", "boolean", "Shows or hides the navigation cube."],
    ["showStats", "boolean", "Shows Drei stats overlay."],
    [
        "autoFitCamera",
        "boolean",
        "Automatically fits the camera when model data changes.",
    ],
] as const;

const loaderOptions = [
    ["useWorker", "boolean", "Parse BMT or IFC outside the main thread."],
    [
        "onChunk",
        "(chunk) => void",
        "Receives streamed geometry chunks for progressive render.",
    ],
    [
        "collectWorkerChunks",
        "boolean",
        "Keep streamed chunks in the worker client result.",
    ],
    ["onProgress", "(event) => void", "Receives worker progress events."],
    [
        "useIfcSpace",
        "boolean",
        "IFCSPACE geometry is loaded by default; pass false to skip it.",
    ],
    [
        "materialMode",
        "ViewerMaterialMode",
        'Stores model render settings. Use "performance" for a cheaper unlit material.',
    ],
    [
        "useDoubleSideMaterial",
        "boolean",
        "Uses double-sided model materials. Disabled by default for better FPS.",
    ],
    ["wasmPath", "string", "Custom ifc-parser.wasm URL."],
    ["chunk", "number", "IFC geometries per streamed chunk."],
    [
        "maxMeshBytes",
        "number",
        "Maximum IFC mesh buffer size before splitting.",
    ],
] as const;

const propertiesExcelOptions = [
    ["fileName", "string", "Export file name."],
    ["modelName", "string", "Worksheet/model label used inside the file."],
    ["emptyValue", "string", "Placeholder for empty property values."],
] as const;

const converterWorkerOptions = [
    ["chunk", "number", "IFC geometries per streamed parse chunk."],
    [
        "maxMeshBytes",
        "number",
        "Maximum IFC mesh buffer size before splitting.",
    ],
    ["wasmPath", "string", "Custom ifc-parser.wasm URL."],
    [
        "onProgress",
        "(event) => void",
        "Receives converter worker progress events.",
    ],
    [
        "terminateOnComplete",
        "boolean",
        "Terminates the worker after conversion completes.",
    ],
    ["worker", "Worker", "Optional custom converter worker instance."],
] as const;

const selectorCollectorMethods = [
    [
        "from(source)",
        "FilteredElementsCollector",
        "Replaces the collector source with models or model props.",
    ],
    [
        "ofType(type)",
        "FilteredElementsCollector",
        "Filters elements by IFC class name or custom type string.",
    ],
    [
        "ofModel(modelID)",
        "FilteredElementsCollector",
        "Filters by one model id or several model ids.",
    ],
    [
        "ofLevel(level)",
        "FilteredElementsCollector<true>",
        "Filters elements by a ViewerModelLevel from the properties API.",
    ],
    [
        "where(predicate)",
        "FilteredElementsCollector",
        "Filters by custom predicate. Where is also available as an alias.",
    ],
    [
        "toElements()",
        "FilteredElementsResult",
        "Returns filtered elements with props, grouped by model unless one model was selected.",
    ],
    [
        "toElementIds()",
        "FilteredElementIdsResult",
        "Returns filtered element ids. toElementsIds is kept as an alias.",
    ],
] as const;

const selectorCollectorCode = `const levelsByModel = viewerRef.current?.properties.getAllLevels(true);
const firstLevel = levelsByModel?.[0]?.[0];

const wallIdsOnLevel = firstLevel
    ? viewerRef.current?.selector
          .collector()
          .ofLevel(firstLevel)
          .ofType("IfcWall")
          .where((element) => Boolean(element.props.name))
          .toElementIds()
    : [];`;

const selectorCollectorAllClassesCode = `const levelsByModel = viewerRef.current?.properties.getAllLevels(true);
const firstLevel = levelsByModel?.[0]?.[0];

const allIdsOnLevel = firstLevel
    ? viewerRef.current?.selector
          .collector()
          .ofLevel(firstLevel)
          // Skip ofType() to keep all IFC classes.
          .toElementIds()
    : [];`;

const hotkeyRows = [
    ["Left Click", "Selection", "Select element."],
    ["Shift + Left Click", "Selection", "Multi-select element."],
    ["Ctrl + Left Click", "Selection", "Toggle element selection."],
    [
        "Shift + Drag Right",
        "Selection",
        "Select elements fully inside the rectangle.",
    ],
    [
        "Shift + Drag Left",
        "Selection",
        "Select elements intersected by the rectangle.",
    ],
    [
        "Ctrl + Drag Right",
        "Selection",
        "Unselect elements fully inside the rectangle.",
    ],
    [
        "Ctrl + Drag Left",
        "Selection",
        "Unselect elements intersected by the rectangle.",
    ],
    ["C", "Visibility", "Clear hidden and isolated elements."],
    ["H", "Visibility", "Hide selected elements."],
    ["I", "Visibility", "Isolate selected elements."],
    ["P", "Clipping", "Create clipping plane by model intersection."],
] as const;

const apiGroups = [
    {
        name: "camera",
        methods: ["fitCamera()", "getIntersection(first?)"],
    },
    {
        name: "geometryUtils",
        methods: [
            "showAll()",
            "showByIds(ids)",
            "hideByIds(ids)",
            "hideSelected()",
            "isolateByIds(ids)",
            "isolateSelected()",
            "resetIsolation()",
            "getAllIds()",
            "getModelGeometry(modelID)",
            "getModelsGeometry()",
            "setIfcSpacesVisibility(visible)",
            "getIfcSpacesVisibility()",
            "toggleIIfcSpacesVisibility()",
        ],
    },
    {
        name: "selector",
        methods: [
            "setSelected(modelID, ids, reset?, setTarget?, fitTarget?)",
            "addSelected(modelID, ids, setTarget?, fitTarget?)",
            "removeSelected(modelID, ids)",
            "resetSelection(modelID?)",
            "getSelected()",
            "setSelectionColor(color)",
            "getSelectionColor()",
            "setPreselectionColor(color)",
            "getPreselectionColor()",
        ],
    },
    {
        name: "colors",
        methods: [
            "setColor(modelID, ids, color)",
            "rebuildByColors(colorsByModel, defaultColor?)",
            "rebuildModelByColors(modelID, colorsByIds, defaultColor?)",
            "clearColor(modelID, ids)",
            "clearModelColors(modelID)",
            "clearAllColors()",
        ],
    },
    {
        name: "converter",
        methods: [
            "convertToBmt(options?)",
            "convertIfcFileToBmt(files, options?)",
            "convertIfcFilesToBmtInWorker(files, options?)",
        ],
    },
    {
        name: "clipping",
        methods: [
            "createPlane()",
            "createClippingRectangle(selected?)",
            "toggle()",
            "setActive(active)",
            "setEdgesActive(active)",
            "setHelpersActive(active)",
            "deleteAllPlanes()",
        ],
    },
    {
        name: "dimensions",
        methods: [
            "setActive(active)",
            "toggle()",
            "cancelDrawing()",
            "changeAxes()",
            "delete()",
            "deleteAll()",
            "setUnit(unit)",
            "setColor(color)",
            "setWidth(width)",
            "setSnapDistance(distance)",
            "setEndpointScaleFactor(scale)",
            "getDimensions()",
        ],
    },
    {
        name: "properties",
        methods: [
            "getModelProps()",
            "getModelStructure()",
            "getAllLevels(recursive?)",
            "getAllModelLevels(modelID, recursive?)",
            "getParamsByElement(modelID, elementID)",
            "getParamValueByName(elementParams, paramName, setName?)",
            "getParamValueByElement(modelID, elementID, paramName, setName?)",
            "exportExcel(modelID, options?)",
            "exportAllExcel(options?)",
        ],
    },
    {
        name: "utils",
        methods: [
            "getUserDevice()",
            "getDefaultHotkeysEnabled()",
            "setDefaultHotkeysEnabled(enabled)",
            "toggleDefaultHotkeys()",
            "getShowStats()",
            "setShowStats(show)",
            "getShowNavCube()",
            "setShowNavCube(show)",
            "toggleShowNavCube()",
            "getShowGridAxes()",
            "setShowGridAxes(show)",
            "toggleShowGridAxes()",
            "getGridAxesVisibility()",
            "setGridAxesVisibility(visibility)",
            "setGridAxisVisibility(side, visible)",
        ],
    },
] as const;

type ApiGroup = (typeof apiGroups)[number];
type ApiGroupName = ApiGroup["name"];
type ApiSearchItem = {
    label: string;
    hash: string;
    keywords: string;
};
type DataTableRow = readonly [string, string, string];

const methodDescriptions: Record<string, string> = {
    addSelected:
        "Adds element ids to the current selection and can move or fit the camera target.",
    cancelDrawing: "Stops the active dimension drawing flow.",
    changeAxes: "Switches dimension drawing axes.",
    clearAllColors: "Removes all temporary element color overrides.",
    clearColor: "Clears temporary colors from specific element ids.",
    clearModelColors: "Clears all temporary colors in one model.",
    collector: "Creates a filtered element collector for property queries.",
    convertIfcFileToBmt: "Converts IFC files directly into BMT export files.",
    convertIfcFilesToBmtInWorker:
        "Converts IFC files to BMT in a Web Worker using the exported worker helper.",
    convertToBmt: "Exports currently loaded models to BMT.",
    createClippingRectangle:
        "Starts rectangular clipping creation. Pass true to build it from selected elements.",
    createPlane: "Creates a clipping plane.",
    delete: "Deletes the active dimension.",
    deleteAll: "Deletes all dimensions.",
    deleteAllPlanes: "Removes all clipping planes.",
    exportAllExcel: "Exports properties for all loaded models to Excel files.",
    exportExcel: "Exports one model properties table to Excel.",
    fitCamera: "Frames all visible model geometry in the camera.",
    getActive: "Returns whether the tool is active.",
    getAllIds: "Returns all known element ids from the geometry index.",
    getAllLevels: "Returns all structure levels grouped by model id.",
    getAllModelLevels: "Returns structure levels for one model.",
    getDefaultHotkeysEnabled: "Returns default hotkey state.",
    getDimensions: "Returns current dimension entities.",
    getEdgesActive: "Returns clipping edge visibility.",
    getGridAxesVisibility: "Returns grid axis visibility by side.",
    getHelpersActive: "Returns clipping helper visibility.",
    getIfcSpacesVisibility: "Returns IFC space mesh visibility.",
    getIntersection: "Returns raycast intersections under the pointer.",
    getModelGeometry:
        "Returns the Three.js group for one loaded model, or null if it is not found.",
    getModelProps: "Returns loaded model property dictionaries.",
    getModelsGeometry: "Returns Three.js groups for all loaded models.",
    getModelStructure: "Returns loaded model structure trees.",
    getParamsByElement: "Returns property data for one model element.",
    getParamValueByElement:
        "Returns one property value for an element by parameter and optional property set name.",
    getParamValueByName:
        "Returns one property value from element props by parameter and optional property set name.",
    getPlanes: "Returns current clipping planes.",
    getPreselectionColor: "Returns hover/preselection color.",
    getSelected: "Returns selected element ids grouped by model id.",
    getSelectionColor: "Returns selection highlight color.",
    getShowGridAxes: "Returns grid axes visibility.",
    getShowNavCube: "Returns navigation cube visibility.",
    getShowStats: "Returns stats overlay visibility.",
    getSnapDistance: "Returns dimension snap distance.",
    getUnit: "Returns dimension display unit.",
    getUserDevice: "Returns detected viewer device mode.",
    hideByIds: "Hides specific element ids.",
    hideSelected: "Hides the current selection.",
    isolateByIds: "Shows only specific element ids.",
    isolateSelected: "Shows only currently selected elements.",
    removeSelected: "Removes element ids from the current selection.",
    resetIsolation: "Clears hide and isolate state.",
    resetSelection: "Clears selection globally or for one model.",
    rebuildByColors:
        "Rebuilds color buffers for several models from color-to-element-id mappings.",
    rebuildModelByColors:
        "Rebuilds one model color buffer from color-to-element-id mappings.",
    setActive: "Enables or disables the tool.",
    setColor: "Sets color for dimensions or model elements.",
    setDefaultHotkeysEnabled: "Enables or disables built-in hotkeys.",
    setEdgesActive: "Shows or hides clipping section edges.",
    setEndpointScaleFactor: "Sets dimension endpoint visual scale.",
    setGridAxesVisibility: "Updates several grid axis visibility flags.",
    setGridAxisVisibility: "Updates one grid axis side visibility.",
    setHelpersActive: "Shows or hides clipping helpers.",
    setIfcSpacesVisibility: "Shows or hides IFC space meshes.",
    setPreselectionColor: "Sets hover/preselection color.",
    setSelected:
        "Replaces or updates selected element ids and can move or fit the camera target.",
    setSelectionColor: "Sets selection highlight color.",
    setShowGridAxes: "Shows or hides model grid axes.",
    setShowNavCube: "Shows or hides the navigation cube.",
    setShowStats: "Shows or hides the stats overlay.",
    setSnapDistance: "Sets dimension snap distance.",
    setUnit: "Sets dimension display unit.",
    setWidth: "Sets dimension line width.",
    showAll: "Shows all non-space model geometry again.",
    showByIds: "Shows specific element ids.",
    toggle: "Toggles the tool active state.",
    toggleDefaultHotkeys: "Toggles built-in hotkeys.",
    toggleIIfcSpacesVisibility: "Toggles IFC space mesh visibility.",
    toggleShowGridAxes: "Toggles grid axes visibility.",
    toggleShowNavCube: "Toggles navigation cube visibility.",
    updateEdges: "Refreshes clipping edge geometry.",
    updateMaterials: "Refreshes clipping material state.",
};

const apiGroupDescriptions: Record<ApiGroupName, string> = {
    camera: "Camera helpers for framing the model and reading pointer intersections.",
    clipping: "Plane and rectangular clipping controls.",
    colors: "Temporary element color overrides.",
    converter: "BMT export and direct IFC-to-BMT conversion.",
    dimensions: "Measurement drawing and dimension styling controls.",
    geometryUtils: "Visibility, isolation and IFC space mesh controls.",
    properties: "Access and export model metadata.",
    selector: "Selection state, colors and property-based element filtering.",
    utils: "Viewer UI switches, hotkeys and device helpers.",
};

function CodeBlock({ children }: { children: string }) {
    return <pre className="docs-code">{children}</pre>;
}

function DataTable({ rows }: { rows: readonly DataTableRow[] }) {
    return (
        <div className="docs-table" role="table">
            <div className="docs-table-row docs-table-head" role="row">
                <span>Name</span>
                <span>Type</span>
                <span>Notes</span>
            </div>
            {rows.map(([name, type, notes]) => (
                <div className="docs-table-row" key={name} role="row">
                    <code>{name}</code>
                    <code>{type}</code>
                    <span>{notes}</span>
                </div>
            ))}
        </div>
    );
}

function getSignatureParams(signature: string) {
    const params = signature.slice(
        signature.indexOf("(") + 1,
        signature.lastIndexOf(")"),
    );

    if (!params.trim()) return [];

    return params.split(",").map((param) => param.trim());
}

function getApiHashParts(hash = window.location.hash) {
    const match = hash.match(/^#api\/([^/]+)(?:\/([^/]+))?$/);

    if (!match) return null;

    return {
        groupName: decodeURIComponent(match[1]),
        blockName: match[2] ? decodeURIComponent(match[2]) : undefined,
    };
}

function getApiGroupFromHash(hash = window.location.hash) {
    const apiHashParts = getApiHashParts(hash);
    const legacyGroupMatch = hash.match(/^#api-([^-]+)/);
    const name = apiHashParts?.groupName ?? legacyGroupMatch?.[1];

    return apiGroups.find((group) => group.name === name) ?? null;
}

function getMethodName(signature: string) {
    return signature.slice(0, signature.indexOf("("));
}

function getMethodAnchor(groupName: ApiGroupName, signature: string) {
    const methodName = getMethodName(signature);

    return `api-${groupName}-${methodName.toLowerCase()}`;
}

function getApiGroupHash(groupName: ApiGroupName) {
    return `#api/${encodeURIComponent(groupName)}`;
}

function getMethodHash(groupName: ApiGroupName, signature: string) {
    return `${getApiGroupHash(groupName)}/${encodeURIComponent(
        getMethodName(signature),
    )}`;
}

function getApiExtraHash(groupName: ApiGroupName, blockName: string) {
    return `${getApiGroupHash(groupName)}/${encodeURIComponent(blockName)}`;
}

function getApiBlockAnchorFromHash(hash = window.location.hash) {
    const apiHashParts = getApiHashParts(hash);

    if (!apiHashParts?.blockName) {
        return hash.startsWith("#api-") ? hash.slice(1) : null;
    }

    const group = apiGroups.find(
        (apiGroup) => apiGroup.name === apiHashParts.groupName,
    );

    if (!group) return null;

    if (
        group.name === "selector" &&
        apiHashParts.blockName === "FilteredElementsCollector"
    ) {
        return "api-selector-filteredelementscollector";
    }

    if (
        group.name === "properties" &&
        apiHashParts.blockName === "ViewerPropertiesExcelOptions"
    ) {
        return "api-properties-excel-options";
    }

    const signature = group.methods.find(
        (method) =>
            getMethodName(method).toLowerCase() ===
            apiHashParts.blockName?.toLowerCase(),
    );

    return signature ? getMethodAnchor(group.name, signature) : null;
}

function getScrollAnchorFromHash(hash: string) {
    if (hash === "#api") return "api";

    const apiBlockAnchor = getApiBlockAnchorFromHash(hash);

    if (apiBlockAnchor) return apiBlockAnchor;
    if (hash.startsWith("#api/")) return null;

    return hash.match(/^#([A-Za-z0-9_-]+)$/)?.[1] ?? null;
}

function scrollToDocsTarget(hash: string) {
    const anchor = getScrollAnchorFromHash(hash);

    if (anchor) {
        document.getElementById(anchor)?.scrollIntoView({ block: "start" });
        return;
    }

    if (getApiGroupFromHash(hash)) {
        document
            .querySelector<HTMLElement>(".docs-content")
            ?.scrollTo({ top: 0 });
    }
}

function normalizeSearchText(value: string) {
    return value.trim().toLowerCase();
}

function getApiSearchItems(): ApiSearchItem[] {
    const items: ApiSearchItem[] = [
        {
            label: "Install",
            hash: "#install",
            keywords: "install npm package setup",
        },
        {
            label: "Viewer component",
            hash: "#viewer",
            keywords: "viewer component props modelUrls modelSources",
        },
        {
            label: "Loader API",
            hash: "#loader",
            keywords: "loader api loadModel model loading",
        },
        {
            label: "Worker streaming",
            hash: "#worker",
            keywords: "worker streaming chunk progress useWorker",
        },
        {
            label: "Performance Mode",
            hash: "#performance-mode",
            keywords:
                "performance mode performanceMode materialMode useDoubleSideMaterial fps gpu double side material",
        },
        {
            label: "BMT Convertor",
            hash: "#bmt-convertor",
            keywords:
                "bmt convertor converter export convert ifc bmt worker convertIfcFilesToBmtInWorker",
        },
        {
            label: "convertIfcFilesToBmtInWorker",
            hash: "#bmt-convertor",
            keywords:
                "converter worker ifc bmt convertIfcFilesToBmtInWorker onProgress chunk maxMeshBytes wasmPath",
        },
        {
            label: "Hotkeys",
            hash: "#hotkeys",
            keywords:
                "hotkeys shortcuts keyboard selection visibility clipping shift ctrl drag click hide isolate clipping plane",
        },
        {
            label: "ViewerApi overview",
            hash: "#api",
            keywords: "viewerapi reference overview api",
        },
    ];

    apiGroups.forEach((group) => {
        items.push({
            label: group.name,
            hash: getApiGroupHash(group.name),
            keywords: `${group.name} ${apiGroupDescriptions[group.name]}`,
        });

        group.methods.forEach((method) => {
            const methodName = getMethodName(method);

            items.push({
                label: `${group.name}.${methodName}`,
                hash: getMethodHash(group.name, method),
                keywords: [
                    group.name,
                    methodName,
                    method,
                    methodDescriptions[methodName],
                ]
                    .filter(Boolean)
                    .join(" "),
            });
        });
    });

    items.push(
        {
            label: "selector.FilteredElementsCollector",
            hash: getApiExtraHash("selector", "FilteredElementsCollector"),
            keywords:
                "selector collector filtered elements FilteredElementsCollector ofType ofModel ofLevel where toElements toElementIds",
        },
        {
            label: "properties.ViewerPropertiesExcelOptions",
            hash: getApiExtraHash("properties", "ViewerPropertiesExcelOptions"),
            keywords:
                "properties excel options ViewerPropertiesExcelOptions exportExcel exportAllExcel fileName modelName emptyValue",
        },
    );

    return items;
}

function findApiSearchItem(query: string, items: readonly ApiSearchItem[]) {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) return null;

    return (
        items.find(
            (item) => normalizeSearchText(item.label) === normalizedQuery,
        ) ??
        items.find((item) => {
            const methodName = item.label.split(".").at(-1) ?? item.label;

            return normalizeSearchText(methodName) === normalizedQuery;
        }) ??
        items.find((item) =>
            normalizeSearchText(`${item.label} ${item.keywords}`).includes(
                normalizedQuery,
            ),
        ) ??
        null
    );
}

function getApiSearchScore(query: string, item: ApiSearchItem) {
    const label = normalizeSearchText(item.label);
    const searchableText = normalizeSearchText(
        `${item.label} ${item.keywords}`,
    );

    if (label === query) return 0;
    if (label.endsWith(`.${query}`)) return 1;
    if (label.startsWith(query)) return 2;
    if (label.includes(query)) return 3;
    if (searchableText.includes(query)) return 4;

    return -1;
}

function getApiSearchSuggestions(
    query: string,
    items: readonly ApiSearchItem[],
) {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) return [];

    return items
        .map((item) => ({
            item,
            score: getApiSearchScore(normalizedQuery, item),
        }))
        .filter(({ score }) => score >= 0)
        .sort((first, second) => first.score - second.score)
        .slice(0, 8)
        .map(({ item }) => item);
}

function getParameterInfo(
    param: string,
    groupName?: ApiGroupName,
    methodName?: string,
): DataTableRow {
    const name = param.replace("?", "");
    const optional = param.endsWith("?");

    const optionalSuffix = optional ? " Optional." : "";
    const descriptions: Record<string, DataTableRow> = {
        active: [
            param,
            "boolean",
            `Whether the tool should be active.${optionalSuffix}`,
        ],
        color: [
            param,
            "ColorRepresentation",
            `CSS color string, number or Three.js color value.${optionalSuffix}`,
        ],
        colorsByIds: [
            param,
            "ViewerModelColorConfig",
            `Map of color values to element id arrays for one model.${optionalSuffix}`,
        ],
        colorsByModel: [
            param,
            "ViewerColorConfigByModel",
            `Map of model ids to per-model color configs.${optionalSuffix}`,
        ],
        defaultColor: [
            param,
            "ColorRepresentation",
            `Fallback color for elements not matched by the color map.${optionalSuffix}`,
        ],
        distance: [
            param,
            "number",
            `Snap distance in model units.${optionalSuffix}`,
        ],
        elementID: [
            param,
            "number",
            `Element id inside the target model.${optionalSuffix}`,
        ],
        elementParams: [
            param,
            "BmtElementProps | null | undefined",
            `Property object for one element.${optionalSuffix}`,
        ],
        enabled: [
            param,
            "boolean",
            `Whether the built-in hotkeys should be enabled.${optionalSuffix}`,
        ],
        files: [
            param,
            "File[] | FileList",
            `IFC files selected by the user or provided by the app.${optionalSuffix}`,
        ],
        first: [
            param,
            "boolean",
            `When true, returns only the first intersection.${optionalSuffix}`,
        ],
        fitTarget: [
            param,
            "boolean",
            `When true, fits the camera to the selection target.${optionalSuffix}`,
        ],
        ids: [
            param,
            "number[]",
            `Element ids inside the target model.${optionalSuffix}`,
        ],
        modelID: [
            param,
            "number",
            `Numeric model id from the loaded models map.${optionalSuffix}`,
        ],
        options: [
            param,
            groupName === "properties"
                ? "ViewerPropertiesExcelOptions"
                : methodName === "convertIfcFilesToBmtInWorker"
                  ? "BmtConverterWorkerClientOptions"
                : "ViewerBmtConverterOptions",
            `Export options.${optionalSuffix}`,
        ],
        paramName: [
            param,
            "string",
            `Property parameter name to read.${optionalSuffix}`,
        ],
        recursive: [
            param,
            "boolean",
            `When true, includes nested structure levels.${optionalSuffix}`,
        ],
        reset: [
            param,
            "boolean",
            `When true, replaces previous selection before setting ids.${optionalSuffix}`,
        ],
        scale: [
            param,
            "number",
            `Dimension endpoint visual scale factor.${optionalSuffix}`,
        ],
        selected: [
            param,
            "boolean",
            `When true, creates the tool from selected elements.${optionalSuffix}`,
        ],
        setTarget: [
            param,
            "boolean",
            `When true, moves the camera target to the selection.${optionalSuffix}`,
        ],
        setName: [
            param,
            "string",
            `Optional property set name used to narrow the lookup.${optionalSuffix}`,
        ],
        show: [
            param,
            "boolean",
            `Whether the UI layer is visible.${optionalSuffix}`,
        ],
        side: [
            param,
            '"top" | "right" | "bottom" | "left"',
            `Grid axis side to update.${optionalSuffix}`,
        ],
        unit: [param, '"m" | "mm"', `Dimension display unit.${optionalSuffix}`],
        visibility: [
            param,
            "Partial<ViewerGridAxesVisibility>",
            `Visibility flags for one or more grid axes.${optionalSuffix}`,
        ],
        visible: [
            param,
            "boolean",
            `Whether the target geometry layer should be visible.${optionalSuffix}`,
        ],
        width: [param, "number", `Dimension line width.${optionalSuffix}`],
    };

    return (
        descriptions[name] ?? [
            param,
            "unknown",
            `Value passed to the method.${optionalSuffix}`,
        ]
    );
}

function getMethodParameterRows(signature: string, groupName: ApiGroupName) {
    const methodName = getMethodName(signature);

    return getSignatureParams(signature).map((param) =>
        getParameterInfo(param, groupName, methodName),
    );
}

function getSampleArg(param: string) {
    const normalized = param.replace("?", "").trim().toLowerCase();

    if (normalized === "active") return "true";
    if (normalized === "color") return '"#ff3355"';
    if (normalized === "colorsbyids") return '{ "#ff3355": [1, 2, 3] }';
    if (normalized === "colorsbymodel") {
        return '{ 0: { "#ff3355": [1, 2, 3] } }';
    }
    if (normalized === "defaultcolor") return '"#d1d5db"';
    if (normalized === "distance") return "1";
    if (normalized === "elementid") return "1";
    if (normalized === "elementparams") return "element.props";
    if (normalized === "enabled") return "false";
    if (normalized === "files") return "files";
    if (normalized === "first") return "true";
    if (normalized === "fittarget") return "true";
    if (normalized === "ids") return "[1, 2, 3]";
    if (normalized === "modelid") return "0";
    if (normalized === "options") {
        return "{ activeView: true, useMinVersion: true }";
    }
    if (normalized === "paramname") return '"System Name"';
    if (normalized === "recursive") return "true";
    if (normalized === "reset") return "true";
    if (normalized === "scale") return "0.015";
    if (normalized === "selected") return "true";
    if (normalized === "setname") return '"Mechanical"';
    if (normalized === "settarget") return "true";
    if (normalized === "show") return "true";
    if (normalized === "side") return '"left"';
    if (normalized === "unit") return '"mm"';
    if (normalized === "visibility") return "{ top: false, bottom: true }";
    if (normalized === "visible") return "true";
    if (normalized === "width") return "1";

    return normalized || "";
}

function getMethodExample(groupName: ApiGroupName, signature: string) {
    const methodName = getMethodName(signature);
    const params = signature
        .slice(signature.indexOf("(") + 1, signature.lastIndexOf(")"))
        .split(",")
        .map((param) => param.trim())
        .filter(Boolean)
        .map(getSampleArg)
        .join(", ");

    if (groupName === "converter" && methodName === "convertIfcFileToBmt") {
        return `await viewerRef.current?.converter.convertIfcFileToBmt(files, {
    fileName: "converted-ifc",
    useMinVersion: true,
});`;
    }

    if (
        groupName === "converter" &&
        methodName === "convertIfcFilesToBmtInWorker"
    ) {
        return converterWorkerCode;
    }

    if (groupName === "geometryUtils") {
        if (methodName === "getModelGeometry") {
            return `const modelGroup = viewerRef.current?.geometryUtils.getModelGeometry(0);

modelGroup?.traverse((object) => {
    console.log(object.name, object.userData);
});`;
        }

        if (methodName === "getModelsGeometry") {
            return `const modelGroups = viewerRef.current?.geometryUtils.getModelsGeometry() ?? [];

modelGroups.forEach((group) => {
    console.log(group.userData.modelID, group.children.length);
});`;
        }
    }

    if (groupName === "colors") {
        if (methodName === "rebuildByColors") {
            return `viewerRef.current?.colors.rebuildByColors(
    {
        0: {
            "#ff3355": [1, 2, 3],
            "#22c55e": [4, 5],
        },
    },
    "#d1d5db",
);`;
        }

        if (methodName === "rebuildModelByColors") {
            return colorRebuildByPropertiesCode;
        }
    }

    if (groupName === "properties") {
        if (methodName === "getParamsByElement") {
            return `const params = viewerRef.current?.properties.getParamsByElement(0, 1);`;
        }

        if (methodName === "getParamValueByName") {
            return `const params = viewerRef.current?.properties.getParamsByElement(0, 1);

const systemName = viewerRef.current?.properties.getParamValueByName(
    params,
    "System Name",
    "Mechanical",
);`;
        }

        if (methodName === "getParamValueByElement") {
            return `const systemName = viewerRef.current?.properties.getParamValueByElement(
    0,
    1,
    "System Name",
    "Mechanical",
);`;
        }

        if (methodName === "exportExcel") {
            return `viewerRef.current?.properties.exportExcel(0, {
    fileName: "model-properties",
    emptyValue: "-",
});`;
        }

        if (methodName === "exportAllExcel") {
            return `viewerRef.current?.properties.exportAllExcel({
    emptyValue: "-",
});`;
        }
    }

    if (groupName === "selector") {
        if (methodName === "setSelected") {
            return `viewerRef.current?.selector.setSelected(
    0,
    [1, 2, 3],
    true,
    true,
    true,
);`;
        }

        if (methodName === "addSelected") {
            return `viewerRef.current?.selector.addSelected(
    0,
    [4, 5],
    true,
    false,
);`;
        }
    }

    if (groupName === "clipping" && methodName === "createClippingRectangle") {
        return `viewerRef.current?.clipping.createClippingRectangle(true);`;
    }

    return `viewerRef.current?.${groupName}.${methodName}(${params});`;
}

function ApiGroupExtra({ groupName }: { groupName: ApiGroupName }) {
    if (groupName === "selector") {
        return (
            <section
                className="docs-method"
                id="api-selector-filteredelementscollector"
            >
                <h2>
                    <code>FilteredElementsCollector</code>
                </h2>
                <p>
                    <code>selector.collector()</code> returns a chainable
                    collector. It can filter by{" "}
                    <code>ViewerModelLevel</code> from the properties API; omit{" "}
                    <code>ofType()</code> when you want all classes.
                    The demo GUI's <code>allClasses</code> option uses this
                    same pattern.
                </p>
                <CodeBlock>{selectorCollectorCode}</CodeBlock>
                <CodeBlock>{selectorCollectorAllClassesCode}</CodeBlock>
                <DataTable rows={selectorCollectorMethods} />
            </section>
        );
    }

    if (groupName === "properties") {
        return (
            <section className="docs-method" id="api-properties-excel-options">
                <h2>
                    <code>ViewerPropertiesExcelOptions</code>
                </h2>
                <p>
                    Pass these options to <code>exportExcel</code> and{" "}
                    <code>exportAllExcel</code>.
                </p>
                <DataTable rows={propertiesExcelOptions} />
            </section>
        );
    }

    return null;
}

function ApiGroupDetail({ group }: { group: ApiGroup }) {
    return (
        <section className="docs-hero">
            <a className="docs-back-link" href="#api">
                Back to ViewerApi Reference
            </a>
            <p className="docs-kicker">ViewerApi</p>
            <h1>{group.name}</h1>
            <p>{apiGroupDescriptions[group.name]}</p>
            <div className="docs-method-list">
                {group.methods.map((signature) => {
                    const methodName = getMethodName(signature);
                    const parameterRows = getMethodParameterRows(
                        signature,
                        group.name,
                    );

                    return (
                        <section
                            className="docs-method"
                            id={getMethodAnchor(group.name, signature)}
                            key={signature}
                        >
                            <h2>
                                <code>{signature}</code>
                            </h2>
                            <p>
                                {methodDescriptions[methodName] ??
                                    "Calls the viewer API method."}
                            </p>
                            <CodeBlock>
                                {getMethodExample(group.name, signature)}
                            </CodeBlock>
                            {group.name === "converter" &&
                                methodName ===
                                    "convertIfcFilesToBmtInWorker" && (
                                    <DataTable
                                        rows={converterWorkerOptions}
                                    />
                                )}
                            {parameterRows.length > 0 && (
                                <DataTable rows={parameterRows} />
                            )}
                        </section>
                    );
                })}
                <ApiGroupExtra groupName={group.name} />
            </div>
        </section>
    );
}

export function ApiDocs() {
    const [activeApiGroup, setActiveApiGroup] = useState<ApiGroup | null>(
        getApiGroupFromHash,
    );
    const [apiHash, setApiHash] = useState(() => window.location.hash);
    const [apiSearchQuery, setApiSearchQuery] = useState("");
    const [isApiSearchOpen, setIsApiSearchOpen] = useState(false);
    const docsHref = `${import.meta.env.BASE_URL}api`;
    const apiSearchItems = useMemo(() => getApiSearchItems(), []);
    const apiSearchSuggestions = useMemo(
        () => getApiSearchSuggestions(apiSearchQuery, apiSearchItems),
        [apiSearchItems, apiSearchQuery],
    );
    const showApiSearchSuggestions =
        isApiSearchOpen && apiSearchSuggestions.length > 0;
    const apiSidebarLinks = useMemo(
        () =>
            apiGroups.map((group) => (
                <details className="docs-sidebar-methods" key={group.name}>
                    <summary>{group.name}</summary>
                    <div className="docs-sidebar-method-list">
                        <a href={getApiGroupHash(group.name)}>Overview</a>
                        {group.methods.map((method) => (
                            <a
                                href={getMethodHash(group.name, method)}
                                key={method}
                            >
                                {getMethodName(method)}
                            </a>
                        ))}
                        {group.name === "selector" && (
                            <a
                                href={getApiExtraHash(
                                    group.name,
                                    "FilteredElementsCollector",
                                )}
                            >
                                FilteredElementsCollector
                            </a>
                        )}
                        {group.name === "properties" && (
                            <a
                                href={getApiExtraHash(
                                    group.name,
                                    "ViewerPropertiesExcelOptions",
                                )}
                            >
                                ViewerPropertiesExcelOptions
                            </a>
                        )}
                    </div>
                </details>
            )),
        [],
    );

    useEffect(() => {
        const onHashChange = () => {
            const nextHash = window.location.hash;

            setApiHash(nextHash);
            setActiveApiGroup(getApiGroupFromHash(nextHash));
        };

        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            scrollToDocsTarget(apiHash);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [activeApiGroup, apiHash]);

    const navigateToApiHash = (hash: string) => {
        if (window.location.hash === hash) {
            window.requestAnimationFrame(() => scrollToDocsTarget(hash));
            return;
        }

        window.location.assign(hash);
    };

    const selectApiSearchItem = (searchItem: ApiSearchItem) => {
        setApiSearchQuery(searchItem.label);
        setIsApiSearchOpen(false);
        navigateToApiHash(searchItem.hash);
    };

    const handleApiSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const searchItem = findApiSearchItem(apiSearchQuery, apiSearchItems);

        if (!searchItem) return;

        selectApiSearchItem(searchItem);
    };

    const clearApiSearch = () => {
        setApiSearchQuery("");
        setIsApiSearchOpen(false);
    };

    return (
        <div className="docs-page">
            <header className="docs-topbar">
                <a className="docs-brand" href={docsHref}>
                    bimatter-viewer-react
                </a>
                <form
                    className="docs-search"
                    onSubmit={handleApiSearchSubmit}
                    role="search"
                >
                    <div className="docs-search-field">
                        <span aria-hidden="true" className="docs-search-icon" />
                        <input
                            aria-autocomplete="list"
                            aria-controls="api-docs-search-results"
                            aria-expanded={showApiSearchSuggestions}
                            aria-label="Search API documentation"
                            onBlur={() => setIsApiSearchOpen(false)}
                            onChange={(event) => {
                                setApiSearchQuery(event.target.value);
                                setIsApiSearchOpen(true);
                            }}
                            onFocus={() => setIsApiSearchOpen(true)}
                            placeholder="Search API, e.g. selector.getSelected"
                            type="text"
                            value={apiSearchQuery}
                        />
                        {apiSearchQuery && (
                            <button
                                aria-label="Clear API search"
                                className="docs-search-clear"
                                onClick={clearApiSearch}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    clearApiSearch();
                                }}
                                type="button"
                            />
                        )}
                        {showApiSearchSuggestions && (
                            <div
                                className="docs-search-results"
                                id="api-docs-search-results"
                                role="listbox"
                            >
                                {apiSearchSuggestions.map((item) => (
                                    <button
                                        className="docs-search-result"
                                        key={`${item.hash}-${item.label}`}
                                        onClick={() =>
                                            selectApiSearchItem(item)
                                        }
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            selectApiSearchItem(item);
                                        }}
                                        role="option"
                                        type="button"
                                    >
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="docs-search-submit" type="submit">
                        Go
                    </button>
                </form>
                <nav className="docs-nav" aria-label="Documentation navigation">
                    <a
                        href="https://rkaeplive.github.io/bimatter-viewer-react/"
                        rel="noreferrer"
                        target="_blank"
                    >
                        Demo
                    </a>
                    <a
                        href="https://bimatter.ru/"
                        rel="noreferrer"
                        target="_blank"
                    >
                        Website
                    </a>
                    <a
                        href="https://github.com/rkaeplive/bimatter-viewer-react"
                        rel="noreferrer"
                        target="_blank"
                    >
                        GitHub
                    </a>
                </nav>
            </header>

            <div className="docs-layout">
                <aside className="docs-sidebar">
                    <a href="#install">Install</a>
                    <a href="#viewer">Viewer component</a>
                    <a href="#loader">Loader API</a>
                    <a href="#worker">Worker streaming</a>
                    <a href="#performance-mode">Performance mode</a>
                    <a href="#bmt-convertor">BMT Convertor</a>
                    <a href="#hotkeys">Hotkeys</a>
                    <details className="docs-sidebar-group" open>
                        <summary>ViewerApi</summary>
                        <a href="#api">Overview</a>
                        {apiSidebarLinks}
                    </details>
                </aside>

                <main className="docs-content">
                    {activeApiGroup ? (
                        <ApiGroupDetail group={activeApiGroup} />
                    ) : (
                        <>
                            <section className="docs-hero" id="install">
                                <p className="docs-kicker">API documentation</p>
                                <h1>BMT and IFC viewer for React</h1>
                                <p>
                                    Load BIM models, render them with React
                                    Three Fiber, inspect IFC properties, control
                                    selection and export visible model data back
                                    to BMT.
                                </p>
                                <CodeBlock>{installCode}</CodeBlock>
                            </section>

                            <section className="docs-section" id="viewer">
                                <h2>Viewer Component</h2>
                                <p>
                                    The quickest path is to put model files in
                                    your public folder and pass their URLs to
                                    the viewer.
                                </p>
                                <CodeBlock>{basicUsageCode}</CodeBlock>
                                <DataTable rows={viewerProps} />
                            </section>

                            <section className="docs-section" id="loader">
                                <h2>Loader API</h2>
                                <p>
                                    Use the loader when your app owns model
                                    state, file uploads, progress UI or
                                    progressive worker rendering.
                                </p>
                                <CodeBlock>{controlledLoaderCode}</CodeBlock>
                                <DataTable rows={loaderOptions} />
                            </section>

                            <section className="docs-section" id="worker">
                                <h2>Worker Streaming</h2>
                                <p>
                                    Worker loading parses large BMT and IFC
                                    files outside the main thread. IFC uses{" "}
                                    <code>ifc-parser.wasm</code> from your
                                    public folder unless <code>wasmPath</code>{" "}
                                    is provided.
                                </p>
                                <CodeBlock>{workerCode}</CodeBlock>
                            </section>

                            <section
                                className="docs-section"
                                id="performance-mode"
                            >
                                <h2>Performance Mode</h2>
                                <p>
                                    Use <code>performanceMode</code> on{" "}
                                    <code>Viewer</code> for heavy scenes. It
                                    lowers expensive canvas settings and uses{" "}
                                    <code>materialMode="performance"</code>{" "}
                                    unless you pass another material mode. The
                                    loader can also store{" "}
                                    <code>materialMode</code> and{" "}
                                    <code>useDoubleSideMaterial</code> in model
                                    render settings.
                                </p>
                                <CodeBlock>{performanceCode}</CodeBlock>
                            </section>

                            <section
                                className="docs-section"
                                id="bmt-convertor"
                            >
                                <h2>BMT Convertor</h2>
                                <p>
                                    Export loaded models to BMT or convert IFC
                                    files directly. With <code>activeView</code>
                                    , hidden and isolated elements are
                                    respected. Use{" "}
                                    <code>
                                        convertIfcFilesToBmtInWorker()
                                    </code>{" "}
                                    for IFC-to-BMT conversion outside the main
                                    thread.
                                </p>
                                <CodeBlock>{converterCode}</CodeBlock>
                                <CodeBlock>{converterWorkerCode}</CodeBlock>
                                <DataTable rows={converterWorkerOptions} />
                            </section>

                            <section className="docs-section" id="hotkeys">
                                <h2>Hotkeys</h2>
                                <p>
                                    Built-in viewer shortcuts can be disabled
                                    with{" "}
                                    <code>
                                        utils.setDefaultHotkeysEnabled(false)
                                    </code>
                                    .
                                </p>
                                <DataTable rows={hotkeyRows} />
                            </section>

                            <section className="docs-section" id="api">
                                <h2>ViewerApi Reference</h2>
                                <p>
                                    Pass a React ref to <code>Viewer</code> to
                                    control the scene, selection, colors,
                                    clipping and exports. Click a group to open
                                    its method examples.
                                </p>
                                <CodeBlock>{refCode}</CodeBlock>
                                <div className="docs-api-grid">
                                    {apiGroups.map((group) => (
                                        <a
                                            className="docs-api-group"
                                            href={`#api/${group.name}`}
                                            key={group.name}
                                        >
                                            <h3>{group.name}</h3>
                                            <ul>
                                                {group.methods.map((method) => (
                                                    <li key={method}>
                                                        <code>{method}</code>
                                                    </li>
                                                ))}
                                            </ul>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
