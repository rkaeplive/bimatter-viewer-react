import type { ReactNode } from "react";
import type {
    ViewerLoadedModels,
    BmtPropertyRecord,
    BmtPropertyValue,
} from "bimatter-viewer-react";
import type { SelectedElement } from "./StructureTree";

type ElementPropertiesProps = {
    modelsData?: ViewerLoadedModels;
    selectedElement?: SelectedElement | null;
};

type PropertyRow = {
    label: string;
    value: BmtPropertyValue;
};

type PropertySectionProps = {
    children: ReactNode;
    title: string;
};

function isRecord(value: BmtPropertyValue): value is BmtPropertyRecord {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function getScalarValue(value: BmtPropertyValue) {
    if (value === null) return "-";
    if (value === undefined) return "-";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return Number.isFinite(value) ? value : "-";
    if (typeof value === "string") return value || "-";

    if (isRecord(value) && "value" in value) {
        return getScalarValue(value.value);
    }

    return null;
}

function getRows(value: BmtPropertyRecord, exclude: string[] = []) {
    const excludedKeys = new Set(exclude);

    return Object.entries(value)
        .filter(([key, entryValue]) => {
            return (
                !excludedKeys.has(key) &&
                entryValue !== undefined &&
                typeof entryValue !== "function"
            );
        })
        .map(([label, entryValue]) => ({
            label,
            value: entryValue,
        }));
}

function getString(value: BmtPropertyValue) {
    const scalar = getScalarValue(value);
    return scalar === null ? "" : String(scalar);
}

function getPropertyItemLabel(item: BmtPropertyRecord, fallbackIndex: number) {
    return (
        getString(item.Name) ||
        getString(item.name) ||
        getString(item.DisplayName) ||
        getString(item.displayName) ||
        `Property ${fallbackIndex + 1}`
    );
}

function getPropertyItemValue(item: BmtPropertyRecord): BmtPropertyValue {
    const valueKeys = [
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
    ];

    for (const key of valueKeys) {
        if (item[key] !== undefined) return item[key];
    }

    return Object.fromEntries(
        Object.entries(item).filter(([key]) => {
            return !["Name", "name", "Description", "description"].includes(
                key,
            );
        }),
    ) as BmtPropertyRecord;
}

function getPropertySetTitle(
    propertySet: BmtPropertyRecord,
    fallbackIndex: number,
) {
    return (
        getString(propertySet.name) ||
        getString(propertySet.Name) ||
        `Set ${fallbackIndex + 1}`
    );
}

function getPropertySetRows(propertySet: BmtPropertyRecord) {
    const props = propertySet.props;

    if (Array.isArray(props)) {
        return props.map((item, index) => {
            if (!isRecord(item)) {
                return {
                    label: `Property ${index + 1}`,
                    value: item,
                };
            }

            return {
                label: getPropertyItemLabel(item, index),
                value: getPropertyItemValue(item),
            };
        });
    }

    if (isRecord(props)) return getRows(props);

    return getRows(propertySet, ["id", "guid", "name", "Name", "props"]);
}

function ValueView({ value }: { value: BmtPropertyValue }) {
    const scalar = getScalarValue(value);

    if (scalar !== null) {
        return <span className="property-value">{scalar}</span>;
    }

    if (Array.isArray(value)) {
        const simpleValues = value.map(getScalarValue);
        if (simpleValues.every((item) => item !== null)) {
            return (
                <span className="property-value">
                    {simpleValues.join(", ") || "-"}
                </span>
            );
        }

        return (
            <div className="property-list-value">
                {value.slice(0, 30).map((item, index) => (
                    <div className="property-list-item" key={index}>
                        <span>{index + 1}</span>
                        <ValueView value={item} />
                    </div>
                ))}
                {value.length > 30 && (
                    <div className="property-muted">
                        {value.length - 30} more items
                    </div>
                )}
            </div>
        );
    }

    if (isRecord(value)) {
        const rows = getRows(value);

        if (!rows.length) {
            return <span className="property-value">-</span>;
        }

        return (
            <div className="property-compact-object">
                {rows.slice(0, 12).map((row) => (
                    <div className="property-compact-row" key={row.label}>
                        <span>{row.label}</span>
                        <ValueView value={row.value} />
                    </div>
                ))}
                {rows.length > 12 && (
                    <div className="property-muted">
                        {rows.length - 12} more fields
                    </div>
                )}
            </div>
        );
    }

    return <span className="property-value">{String(value)}</span>;
}

function PropertyRows({ rows }: { rows: PropertyRow[] }) {
    if (!rows.length) return null;

    return (
        <div className="property-rows">
            {rows.map((row, index) => (
                <div className="property-row" key={`${row.label}_${index}`}>
                    <div className="property-key">{row.label}</div>
                    <div className="property-field">
                        <ValueView value={row.value} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function PropertySection({ children, title }: PropertySectionProps) {
    return (
        <details className="property-section" open>
            <summary>{title}</summary>
            {children}
        </details>
    );
}

function PropertyContent({ value }: { value: BmtPropertyValue }) {
    if (!isRecord(value)) {
        return <ValueView value={value} />;
    }

    const elementRows = getRows(value, ["props", "sets"]);
    const baseRows = isRecord(value.props) ? getRows(value.props) : [];
    const propertySets = Array.isArray(value.sets)
        ? value.sets.filter(isRecord)
        : [];

    return (
        <div className="property-content">
            {elementRows.length > 0 && (
                <PropertySection title="Element">
                    <PropertyRows rows={elementRows} />
                </PropertySection>
            )}
            {baseRows.length > 0 && (
                <PropertySection title="Base">
                    <PropertyRows rows={baseRows} />
                </PropertySection>
            )}
            {propertySets.map((propertySet, index) => {
                const rows = getPropertySetRows(propertySet);
                if (!rows.length) return null;

                return (
                    <PropertySection
                        key={`${getPropertySetTitle(propertySet, index)}_${index}`}
                        title={getPropertySetTitle(propertySet, index)}
                    >
                        <PropertyRows rows={rows} />
                    </PropertySection>
                );
            })}
        </div>
    );
}

export function ElementProperties({
    modelsData,
    selectedElement,
}: ElementPropertiesProps) {
    const selectedProperty =
        selectedElement === null || selectedElement === undefined
            ? undefined
            : modelsData?.[selectedElement.modelID]?.props[
                  selectedElement.elementID
              ];

    return (
        <aside className="app-side-panel properties-panel">
            <div className="app-panel-header">
                <h2>Properties</h2>
                {selectedElement && (
                    <span>
                        {selectedElement.modelID}:{selectedElement.elementID}
                    </span>
                )}
            </div>
            <div className="app-panel-body">
                {!selectedElement && (
                    <p className="app-panel-empty">Select one element</p>
                )}
                {selectedElement && selectedProperty === undefined && (
                    <p className="app-panel-empty">No properties</p>
                )}
                {selectedProperty !== undefined && (
                    <PropertyContent value={selectedProperty} />
                )}
            </div>
        </aside>
    );
}
