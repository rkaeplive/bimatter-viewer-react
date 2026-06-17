import { useEffect, useRef } from "react";
import GUI, { type Controller } from "lil-gui";
import type {
    BmtElementProps,
    BmtPropertySet,
    BmtPropertyValue,
    IfcClass,
    ViewerApi,
    ViewerLoadedModels,
    ViewerMaterialMode,
    ViewerModelLevel,
    ViewerPlanHandle,
    ViewerPostproductionPassType,
    ViewerSelection,
    ViewerUploadMode,
} from "bimatter-viewer-react";

type ViewerApiGuiOptions = {
    api: ViewerApi | null;
    materialMode?: ViewerMaterialMode;
    modelsData?: ViewerLoadedModels;
    onMaterialModeChange?: (materialMode: ViewerMaterialMode) => void;
    onPerformanceModeChange?: (performanceMode: boolean) => void;
    onUploadModeChange?: (uploadMode: ViewerUploadMode) => void;
    onShowIfcSpacesChange?: (showIfcSpaces: boolean) => void;
    onCameraTypeChange?: (cameraType: "orthographic" | "perspective") => void;
    onUseDoubleSideMaterialChange?: (useDoubleSideMaterial: boolean) => void;
    onUseIfcSpaceChange?: (useIfcSpace: boolean) => void;
    onUsePerformanceMovingChange?: (usePerformanceMoving: boolean) => void;
    onUseWebGPUChange?: (useWebGPU: boolean) => void;
    performanceMode?: boolean;
    selected: ViewerSelection;
    showIfcSpaces?: boolean;
    uploadMode?: ViewerUploadMode;
    useDoubleSideMaterial?: boolean;
    useIfcSpace?: boolean;
    usePerformanceMoving?: boolean;
    useWebGPU?: boolean;
    viewerContainerRef?: {
        current: HTMLElement | null;
    };
};

type ViewerFirstPersonControlSettings = {
    eyeHeight?: number;
    groundCheckInterval?: number;
    groundSnapDistanceRatio?: number;
    lookSensitivity?: number;
    speed?: number;
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

type GeometryUtilsParams = {
    trueNorthEnabled: boolean;
};

type PlansParams = {
    createPlan: () => void;
    planeIndex: number;
};

type CollectorParams = {
    collect: () => void;
    ifcClass: CollectorIfcClass;
    loadProperties: () => void;
    levelKey: string;
    modelID: number;
    propertyName: string;
    propertyOperator: CollectorPropertyOperator;
    propertyValue: string;
    selectByProperty: () => void;
};

type UtilsParams = {
    defaultHotkeysEnabled: boolean;
    gridBottom: boolean;
    gridLeft: boolean;
    gridRight: boolean;
    gridTop: boolean;
    preselectionEnabled: boolean;
    showGridAxes: boolean;
    showNavCube: boolean;
    showStats: boolean;
};

type SpacesParams = {
    showIfcSpaces: boolean;
    useIfcSpace: boolean;
};
type CameraParams = {
    cameraType: "orthographic" | "perspective";
    eyeHeight: number;
    firstPersonControlActive: boolean;
    groundCheckInterval: number;
    groundSnapDistanceRatio: number;
    lookSensitivity: number;
    speed: number;
};
type PerformanceParams = {
    materialMode: ViewerMaterialMode;
    performanceMode: boolean;
    uploadMode: ViewerUploadMode;
    useDoubleSideMaterial: boolean;
    usePerformanceMoving: boolean;
    useWebGPU: boolean;
};

type PostproductionPassFilterOption = "N8AO" | "SSAO" | "null";
type N8AOQuality = "low" | "medium" | "high";

type PostproductionParams = {
    ambientLightColor: string;
    ambientLightIntensity: number;
    directionalLightColor: string;
    directionalLightIntensity: number;
    n8aoAoRadius: number;
    n8aoIntensity: number;
    n8aoQuality: N8AOQuality;
    passFilter: PostproductionPassFilterOption;
    saturation: number;
    ssaoBias: number;
    ssaoDepthAwareUpsampling: boolean;
    ssaoIntensity: number;
    ssaoRadius: number;
    ssaoResolutionScale: number;
    ssaoRings: number;
    ssaoSamples: number;
};

type N8AOPassLike = {
    configuration?: Record<string, unknown>;
    firstFrame?: () => void;
    setQualityMode?: (quality: string) => void;
};

type SSAOMaterialLike = {
    bias?: number;
    intensity?: number;
    radius?: number;
    rings?: number;
    samples?: number;
};

type SSAOPassLike = {
    depthAwareUpsampling?: boolean;
    getResolution?: () => { scale?: number };
    getSSAOMaterial?: () => SSAOMaterialLike;
    intensity?: number;
    radius?: number;
    resolution?: { scale?: number };
    rings?: number;
    samples?: number;
    setChanged?: () => void;
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
const noCollectorPropertiesKey = "__no_properties__";
const collectorPropertyOperators = [
    ">",
    "<",
    "=",
    "!=",
    "has",
    "!has",
] as const;
type CollectorPropertyOperator = (typeof collectorPropertyOperators)[number];
const elementPropertyMetaKeys = new Set(["id", "guid", "props", "sets"]);
const propertySetMetaKeys = new Set([
    "id",
    "guid",
    "isQuantities",
    "name",
    "Name",
    "props",
]);
const propertyValueKeys = [
    "NominalValue",
    "nominalValue",
    "Value",
    "value",
    "LengthValue",
    "AreaValue",
    "VolumeValue",
    "CountValue",
    "WeightValue",
    "TimeValue",
    "IntegerValue",
    "RealValue",
    "BooleanValue",
] as const;

function parseIds(value: string) {
    if (!value.trim()) return [];

    return value
        .split(/[,\s]+/)
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
}

function getFiniteNumber(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasOwnKey(record: Record<string, unknown>, key: string) {
    return Object.prototype.hasOwnProperty.call(record, key);
}

function addPropertyName(names: Set<string>, key: string) {
    const name = key.trim();
    if (name) {
        names.add(name);
    }
}

function collectRecordPropertyNames(
    names: Set<string>,
    record: Record<string, unknown> | undefined,
    metaKeys: Set<string>,
) {
    if (!record) return;

    Object.keys(record).forEach((key) => {
        if (!metaKeys.has(key)) {
            addPropertyName(names, key);
        }
    });
}

function getNamedPropertyLabel(value: Record<string, unknown>, index: number) {
    const rawName =
        value.Name ?? value.name ?? value.DisplayName ?? value.displayName;

    return typeof rawName === "string" && rawName.trim()
        ? rawName.trim()
        : `Property ${index + 1}`;
}

function collectArrayPropertyNames(names: Set<string>, value: unknown) {
    if (!Array.isArray(value)) return;

    value.forEach((item, index) => {
        if (isRecord(item)) {
            addPropertyName(names, getNamedPropertyLabel(item, index));
        }
    });
}

function collectElementPropertyNames(
    names: Set<string>,
    props: BmtElementProps,
) {
    collectRecordPropertyNames(
        names,
        props as Record<string, unknown>,
        elementPropertyMetaKeys,
    );

    if (isRecord(props.props)) {
        collectRecordPropertyNames(names, props.props, new Set());
    } else {
        collectArrayPropertyNames(names, props.props);
    }

    props.sets?.forEach((set) => {
        collectRecordPropertyNames(
            names,
            set as Record<string, unknown>,
            propertySetMetaKeys,
        );

        if (isRecord(set.props)) {
            collectRecordPropertyNames(names, set.props, new Set());
        } else {
            collectArrayPropertyNames(names, set.props);
        }
    });
}

function getModelPropertyNames(modelsData: ViewerLoadedModels | undefined) {
    const names = new Set<string>();

    Object.values(modelsData ?? {}).forEach((model) => {
        Object.values(model.props ?? {}).forEach((props) => {
            collectElementPropertyNames(names, props);
        });
    });

    return Array.from(names).sort((first, second) =>
        first.localeCompare(second),
    );
}

function getModelPropertyOptions(modelsData?: ViewerLoadedModels) {
    const propertyNames = getModelPropertyNames(modelsData);

    if (!propertyNames.length) {
        return { "No properties": noCollectorPropertiesKey };
    }

    return Object.fromEntries(
        propertyNames.map((propertyName) => [propertyName, propertyName]),
    );
}

function getNamedPropertyValue(value: Record<string, unknown>) {
    for (const key of propertyValueKeys) {
        if (value[key] !== undefined) {
            return value[key];
        }
    }

    return Object.fromEntries(
        Object.entries(value).filter(
            ([key]) =>
                !["Name", "name", "Description", "description"].includes(key),
        ),
    );
}

function getArrayPropertyValue(value: unknown, propName: string) {
    if (!Array.isArray(value)) return undefined;

    for (let index = 0; index < value.length; index += 1) {
        const item = value[index];
        if (!isRecord(item)) continue;
        if (getNamedPropertyLabel(item, index) === propName) {
            return getNamedPropertyValue(item);
        }
    }
}

function getRecordPropertyValue(
    record: Record<string, unknown> | undefined,
    propName: string,
) {
    if (!record || !hasOwnKey(record, propName)) return undefined;

    return record[propName];
}

function getSetPropertyValue(set: BmtPropertySet, propName: string) {
    const directValue = getRecordPropertyValue(
        set as Record<string, unknown>,
        propName,
    );

    if (directValue !== undefined) return directValue;

    if (isRecord(set.props)) {
        return getRecordPropertyValue(set.props, propName);
    }

    return getArrayPropertyValue(set.props, propName);
}

function getElementPropertyValue(
    props: BmtElementProps,
    propName: string,
): BmtPropertyValue | unknown {
    const directValue = getRecordPropertyValue(
        props as Record<string, unknown>,
        propName,
    );

    if (directValue !== undefined) return directValue;

    if (isRecord(props.props)) {
        const nestedValue = getRecordPropertyValue(props.props, propName);
        if (nestedValue !== undefined) return nestedValue;
    } else {
        const arrayValue = getArrayPropertyValue(props.props, propName);
        if (arrayValue !== undefined) return arrayValue;
    }

    for (const set of props.sets ?? []) {
        const setValue = getSetPropertyValue(set, propName);
        if (setValue !== undefined) return setValue;
    }
}

function stringifyPropertyValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint"
    ) {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map(stringifyPropertyValue).join(", ");
    }

    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function getComparableNumber(value: unknown) {
    const text = stringifyPropertyValue(value).replace(",", ".").trim();
    if (!text) return null;

    const numericValue = Number(text);
    return Number.isFinite(numericValue) ? numericValue : null;
}

function compareCollectorPropertyValue(
    foundValue: unknown,
    operator: CollectorPropertyOperator,
    expectedValue: string,
) {
    if (foundValue === undefined) return false;

    if (operator === "has") {
        return stringifyPropertyValue(foundValue)
            .toLowerCase()
            .includes(expectedValue.trim().toLowerCase());
    }
    if (operator === "!has") {
        return !stringifyPropertyValue(foundValue)
            .toLowerCase()
            .includes(expectedValue.trim().toLowerCase());
    }
    if (operator === "=") {
        const foundNumber = getComparableNumber(foundValue);
        const expectedNumber = getComparableNumber(expectedValue);
        if (foundNumber !== null && expectedNumber !== null) {
            return foundNumber === expectedNumber;
        }

        return (
            stringifyPropertyValue(foundValue).trim().toLowerCase() ===
            expectedValue.trim().toLowerCase()
        );
    }
    if (operator === "!=") {
        const foundNumber = getComparableNumber(foundValue);
        const expectedNumber = getComparableNumber(expectedValue);
        if (foundNumber !== null && expectedNumber !== null) {
            return foundNumber !== expectedNumber;
        }

        return (
            stringifyPropertyValue(foundValue).trim().toLowerCase() !==
            expectedValue.trim().toLowerCase()
        );
    }
    const foundNumber = getComparableNumber(foundValue);
    const expectedNumber = getComparableNumber(expectedValue);
    if (foundNumber === null || expectedNumber === null) return false;

    return operator === ">"
        ? foundNumber > expectedNumber
        : foundNumber < expectedNumber;
}

function getColorInputValue(value: unknown, fallback = "#ffffff") {
    if (typeof value === "string") {
        if (/^#[0-9a-f]{6}$/i.test(value)) return value;
        if (/^#[0-9a-f]{3}$/i.test(value)) {
            return `#${value
                .slice(1)
                .split("")
                .map((item) => `${item}${item}`)
                .join("")}`;
        }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return `#${value.toString(16).padStart(6, "0").slice(-6)}`;
    }

    return fallback;
}

function toPostproductionPassFilterOption(
    type: ViewerPostproductionPassType | undefined,
): PostproductionPassFilterOption {
    return type === "SSAO" || type === "N8AO" ? type : "null";
}

function toPostproductionPassType(
    value: PostproductionPassFilterOption,
): ViewerPostproductionPassType {
    return value === "null" ? null : value;
}

function getN8AOQualityMode(quality: N8AOQuality) {
    return `${quality.charAt(0).toUpperCase()}${quality.slice(1)}`;
}

function setControllerVisible(controller: Controller, visible: boolean) {
    controller.show(visible);
    controller.enable(visible);
}

function getSSAOResolution(pass: SSAOPassLike) {
    return pass.getResolution?.() ?? pass.resolution;
}

function readPostproductionPassParams(
    api: ViewerApi,
    params: PostproductionParams,
    syncPassFilter = true,
) {
    const activePassFilter = api.postproduction.getActivePassFilter();
    if (!activePassFilter) return;

    if (syncPassFilter) {
        params.passFilter = activePassFilter.type;
    }

    if (activePassFilter.type === "N8AO") {
        const pass = activePassFilter.pass as N8AOPassLike;
        const configuration = pass.configuration;

        params.n8aoAoRadius = getFiniteNumber(
            configuration?.aoRadius,
            params.n8aoAoRadius,
        );
        params.n8aoIntensity = getFiniteNumber(
            configuration?.intensity,
            params.n8aoIntensity,
        );
        return;
    }

    const pass = activePassFilter.pass as SSAOPassLike;
    const material = pass.getSSAOMaterial?.();
    const resolution = getSSAOResolution(pass);

    params.ssaoSamples = getFiniteNumber(
        pass.samples ?? material?.samples,
        params.ssaoSamples,
    );
    params.ssaoRings = getFiniteNumber(
        pass.rings ?? material?.rings,
        params.ssaoRings,
    );
    params.ssaoRadius = getFiniteNumber(
        pass.radius ?? material?.radius,
        params.ssaoRadius,
    );
    params.ssaoIntensity = getFiniteNumber(
        pass.intensity ?? material?.intensity,
        params.ssaoIntensity,
    );
    params.ssaoBias = getFiniteNumber(material?.bias, params.ssaoBias);
    params.ssaoResolutionScale = getFiniteNumber(
        resolution?.scale,
        params.ssaoResolutionScale,
    );
    params.ssaoDepthAwareUpsampling =
        typeof pass.depthAwareUpsampling === "boolean"
            ? pass.depthAwareUpsampling
            : params.ssaoDepthAwareUpsampling;
}

function readPostproductionLightingParams(
    api: ViewerApi,
    params: PostproductionParams,
) {
    const lighting = api.postproduction.getLighting();

    params.ambientLightColor = getColorInputValue(lighting.ambient.color);
    params.ambientLightIntensity = getFiniteNumber(
        lighting.ambient.intensity,
        params.ambientLightIntensity,
    );
    params.directionalLightColor = getColorInputValue(
        lighting.directional.color,
    );
    params.directionalLightIntensity = getFiniteNumber(
        lighting.directional.intensity,
        params.directionalLightIntensity,
    );
}

function applyN8AOPostproductionParams(
    api: ViewerApi,
    params: PostproductionParams,
) {
    const activePassFilter = api.postproduction.getActivePassFilter();
    if (activePassFilter?.type !== "N8AO") return;

    const pass = activePassFilter.pass as N8AOPassLike;
    if (pass.configuration) {
        pass.configuration.aoRadius = params.n8aoAoRadius;
        pass.configuration.intensity = params.n8aoIntensity;
    }
    pass.setQualityMode?.(getN8AOQualityMode(params.n8aoQuality));
    pass.firstFrame?.();
}

function applySSAOPostproductionParams(
    api: ViewerApi,
    params: PostproductionParams,
) {
    const activePassFilter = api.postproduction.getActivePassFilter();
    if (activePassFilter?.type !== "SSAO") return;

    const pass = activePassFilter.pass as SSAOPassLike;
    const material = pass.getSSAOMaterial?.();
    const resolution = getSSAOResolution(pass);

    pass.samples = params.ssaoSamples;
    pass.rings = params.ssaoRings;
    pass.radius = params.ssaoRadius;
    pass.intensity = params.ssaoIntensity;
    pass.depthAwareUpsampling = params.ssaoDepthAwareUpsampling;

    if (material) {
        material.samples = params.ssaoSamples;
        material.rings = params.ssaoRings;
        material.radius = params.ssaoRadius;
        material.intensity = params.ssaoIntensity;
        material.bias = params.ssaoBias;
    }

    if (resolution) {
        resolution.scale = params.ssaoResolutionScale;
    }

    pass.setChanged?.();
}

function applyPostproductionPassParams(
    api: ViewerApi,
    params: PostproductionParams,
) {
    if (params.passFilter === "N8AO") {
        applyN8AOPostproductionParams(api, params);
        return;
    }

    if (params.passFilter === "SSAO") {
        applySSAOPostproductionParams(api, params);
    }
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

function getClippingPlaneOptions(api: ViewerApi) {
    const planes = api.clipping.getPlanes();
    if (!planes.length) return { "No planes": -1 };

    return Object.fromEntries(
        planes.map((_, index) => [`Plane ${index}`, index]),
    );
}

function createPlanContainer(viewerContainer?: HTMLElement | null) {
    const root = viewerContainer ?? document.body;
    const wrapper = document.createElement("div");
    const content = document.createElement("div");
    const closeButton = document.createElement("button");

    wrapper.className = "app-plan-view";
    content.className = "app-plan-view-content";
    closeButton.className = "app-plan-view-close";
    closeButton.type = "button";
    closeButton.ariaLabel = "Close plan";
    closeButton.textContent = "x";
    closeButton.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
    });
    closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    wrapper.append(content, closeButton);
    root.append(wrapper);

    return {
        closeButton,
        content,
        wrapper,
    };
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
    onUploadModeChange,
    onShowIfcSpacesChange,
    onUseDoubleSideMaterialChange,
    onUseIfcSpaceChange,
    onCameraTypeChange,
    onUsePerformanceMovingChange,
    onUseWebGPUChange,
    performanceMode = false,
    selected,
    showIfcSpaces = false,
    uploadMode = "balanced",
    useDoubleSideMaterial = false,
    useIfcSpace = true,
    usePerformanceMoving = false,
    useWebGPU = false,
    viewerContainerRef,
}: ViewerApiGuiOptions) {
    const selectedRef = useRef(selected);
    const modelsDataRef = useRef(modelsData);
    const materialModeRef = useRef(materialMode);
    const performanceModeRef = useRef(performanceMode);
    const uploadModeRef = useRef(uploadMode);
    const showIfcSpacesRef = useRef(showIfcSpaces);
    const useDoubleSideMaterialRef = useRef(useDoubleSideMaterial);
    const useIfcSpaceRef = useRef(useIfcSpace);
    const usePerformanceMovingRef = useRef(usePerformanceMoving);
    const useWebGPURef = useRef(useWebGPU);
    const syncGuiRef = useRef<(() => void) | null>(null);
    const cameraTypeRef = useRef<"orthographic" | "perspective">("perspective");
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
    }, [materialMode]);

    useEffect(() => {
        performanceModeRef.current = performanceMode;
    }, [performanceMode]);

    useEffect(() => {
        uploadModeRef.current = uploadMode;
    }, [uploadMode]);

    useEffect(() => {
        showIfcSpacesRef.current = showIfcSpaces;
    }, [showIfcSpaces]);

    useEffect(() => {
        useDoubleSideMaterialRef.current = useDoubleSideMaterial;
    }, [useDoubleSideMaterial]);

    useEffect(() => {
        useIfcSpaceRef.current = useIfcSpace;
    }, [useIfcSpace]);

    useEffect(() => {
        usePerformanceMovingRef.current = usePerformanceMoving;
    }, [usePerformanceMoving]);

    useEffect(() => {
        useWebGPURef.current = useWebGPU;
    }, [useWebGPU]);

    useEffect(() => {
        if (!api) return;
        const viewerApi = api;
        const isMobile = viewerApi.utils.getUserDevice() === "mobile";
        const guiRoot = viewerContainerRef?.current ?? document.body;

        const gui = new GUI({
            title: "Viewer API",
            width: 330,
        });
        guiRoot.append(gui.domElement);
        gui.domElement.style.position = "absolute";
        gui.domElement.style.top = isMobile ? "48px" : "8px";
        gui.domElement.style.right = isMobile ? "20px" : "16px";
        gui.domElement.style.maxHeight = "calc(50vh)";
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
        const planDisposers = new Set<() => void>();
        const disposeAllPlans = () => {
            Array.from(planDisposers).forEach((disposePlan) => disposePlan());
        };
        const createPlanView = (planeIndex: number) => {
            const plane = viewerApi.clipping.getPlanes()[planeIndex];
            if (!plane) return;

            disposeAllPlans();

            const { closeButton, content, wrapper } = createPlanContainer(
                viewerContainerRef?.current,
            );
            let planHandle: ViewerPlanHandle | null = null;
            const disposePlan = () => {
                planDisposers.delete(disposePlan);
                planHandle?.dispose();
                wrapper.remove();
            };

            closeButton.addEventListener("click", disposePlan);
            planDisposers.add(disposePlan);
            planHandle = viewerApi.plans.createPlan(plane, content);

            if (!planHandle) {
                disposePlan();
            }
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
        const geometryUtilsParams: GeometryUtilsParams = {
            trueNorthEnabled: true,
        };
        const plansParams: PlansParams = {
            createPlan: () => createPlanView(plansParams.planeIndex),
            planeIndex: viewerApi.clipping.getPlanes().length ? 0 : -1,
        };
        let collectorPropertiesLoaded = false;
        let collectorPropertyModelID: number | null = null;
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
            loadProperties: () => {
                collectorPropertiesLoaded = true;
                const level = getCollectorLevelByKey(
                    api,
                    collectorParams.levelKey,
                );
                collectorPropertyModelID =
                    level?.modelID ?? Number(collectorParams.modelID);
                syncGuiState();
            },
            levelKey: allCollectorLevelsKey,
            modelID: getFirstModelID(modelsDataRef.current),
            propertyName: noCollectorPropertiesKey,
            propertyOperator: "has",
            propertyValue: "",
            selectByProperty: () => {
                const modelID = Number(collectorParams.modelID);
                const modelIDs = getModelIDs(modelsDataRef.current);
                if (!modelIDs.includes(modelID)) return;
                if (collectorParams.propertyName === noCollectorPropertiesKey)
                    return;

                const level = getCollectorLevelByKey(
                    api,
                    collectorParams.levelKey,
                );
                const selectedModelID = level?.modelID ?? modelID;
                const collector = level
                    ? api.selector.collector().ofLevel(level)
                    : api.selector.collector().ofModel(modelID);

                if (collectorParams.ifcClass !== allIfcClassesKey) {
                    collector.ofType(collectorParams.ifcClass);
                }

                const elementIDs = collector
                    .Where((element) =>
                        compareCollectorPropertyValue(
                            getElementPropertyValue(
                                element.props,
                                collectorParams.propertyName,
                            ),
                            collectorParams.propertyOperator,
                            collectorParams.propertyValue,
                        ),
                    )
                    .toElementIds();

                api.selector.setSelected(selectedModelID, elementIDs, true);
                console.info("Collected elements by property", {
                    elementIDs,
                    ifcClass: collectorParams.ifcClass,
                    level,
                    modelID: selectedModelID,
                    propertyName: collectorParams.propertyName,
                    propertyOperator: collectorParams.propertyOperator,
                    propertyValue: collectorParams.propertyValue,
                });
            },
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
            preselectionEnabled: api.utils.getPreselectionEnabled(),
            showGridAxes: api.utils.getShowGridAxes(),
            showNavCube: api.utils.getShowNavCube(),
            showStats: api.utils.getShowStats(),
        };
        const spacesParams: SpacesParams = {
            showIfcSpaces: showIfcSpacesRef.current,
            useIfcSpace: useIfcSpaceRef.current,
        };
        const cameraParams: CameraParams = {
            cameraType: cameraTypeRef.current,
            eyeHeight: 1.5,
            firstPersonControlActive: false,
            groundCheckInterval: 1,
            groundSnapDistanceRatio: 3,
            lookSensitivity: 0.004,
            speed: 4,
        };
        const performanceParams: PerformanceParams = {
            materialMode: materialModeRef.current,
            performanceMode: performanceModeRef.current,
            uploadMode: uploadModeRef.current,
            useDoubleSideMaterial: useDoubleSideMaterialRef.current,
            usePerformanceMoving: usePerformanceMovingRef.current,
            useWebGPU: useWebGPURef.current,
        };
        const activePassFilter = viewerApi.postproduction.getActivePassFilter();
        const lighting = viewerApi.postproduction.getLighting();
        const activePassFilterOption = toPostproductionPassFilterOption(
            activePassFilter?.type,
        );
        const postproductionParams: PostproductionParams = {
            ambientLightColor: getColorInputValue(lighting.ambient.color),
            ambientLightIntensity: lighting.ambient.intensity,
            directionalLightColor: getColorInputValue(
                lighting.directional.color,
            ),
            directionalLightIntensity: lighting.directional.intensity,
            n8aoAoRadius: 4,
            n8aoIntensity: 2.3,
            n8aoQuality: "medium",
            passFilter:
                activePassFilterOption === "null"
                    ? "N8AO"
                    : activePassFilterOption,
            saturation: viewerApi.postproduction.getSaturation(),
            ssaoBias: 0.15,
            ssaoDepthAwareUpsampling: true,
            ssaoIntensity: 4.5,
            ssaoRadius: 1,
            ssaoResolutionScale: 0.65,
            ssaoRings: 5,
            ssaoSamples: 20,
        };
        readPostproductionPassParams(viewerApi, postproductionParams);
        viewerApi.geometryUtils.setIfcSpacesVisibility(
            spacesParams.showIfcSpaces,
        );
        let collectorModelIDOptionsKey: string | null = null;
        let collectorModelIDController: Controller | null = null;
        let collectorLevelOptionsKey: string | null = null;
        let collectorLevelController: Controller | null = null;
        let collectorPropertyOptionsKey: string | null = null;
        let collectorPropertyNameController: Controller | null = null;
        let collectorPropertyOperatorController: Controller | null = null;
        let collectorPropertyValueController: Controller | null = null;
        let collectorPropertySelectController: Controller | null = null;
        let colorizeModelIDController: Controller | null = null;
        let materialModeController: Controller | null = null;
        let planPlaneOptionsKey: string | null = null;
        let planPlaneController: Controller | null = null;
        let planCreateController: Controller | null = null;
        let clippingPlaneSyncFrame: number | null = null;
        let clippingPlaneOptionsSnapshot = getControllerOptionsKey(
            getClippingPlaneOptions(viewerApi),
        );
        let useIfcSpaceController: Controller | null = null;
        let useDoubleSideMaterialController: Controller | null = null;
        let pendingPostproductionPassFilter: PostproductionPassFilterOption | null =
            null;
        const n8aoControllers: Controller[] = [];
        const ssaoControllers: Controller[] = [];
        const collectorPropertyControllers: Controller[] = [];
        const watchClippingPlanes = () => {
            const nextOptionsKey = getControllerOptionsKey(
                getClippingPlaneOptions(viewerApi),
            );

            if (nextOptionsKey !== clippingPlaneOptionsSnapshot) {
                clippingPlaneOptionsSnapshot = nextOptionsKey;
                syncGuiState();
            }

            clippingPlaneSyncFrame =
                window.requestAnimationFrame(watchClippingPlanes);
        };
        const setCollectorPropertyControllersVisible = (visible: boolean) => {
            collectorPropertyControllers.forEach((controller) => {
                setControllerVisible(controller, visible);
            });
        };
        const syncPostproductionControllerVisibility = () => {
            n8aoControllers.forEach((controller) => {
                setControllerVisible(
                    controller,
                    postproductionParams.passFilter === "N8AO",
                );
            });
            ssaoControllers.forEach((controller) => {
                setControllerVisible(
                    controller,
                    postproductionParams.passFilter === "SSAO",
                );
            });
        };
        const requestPostproductionPassParamsApply = () => {
            window.requestAnimationFrame(() => {
                applyPostproductionPassParams(viewerApi, postproductionParams);
                syncGuiState();
            });
        };

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
            const collectorLevel = getCollectorLevelByKey(
                viewerApi,
                collectorParams.levelKey,
            );
            const collectorEffectiveModelID =
                collectorLevel?.modelID ?? collectorParams.modelID;

            if (
                collectorPropertyModelID !== null &&
                collectorPropertyModelID !== collectorEffectiveModelID
            ) {
                collectorPropertiesLoaded = false;
                collectorPropertyModelID = null;
                collectorParams.propertyName = noCollectorPropertiesKey;
                collectorPropertyOptionsKey = null;
            }

            const collectorModelData =
                modelsDataRef.current?.[collectorEffectiveModelID];
            const collectorPropertyOptions =
                collectorPropertiesLoaded && collectorModelData
                    ? getModelPropertyOptions({
                          [collectorEffectiveModelID]: collectorModelData,
                      })
                    : { "No properties": noCollectorPropertiesKey };
            const collectorPropertyValues = Object.values(
                collectorPropertyOptions,
            );
            const nextCollectorPropertyOptionsKey = getControllerOptionsKey(
                collectorPropertyOptions,
            );
            if (
                collectorPropertyOptionsKey !== nextCollectorPropertyOptionsKey
            ) {
                collectorPropertyOptionsKey = nextCollectorPropertyOptionsKey;
                collectorPropertyNameController?.options(
                    collectorPropertyOptions,
                );
            }

            if (
                !collectorPropertyValues.includes(collectorParams.propertyName)
            ) {
                collectorParams.propertyName =
                    collectorPropertyValues[0] ?? noCollectorPropertiesKey;
            }

            const hasCollectorProperties =
                collectorPropertiesLoaded &&
                collectorPropertyValues.some(
                    (value) => value !== noCollectorPropertiesKey,
                );

            setCollectorPropertyControllersVisible(collectorPropertiesLoaded);
            collectorPropertyNameController?.enable(hasCollectorProperties);
            collectorPropertyOperatorController?.enable(hasCollectorProperties);
            collectorPropertyValueController?.enable(hasCollectorProperties);
            collectorPropertySelectController?.enable(hasCollectorProperties);

            dimensionsParams.active = viewerApi.dimensions.getActive();
            dimensionsParams.snapDistance =
                viewerApi.dimensions.getSnapDistance();
            dimensionsParams.unit = viewerApi.dimensions.getUnit();
            clippingParams.active = viewerApi.clipping.getActive();
            clippingParams.capsActive = viewerApi.clipping.getCapsActive();
            clippingParams.edgesActive = viewerApi.clipping.getEdgesActive();
            clippingParams.helpersActive =
                viewerApi.clipping.getHelpersActive();
            const clippingPlaneOptions = getClippingPlaneOptions(viewerApi);
            const clippingPlaneValues = Object.values(clippingPlaneOptions);
            const nextPlanPlaneOptionsKey =
                getControllerOptionsKey(clippingPlaneOptions);

            if (planPlaneOptionsKey !== nextPlanPlaneOptionsKey) {
                planPlaneOptionsKey = nextPlanPlaneOptionsKey;
                planPlaneController?.options(clippingPlaneOptions);
            }

            if (!clippingPlaneValues.includes(plansParams.planeIndex)) {
                plansParams.planeIndex = clippingPlaneValues[0] ?? -1;
            }
            const hasClippingPlanes = clippingPlaneValues.some(
                (value) => value >= 0,
            );
            planPlaneController?.enable(hasClippingPlanes);
            planCreateController?.enable(hasClippingPlanes);

            const visibility = viewerApi.utils.getGridAxesVisibility();
            utilsParams.defaultHotkeysEnabled =
                viewerApi.utils.getDefaultHotkeysEnabled();
            utilsParams.gridBottom = visibility.bottom;
            utilsParams.gridLeft = visibility.left;
            utilsParams.gridRight = visibility.right;
            utilsParams.gridTop = visibility.top;
            utilsParams.preselectionEnabled =
                viewerApi.utils.getPreselectionEnabled();
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
            performanceParams.uploadMode = uploadModeRef.current;
            performanceParams.useDoubleSideMaterial =
                useDoubleSideMaterialRef.current;
            performanceParams.usePerformanceMoving =
                usePerformanceMovingRef.current;
            performanceParams.useWebGPU = useWebGPURef.current;
            materialModeController?.enable(!hasModels);
            useIfcSpaceController?.enable(!hasModels);
            useDoubleSideMaterialController?.enable(!hasModels);

            readPostproductionLightingParams(viewerApi, postproductionParams);
            postproductionParams.saturation =
                viewerApi.postproduction.getSaturation();
            const currentActivePassFilter =
                viewerApi.postproduction.getActivePassFilter();
            const pendingPassFilterReady =
                pendingPostproductionPassFilter &&
                (pendingPostproductionPassFilter === "null"
                    ? !currentActivePassFilter
                    : currentActivePassFilter?.type ===
                      pendingPostproductionPassFilter);

            if (pendingPassFilterReady) {
                pendingPostproductionPassFilter = null;
                applyPostproductionPassParams(viewerApi, postproductionParams);
            }
            readPostproductionPassParams(
                viewerApi,
                postproductionParams,
                !pendingPostproductionPassFilter,
            );
            syncPostproductionControllerVisibility();

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

        const plansFolder = gui.addFolder("plans");
        plansFolder.close();
        planPlaneController = addController(
            plansFolder.add(
                plansParams,
                "planeIndex",
                getClippingPlaneOptions(viewerApi),
            ),
        )
            .name("planes")
            .onChange((value: number | string) => {
                plansParams.planeIndex = Number(value);
                syncGuiState();
            });
        planCreateController = addController(
            plansFolder.add(plansParams, "createPlan"),
        ).name("создать");

        const geometryUtilsFolder = gui.addFolder("geometryUtils");
        geometryUtilsFolder.close();
        addController(
            geometryUtilsFolder.add(geometryUtilsParams, "trueNorthEnabled"),
        )
            .name("useTrueNorth")
            .onChange((value: boolean) =>
                run(() => api.geometryUtils.useTrueNorth(value)),
            );

        const collectorFolder = gui.addFolder("collector");
        collectorFolder.close();
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
        const collectorPropertyFolder =
            collectorFolder.addFolder("property filter");
        addController(
            collectorPropertyFolder.add(collectorParams, "loadProperties"),
        ).name("Загрузить свойства");
        collectorPropertyNameController = addController(
            collectorPropertyFolder.add(
                collectorParams,
                "propertyName",
                getModelPropertyOptions(),
            ),
        ).name("property");
        collectorPropertyControllers.push(collectorPropertyNameController);
        collectorPropertyOperatorController = addController(
            collectorPropertyFolder.add(
                collectorParams,
                "propertyOperator",
                collectorPropertyOperators,
            ),
        ).name("operator");
        collectorPropertyControllers.push(collectorPropertyOperatorController);
        collectorPropertyValueController = addController(
            collectorPropertyFolder.add(collectorParams, "propertyValue"),
        ).name("value");
        collectorPropertyControllers.push(collectorPropertyValueController);
        collectorPropertySelectController = addController(
            collectorPropertyFolder.add(collectorParams, "selectByProperty"),
        ).name("select");
        collectorPropertyControllers.push(collectorPropertySelectController);
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
        addController(utilsFolder.add(utilsParams, "preselectionEnabled"))
            .name("setPreselectionEnabled")
            .onChange((value: boolean) =>
                run(() => api.utils.setPreselectionEnabled(value)),
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
        addController(performanceFolder.add(performanceParams, "useWebGPU"))
            .name("useWebGPU(test)")
            .onChange((value: boolean) => {
                useWebGPURef.current = value;
                onUseWebGPUChange?.(value);
                syncGuiState();
            });
        materialModeController = addController(
            performanceFolder.add(performanceParams, "materialMode", [
                "quality",
                "performance",
            ]),
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
            performanceFolder.add(performanceParams, "useDoubleSideMaterial"),
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

        const postproductionFolder = gui.addFolder("postproduction");
        postproductionFolder.close();
        addController(
            postproductionFolder.add(postproductionParams, "passFilter", [
                "N8AO",
                "SSAO",
                "null",
            ]),
        )
            .name("passFilter")
            .onChange((value: PostproductionPassFilterOption | string) => {
                const nextPassFilter =
                    value === "SSAO" || value === "null" ? value : "N8AO";

                postproductionParams.passFilter = nextPassFilter;
                pendingPostproductionPassFilter = nextPassFilter;
                run(() =>
                    api.postproduction.setPassFilter(
                        toPostproductionPassType(nextPassFilter),
                    ),
                );
                requestPostproductionPassParamsApply();
            });
        n8aoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "n8aoAoRadius",
                    0,
                    10,
                    0.1,
                ),
            )
                .name("N8AO aoRadius")
                .onChange((value: number) => {
                    postproductionParams.n8aoAoRadius = value;
                    applyN8AOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        n8aoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "n8aoIntensity",
                    0,
                    10,
                    0.1,
                ),
            )
                .name("N8AO intensity")
                .onChange((value: number) => {
                    postproductionParams.n8aoIntensity = value;
                    applyN8AOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        n8aoControllers.push(
            addController(
                postproductionFolder.add(postproductionParams, "n8aoQuality", [
                    "low",
                    "medium",
                    "high",
                ]),
            )
                .name("N8AO quality")
                .onChange((value: N8AOQuality | string) => {
                    postproductionParams.n8aoQuality =
                        value === "low" || value === "high" ? value : "medium";
                    applyN8AOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        ssaoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "ssaoSamples",
                    1,
                    64,
                    1,
                ),
            )
                .name("SSAO samples")
                .onChange((value: number) => {
                    postproductionParams.ssaoSamples = value;
                    applySSAOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        ssaoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "ssaoRings",
                    1,
                    16,
                    1,
                ),
            )
                .name("SSAO rings")
                .onChange((value: number) => {
                    postproductionParams.ssaoRings = value;
                    applySSAOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        ssaoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "ssaoRadius",
                    0,
                    1,
                    0.1,
                ),
            )
                .name("SSAO radius")
                .onChange((value: number) => {
                    postproductionParams.ssaoRadius = value;
                    applySSAOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        ssaoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "ssaoIntensity",
                    0,
                    10,
                    0.1,
                ),
            )
                .name("SSAO intensity")
                .onChange((value: number) => {
                    postproductionParams.ssaoIntensity = value;
                    applySSAOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        ssaoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "ssaoBias",
                    0,
                    1,
                    0.01,
                ),
            )
                .name("SSAO bias")
                .onChange((value: number) => {
                    postproductionParams.ssaoBias = value;
                    applySSAOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        ssaoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "ssaoResolutionScale",
                    0.1,
                    1,
                    0.05,
                ),
            )
                .name("SSAO resolutionScale")
                .onChange((value: number) => {
                    postproductionParams.ssaoResolutionScale = value;
                    applySSAOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        ssaoControllers.push(
            addController(
                postproductionFolder.add(
                    postproductionParams,
                    "ssaoDepthAwareUpsampling",
                ),
            )
                .name("SSAO depthAwareUpsampling")
                .onChange((value: boolean) => {
                    postproductionParams.ssaoDepthAwareUpsampling = value;
                    applySSAOPostproductionParams(
                        viewerApi,
                        postproductionParams,
                    );
                    syncGuiState();
                }),
        );
        addController(
            postproductionFolder.add(
                postproductionParams,
                "saturation",
                -1,
                1,
                0.01,
            ),
        )
            .name("setSaturation")
            .onChange((value: number) =>
                run(() => api.postproduction.setSaturation(value)),
            );
        addController(
            postproductionFolder.addColor(
                postproductionParams,
                "ambientLightColor",
            ),
        )
            .name("ambientLightColor")
            .onChange((value: string) =>
                run(() => api.postproduction.setAmbientLightColor(value)),
            );
        addController(
            postproductionFolder.add(
                postproductionParams,
                "ambientLightIntensity",
                0,
                10,
                0.1,
            ),
        )
            .name("ambientLightIntensity")
            .onChange((value: number) =>
                run(() => api.postproduction.setAmbientLightIntensity(value)),
            );
        addController(
            postproductionFolder.addColor(
                postproductionParams,
                "directionalLightColor",
            ),
        )
            .name("directionalLightColor")
            .onChange((value: string) =>
                run(() => api.postproduction.setDirectionalLightColor(value)),
            );
        addController(
            postproductionFolder.add(
                postproductionParams,
                "directionalLightIntensity",
                0,
                10,
                0.1,
            ),
        )
            .name("directionalLightIntensity")
            .onChange((value: number) =>
                run(() =>
                    api.postproduction.setDirectionalLightIntensity(value),
                ),
            );

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

        const cameraFolder = gui.addFolder("camera");
        cameraFolder.close();
        addController(
            cameraFolder.add(cameraParams, "cameraType", [
                "perspective",
                "orthographic",
            ]),
        )
            .name("cameraType")
            .onChange((value: "orthographic" | "perspective") => {
                const nextCameraType =
                    value === "orthographic" ? "orthographic" : "perspective";

                cameraTypeRef.current = nextCameraType;
                onCameraTypeChange?.(nextCameraType);
                syncGuiState();
            });
        const applyFirstPersonControlSettings = () => {
            const settings: ViewerFirstPersonControlSettings = {
                eyeHeight: cameraParams.eyeHeight,
                groundCheckInterval: cameraParams.groundCheckInterval,
                groundSnapDistanceRatio: cameraParams.groundSnapDistanceRatio,
                lookSensitivity: cameraParams.lookSensitivity,
                speed: cameraParams.speed,
            };

            viewerApi.camera.setFirstPersonControlSettings(settings);
        };
        const firstPersonFolder = cameraFolder.addFolder("1st person control");
        firstPersonFolder.close();
        addController(
            firstPersonFolder.add(cameraParams, "firstPersonControlActive"),
        )
            .name("setFirstPersonControlActive")
            .onChange((value: boolean) =>
                run(() => viewerApi.camera.setFirstPersonControlActive(value)),
            );
        addController(
            firstPersonFolder.add(cameraParams, "speed", 0.001, 10, 0.1),
        )
            .name("speed")
            .onChange((value: number) => {
                cameraParams.speed = value;
                applyFirstPersonControlSettings();
            });
        addController(
            firstPersonFolder.add(
                cameraParams,
                "lookSensitivity",
                0.0001,
                0.1,
                0.0001,
            ),
        )
            .name("lookSensitivity")
            .onChange((value: number) => {
                cameraParams.lookSensitivity = value;
                applyFirstPersonControlSettings();
            });
        addController(
            firstPersonFolder.add(cameraParams, "eyeHeight", 0.001, 5, 0.01),
        )
            .name("eyeHeight")
            .onChange((value: number) => {
                cameraParams.eyeHeight = value;
                applyFirstPersonControlSettings();
            });
        addController(
            firstPersonFolder.add(
                cameraParams,
                "groundCheckInterval",
                1,
                120,
                1,
            ),
        )
            .name("groundCheckInterval")
            .onChange((value: number) => {
                cameraParams.groundCheckInterval = value;
                applyFirstPersonControlSettings();
            });
        addController(
            firstPersonFolder.add(
                cameraParams,
                "groundSnapDistanceRatio",
                0.1,
                100,
                0.1,
            ),
        )
            .name("groundSnapDistanceRatio")
            .onChange((value: number) => {
                cameraParams.groundSnapDistanceRatio = value;
                applyFirstPersonControlSettings();
            });

        syncGuiRef.current = syncGuiState;
        syncGuiState();
        clippingPlaneSyncFrame =
            window.requestAnimationFrame(watchClippingPlanes);

        return () => {
            if (clippingPlaneSyncFrame !== null) {
                window.cancelAnimationFrame(clippingPlaneSyncFrame);
            }

            syncGuiRef.current = null;
            disposeAllPlans();
            gui.destroy();
        };
    }, [
        api,
        onMaterialModeChange,
        onPerformanceModeChange,
        onUploadModeChange,
        onShowIfcSpacesChange,
        onUseDoubleSideMaterialChange,
        onUseIfcSpaceChange,
        onCameraTypeChange,
        onUsePerformanceMovingChange,
        onUseWebGPUChange,
        viewerContainerRef,
    ]);
}
