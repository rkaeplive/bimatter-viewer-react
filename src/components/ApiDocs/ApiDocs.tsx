import { useEffect, useMemo, useState } from "react";

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
            .loadModel(["/models/architecture.bmt", "/models/structure.ifc"], {
                useIfcSpace: true,
            })
            .then(setModelsData);
    }, []);

    return <Viewer modelsData={modelsData} />;
}`;

const workerCode = `await loader.loadModel(["/models/model.ifc"], {
    chunk: 500,
    collectWorkerChunks: false,
    useIfcSpace: true,
    useWorker: true,
    onChunk: (chunk) => {
        // Add chunk.geometry to your progressive render state.
    },
    onProgress: (event) => {
        console.log(event.phase, Math.round(event.progress * 100));
    },
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
    useIfcSpace: true,
    useMinVersion: true,
});`;

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
        "selected",
        "ViewerSelection",
        "Controlled selected element ids by model id.",
    ],
    ["defaultSelected", "ViewerSelection", "Initial uncontrolled selection."],
    ["onSelectedChange", "(selected) => void", "Selection change callback."],
    ["onReady", "(api) => void", "Receives ViewerApi when scene API is ready."],
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
    ["useIfcSpace", "boolean", "Include IFCSPACE geometry."],
    ["wasmPath", "string", "Custom ifc-parser.wasm URL."],
    ["chunk", "number", "IFC geometries per streamed chunk."],
    [
        "maxMeshBytes",
        "number",
        "Maximum IFC mesh buffer size before splitting.",
    ],
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
            "setIfcSpacesVisibility(visible)",
            "getIfcSpacesVisibility()",
            "toggleIIfcSpacesVisibility()",
        ],
    },
    {
        name: "selector",
        methods: [
            "setSelected(modelID, ids, reset?)",
            "addSelected(modelID, ids)",
            "removeSelected(modelID, ids)",
            "resetSelection(modelID?)",
            "getSelected()",
            "collector()",
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
        ],
    },
    {
        name: "clipping",
        methods: [
            "createPlane()",
            "createClippingRectangle()",
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
            "exportExcel(modelID)",
            "exportAllExcel()",
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
type DataTableRow = readonly [string, string, string];

const methodDescriptions: Record<string, string> = {
    addSelected: "Adds element ids to the current selection.",
    cancelDrawing: "Stops the active dimension drawing flow.",
    changeAxes: "Switches dimension drawing axes.",
    clearAllColors: "Removes all temporary element color overrides.",
    clearColor: "Clears temporary colors from specific element ids.",
    clearModelColors: "Clears all temporary colors in one model.",
    collector: "Creates a filtered element collector for property queries.",
    convertIfcFileToBmt: "Converts IFC files directly into BMT export files.",
    convertToBmt: "Exports currently loaded models to BMT.",
    createClippingRectangle: "Starts rectangular clipping creation.",
    createPlane: "Creates a clipping plane.",
    delete: "Deletes the active dimension.",
    deleteAll: "Deletes all dimensions.",
    deleteAllPlanes: "Removes all clipping planes.",
    exportAllExcel: "Exports properties for all loaded models to Excel files.",
    exportExcel: "Exports one model properties table to Excel.",
    fitCamera: "Frames all visible model geometry in the camera.",
    getActive: "Returns whether the tool is active.",
    getAllIds: "Returns all known element ids from the geometry index.",
    getDefaultHotkeysEnabled: "Returns default hotkey state.",
    getDimensions: "Returns current dimension entities.",
    getEdgesActive: "Returns clipping edge visibility.",
    getGridAxesVisibility: "Returns grid axis visibility by side.",
    getHelpersActive: "Returns clipping helper visibility.",
    getIfcSpacesVisibility: "Returns IFC space mesh visibility.",
    getIntersection: "Returns raycast intersections under the pointer.",
    getModelProps: "Returns loaded model property dictionaries.",
    getModelStructure: "Returns loaded model structure trees.",
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
    setSelected: "Replaces or updates selected element ids.",
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

function getApiGroupFromHash() {
    const match = window.location.hash.match(/^#api\/([^/]+)$/);
    const name = match?.[1];

    return apiGroups.find((group) => group.name === name) ?? null;
}

function getMethodName(signature: string) {
    return signature.slice(0, signature.indexOf("("));
}

function getParameterInfo(param: string): DataTableRow {
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
        distance: [
            param,
            "number",
            `Snap distance in model units.${optionalSuffix}`,
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
            "ViewerBmtConverterOptions",
            `BMT export or IFC conversion options.${optionalSuffix}`,
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

function getMethodParameterRows(signature: string) {
    return getSignatureParams(signature).map(getParameterInfo);
}

function getSampleArg(param: string) {
    const normalized = param.replace("?", "").trim().toLowerCase();

    if (normalized === "active") return "true";
    if (normalized === "color") return '"#ff3355"';
    if (normalized === "distance") return "1";
    if (normalized === "enabled") return "false";
    if (normalized === "files") return "files";
    if (normalized === "first") return "true";
    if (normalized === "ids") return "[1, 2, 3]";
    if (normalized === "modelid") return "0";
    if (normalized === "options") {
        return "{ activeView: true, useMinVersion: true }";
    }
    if (normalized === "reset") return "true";
    if (normalized === "scale") return "0.015";
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
    useIfcSpace: true,
    useMinVersion: true,
});`;
    }

    return `viewerRef.current?.${groupName}.${methodName}(${params});`;
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
                    const parameterRows = getMethodParameterRows(signature);

                    return (
                        <section className="docs-method" key={signature}>
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
                            {parameterRows.length > 0 && (
                                <DataTable rows={parameterRows} />
                            )}
                        </section>
                    );
                })}
            </div>
        </section>
    );
}

export function ApiDocs() {
    const [activeApiGroup, setActiveApiGroup] = useState<ApiGroup | null>(
        getApiGroupFromHash,
    );
    const docsHref = `${import.meta.env.BASE_URL}api`;
    const apiSidebarLinks = useMemo(
        () =>
            apiGroups.map((group) => (
                <a href={`#api/${group.name}`} key={group.name}>
                    {group.name}
                </a>
            )),
        [],
    );

    useEffect(() => {
        const onHashChange = () => setActiveApiGroup(getApiGroupFromHash());

        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    return (
        <div className="docs-page">
            <header className="docs-topbar">
                <a className="docs-brand" href={docsHref}>
                    bimatter-viewer-react
                </a>
                <nav className="docs-nav" aria-label="Documentation navigation">
                    <a
                        href="https://rkaeplive.github.io/bimatter-viewer-react/"
                        rel="noreferrer"
                        target="_blank"
                    >
                        Demo
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
                    <a href="#bmt-convertor">BMT Convertor</a>
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
                                id="bmt-convertor"
                            >
                                <h2>BMT Convertor</h2>
                                <p>
                                    Export loaded models to BMT or convert IFC
                                    files directly. With <code>activeView</code>
                                    , hidden and isolated elements are
                                    respected.
                                </p>
                                <CodeBlock>{converterCode}</CodeBlock>
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
