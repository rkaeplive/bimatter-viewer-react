import { useState } from "react";
import type {
    ViewerLoadedModels,
    BmtModelStructure,
    BmtModelStructureNode,
    BmtPropertyRecord,
    BmtPropertyValue,
    ViewerSelection,
} from "bimatter-viewer-react";

export type SelectedElement = {
    elementID: number;
    modelID: number;
};

export type StructureSelectOptions = {
    add?: boolean;
    fitTarget?: boolean;
};

type StructureTreeProps = {
    modelsData?: ViewerLoadedModels;
    onSelectElements?: (
        modelID: number,
        elementIDs: number[],
        options?: StructureSelectOptions,
    ) => void;
    selected?: ViewerSelection;
    showIfcSpaces?: boolean;
};

type StructureNode = BmtModelStructureNode & {
    children?: StructureNode[];
    childs?: StructureNode[] | Record<string, StructureNode>;
    elements?: StructureNode[] | Record<string, StructureNode>;
    items?: StructureNode[] | Record<string, StructureNode>;
};

type TreeNodeProps = {
    depth: number;
    expanded: Set<string>;
    modelID: number;
    node: StructureNode;
    nodeKey: string;
    onSelectElements?: (
        modelID: number,
        elementIDs: number[],
        options?: StructureSelectOptions,
    ) => void;
    onToggle: (nodeKey: string) => void;
    selectedIDs?: ReadonlySet<number>;
};

function isRecord(value: unknown): value is BmtPropertyRecord {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStructureNode(value: unknown): value is StructureNode {
    return isRecord(value);
}

function getRecordItems(value: unknown): StructureNode[] {
    if (Array.isArray(value)) {
        return value.filter(isStructureNode);
    }

    if (isRecord(value)) {
        return Object.values(value).filter(isStructureNode);
    }

    return [];
}

function hasStructure(value: BmtModelStructure) {
    if (Array.isArray(value)) return getRecordItems(value).length > 0;
    return isRecord(value) && Object.keys(value).length > 0;
}

function toNumber(value: BmtPropertyValue) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const numericValue = Number(value);
        if (Number.isFinite(numericValue)) return numericValue;
    }

    return null;
}

function getNodeID(node: StructureNode) {
    return toNumber(
        node.id ??
            node.expressID ??
            node.expressId ??
            node.elementID ??
            node.elementId,
    );
}

function getNodeChildren(node: StructureNode) {
    const childSources = [
        node.children,
        node.items,
        node.elements,
        node.childs,
    ];

    for (const childSource of childSources) {
        const children = getRecordItems(childSource);
        if (children.length) return children;
    }

    return [];
}

function getNodeType(node: StructureNode) {
    const props = isRecord(node.props) ? node.props : {};
    const rawType = node.type ?? node.Type ?? props.type ?? props.Type;

    return typeof rawType === "string" ? rawType : "";
}

function isIfcSpaceNode(node: StructureNode) {
    return getNodeType(node).toLowerCase() === "ifcspace";
}

function setNodeChildren(node: StructureNode, children: StructureNode[]) {
    return {
        ...node,
        children,
    };
}

function filterIfcSpaceNodes(node: StructureNode): StructureNode[] {
    const filteredChildren = getNodeChildren(node).flatMap(filterIfcSpaceNodes);

    if (isIfcSpaceNode(node)) {
        return filteredChildren;
    }

    return [setNodeChildren(node, filteredChildren)];
}

function normalizeVisibleStructure(
    modelID: string,
    structure: BmtModelStructure,
    showIfcSpaces: boolean,
) {
    const root = normalizeStructure(modelID, structure);
    if (showIfcSpaces) return root;

    const filteredRoots = filterIfcSpaceNodes(root);
    if (filteredRoots.length === 1) return filteredRoots[0];

    return {
        children: filteredRoots,
        name: `Model ${modelID}`,
        type: "Model",
    };
}

function getSelectableElementIDs(node: StructureNode): number[] {
    const children = getNodeChildren(node);

    if (!children.length) {
        const id = getNodeID(node);
        return id === null ? [] : [id];
    }

    return children.flatMap(getSelectableElementIDs);
}

function hasSelectedElementID(
    node: StructureNode,
    selectedIDs?: ReadonlySet<number>,
): boolean {
    if (!selectedIDs?.size) return false;

    const id = getNodeID(node);
    if (id !== null && selectedIDs.has(id)) return true;

    return getNodeChildren(node).some((child) =>
        hasSelectedElementID(child, selectedIDs),
    );
}

function getNodeLabel(node: StructureNode) {
    const props = isRecord(node.props) ? node.props : {};
    const rawName = node.name ?? node.Name ?? props.name ?? props.Name;
    const rawType = node.type ?? node.Type ?? props.type ?? props.Type;
    const name = typeof rawName === "string" ? rawName : "";
    const type = typeof rawType === "string" ? rawType : "";
    const id = getNodeID(node);

    if (name && type) return `${name} (${type})`;
    if (name) return name;
    if (type) return type;
    if (id !== null) return `Element ${id}`;

    return "Element";
}

function normalizeStructure(
    modelID: string,
    structure: BmtModelStructure,
): StructureNode {
    if (Array.isArray(structure)) {
        return {
            children: getRecordItems(structure),
            name: `Model ${modelID}`,
            type: "Model",
        };
    }

    if (!isRecord(structure)) {
        return {
            children: [],
            name: `Model ${modelID}`,
            type: "Model",
        };
    }

    const hasNodeIdentity =
        getNodeID(structure) !== null ||
        typeof structure.name === "string" ||
        typeof structure.Name === "string" ||
        typeof structure.type === "string" ||
        typeof structure.Type === "string" ||
        Array.isArray(structure.children);

    if (hasNodeIdentity) return structure as StructureNode;

    return {
        children: getRecordItems(structure),
        name: `Model ${modelID}`,
        type: "Model",
    };
}

function TreeNode({
    depth,
    expanded,
    modelID,
    node,
    nodeKey,
    onSelectElements,
    onToggle,
    selectedIDs,
}: TreeNodeProps) {
    const children = getNodeChildren(node);
    const id = getNodeID(node);
    const isExpanded = expanded.has(nodeKey);
    const isSelected = hasSelectedElementID(node, selectedIDs);
    const selectNode = (options?: StructureSelectOptions) => {
        const elementIDs = getSelectableElementIDs(node);
        if (elementIDs.length) {
            onSelectElements?.(modelID, elementIDs, options);
        }
    };

    return (
        <li className="structure-tree-node">
            <div
                className="structure-tree-row"
                style={{ paddingLeft: `${depth * 12}px` }}
            >
                <button
                    className="structure-tree-toggle"
                    disabled={!children.length}
                    onClick={() => onToggle(nodeKey)}
                    type="button"
                >
                    {children.length ? (isExpanded ? "-" : "+") : ""}
                </button>
                <button
                    className={
                        isSelected
                            ? "structure-tree-label is-selected"
                            : "structure-tree-label"
                    }
                    disabled={id === null && !children.length}
                    onClick={(event) => {
                        selectNode({ add: event.shiftKey });
                    }}
                    onDoubleClick={() => {
                        selectNode({ fitTarget: true });
                    }}
                    title={
                        children.length
                            ? "Select descendant elements"
                            : id !== null
                              ? `ID ${id}`
                              : undefined
                    }
                    type="button"
                >
                    <span>{getNodeLabel(node)}</span>
                    {id !== null && <small>{id}</small>}
                </button>
            </div>
            {isExpanded && children.length > 0 && (
                <ul className="structure-tree-list">
                    {children.map((child, index) => (
                        <TreeNode
                            depth={depth + 1}
                            expanded={expanded}
                            key={`${nodeKey}_${index}`}
                            modelID={modelID}
                            node={child}
                            nodeKey={`${nodeKey}_${index}`}
                            onSelectElements={onSelectElements}
                            onToggle={onToggle}
                            selectedIDs={selectedIDs}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export function StructureTree({
    modelsData,
    onSelectElements,
    selected,
    showIfcSpaces = true,
}: StructureTreeProps) {
    const [expanded, setExpanded] = useState(() => new Set<string>());
    const modelEntries = Object.entries(modelsData ?? {}).filter(([, model]) =>
        hasStructure(model.structure),
    );

    const toggleNode = (nodeKey: string) => {
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(nodeKey)) {
                next.delete(nodeKey);
            } else {
                next.add(nodeKey);
            }

            return next;
        });
    };

    return (
        <aside className="app-side-panel structure-panel">
            <div className="app-panel-header">
                <h2>Structure</h2>
            </div>
            <div className="app-panel-body">
                {modelEntries.length === 0 && (
                    <p className="app-panel-empty">No structure</p>
                )}
                {modelEntries.map(([modelID, model]) => {
                    const numericModelID = Number(modelID);
                    const rootKey = `model_${modelID}`;
                    const selectedIDs = new Set(selected?.[numericModelID] ?? []);

                    return (
                        <section className="structure-model" key={modelID}>
                            <div className="structure-model-title">
                                Model {modelID}
                            </div>
                            <ul className="structure-tree-list">
                                <TreeNode
                                    depth={0}
                                    expanded={expanded}
                                    modelID={numericModelID}
                                    node={normalizeVisibleStructure(
                                        modelID,
                                        model.structure,
                                        showIfcSpaces,
                                    )}
                                    nodeKey={rootKey}
                                    onSelectElements={onSelectElements}
                                    onToggle={toggleNode}
                                    selectedIDs={selectedIDs}
                                />
                            </ul>
                        </section>
                    );
                })}
            </div>
        </aside>
    );
}
