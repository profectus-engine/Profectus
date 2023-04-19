import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import { Component, GatherProps, getUniqueID, setDefault, Visibility } from "features/feature";
import GridComponent from "features/grids/Grid.vue";
import type { Persistent, State } from "game/persistence";
import { persistent } from "game/persistence";
import { isFunction } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { Ref } from "vue";
import { computed, unref } from "vue";

/** A symbol used to identify {@link Grid} features. */
export const GridType = Symbol("Grid");

/** A type representing a computable value for a cell in the grid. */
export type CellComputable<T> = Computable<T> | ((id: string | number, state: State) => T);

/** Create proxy to more easily get the properties of cells on a grid. */
function createGridProxy(grid: GenericGrid): Record<string | number, GridCell> {
    return new Proxy({}, getGridHandler(grid)) as Record<string | number, GridCell>;
}

/**
 * Returns traps for a proxy that will give cell proxies when accessing any numerical key.
 * @param grid The grid to get the cells from.
 * @see {@link createGridProxy}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getGridHandler(grid: GenericGrid): ProxyHandler<Record<string | number, GridCell>> {
    const keys = computed(() => {
        const keys = [];
        for (let row = 1; row <= unref(grid.rows); row++) {
            for (let col = 1; col <= unref(grid.cols); col++) {
                keys.push((row * 100 + col).toString());
            }
        }
        return keys;
    });
    return {
        get(target: Record<string | number, GridCell>, key: PropertyKey) {
            if (key === "isProxy") {
                return true;
            }

            if (typeof key === "symbol") {
                return (grid as never)[key];
            }

            if (!keys.value.includes(key.toString())) {
                return undefined;
            }

            if (target[key] == null) {
                target[key] = new Proxy(
                    grid,
                    getCellHandler(key.toString())
                ) as unknown as GridCell;
            }

            return target[key];
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(target: Record<string | number, GridCell>, key: PropertyKey, value: any) {
            console.warn("Cannot set grid cells", target, key, value);
            return false;
        },
        ownKeys() {
            return keys.value;
        },
        has(target: Record<string | number, GridCell>, key: PropertyKey) {
            return keys.value.includes(key.toString());
        },
        getOwnPropertyDescriptor(target: Record<string | number, GridCell>, key: PropertyKey) {
            if (keys.value.includes(key.toString())) {
                return {
                    configurable: true,
                    enumerable: true,
                    writable: false
                };
            }
        }
    };
}

/**
 * Returns traps for a proxy that will get the properties for the specified cell
 * @param id The grid cell ID to get properties from.
 * @see {@link getGridHandler}
 * @see {@link createGridProxy}
 */
function getCellHandler(id: string): ProxyHandler<GenericGrid> {
    const keys = [
        "id",
        "visibility",
        "canClick",
        "startState",
        "state",
        "style",
        "classes",
        "title",
        "display",
        "onClick",
        "onHold"
    ];
    const cache: Record<string, Ref<unknown>> = {};
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get(target, key, receiver): any {
            if (key === "isProxy") {
                return true;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let prop = (target as any)[key];

            if (isFunction(prop)) {
                return () => prop.call(receiver, id, target.getState(id));
            }
            if (prop != undefined || typeof key === "symbol") {
                return prop;
            }

            key = key.slice(0, 1).toUpperCase() + key.slice(1);

            if (key === "startState") {
                return prop.call(receiver, id);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            prop = (target as any)[`get${key}`];
            if (isFunction(prop)) {
                if (!(key in cache)) {
                    cache[key] = computed(() => prop.call(receiver, id, target.getState(id)));
                }
                return cache[key].value;
            } else if (prop != undefined) {
                return unref(prop);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            prop = (target as any)[`on${key}`];
            if (isFunction(prop)) {
                return () => prop.call(receiver, id, target.getState(id));
            } else if (prop != undefined) {
                return prop;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (target as any)[key];
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(target: Record<string, any>, key: string, value: any, receiver: typeof Proxy): boolean {
            key = `set${key.slice(0, 1).toUpperCase() + key.slice(1)}`;
            if (key in target && isFunction(target[key]) && target[key].length < 3) {
                target[key].call(receiver, id, value);
                return true;
            } else {
                console.warn(`No setter for "${key}".`, target);
                return false;
            }
        },
        ownKeys() {
            return keys;
        },
        has(target, key) {
            return keys.includes(key.toString());
        },
        getOwnPropertyDescriptor(target, key) {
            if (keys.includes(key.toString())) {
                return {
                    configurable: true,
                    enumerable: true,
                    writable: false
                };
            }
        }
    };
}

/**
 * Represents a cell within a grid. These properties will typically be accessed via a cell proxy that calls functions on the grid to get the properties for a specific cell.
 * @see {@link createGridProxy}
 */
export interface GridCell {
    /** A unique identifier for the grid cell. */
    id: string;
    /** Whether this cell should be visible. */
    visibility: Visibility | boolean;
    /** Whether this cell can be clicked. */
    canClick: boolean;
    /** The initial persistent state of this cell. */
    startState: State;
    /** The persistent state of this cell. */
    state: State;
    /** CSS to apply to this feature. */
    style?: StyleValue;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Record<string, boolean>;
    /** A header to appear at the top of the display. */
    title?: CoercableComponent;
    /** The main text that appears in the display. */
    display: CoercableComponent;
    /** A function that is called when the cell is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the cell is held down. */
    onHold?: VoidFunction;
}

/**
 * An object that configures a {@link Grid}.
 */
export interface GridOptions {
    /** Whether this grid should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** The number of rows in the grid. */
    rows: Computable<number>;
    /** The number of columns in the grid. */
    cols: Computable<number>;
    /** A computable to determine the visibility of a cell. */
    getVisibility?: CellComputable<Visibility | boolean>;
    /** A computable to determine if a cell can be clicked. */
    getCanClick?: CellComputable<boolean>;
    /** A computable to get the initial persistent state of a cell. */
    getStartState: Computable<State> | ((id: string | number) => State);
    /** A computable to get the CSS styles for a cell. */
    getStyle?: CellComputable<StyleValue>;
    /** A computable to get the CSS classes for a cell. */
    getClasses?: CellComputable<Record<string, boolean>>;
    /** A computable to get the title component for a cell. */
    getTitle?: CellComputable<CoercableComponent>;
    /** A computable to get the display component for a cell. */
    getDisplay: CellComputable<CoercableComponent>;
    /** A function that is called when a cell is clicked. */
    onClick?: (id: string | number, state: State, e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when a cell is held down. */
    onHold?: (id: string | number, state: State) => void;
}

/**
 * The properties that are added onto a processed {@link BoardOptions} to create a {@link Board}.
 */
export interface BaseGrid {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** Get the auto-generated ID for identifying a specific cell of this grid that appears in the DOM. Will not persist between refreshes or updates. */
    getID: (id: string | number, state: State) => string;
    /** Get the persistent state of the given cell. */
    getState: (id: string | number) => State;
    /** Set the persistent state of the given cell. */
    setState: (id: string | number, state: State) => void;
    /** A dictionary of cells within this grid. */
    cells: Record<string | number, GridCell>;
    /** The persistent state of this grid, which is a dictionary of cell states. */
    cellState: Persistent<Record<string | number, State>>;
    /** A symbol that helps identify features of the same type. */
    type: typeof GridType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature that is a grid of cells that all behave according to the same rules. */
export type Grid<T extends GridOptions> = Replace<
    T & BaseGrid,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        rows: GetComputableType<T["rows"]>;
        cols: GetComputableType<T["cols"]>;
        getVisibility: GetComputableTypeWithDefault<T["getVisibility"], Visibility.Visible>;
        getCanClick: GetComputableTypeWithDefault<T["getCanClick"], true>;
        getStartState: GetComputableType<T["getStartState"]>;
        getStyle: GetComputableType<T["getStyle"]>;
        getClasses: GetComputableType<T["getClasses"]>;
        getTitle: GetComputableType<T["getTitle"]>;
        getDisplay: GetComputableType<T["getDisplay"]>;
    }
>;

/** A type that matches any valid {@link Grid} object. */
export type GenericGrid = Replace<
    Grid<GridOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        getVisibility: ProcessedComputable<Visibility | boolean>;
        getCanClick: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates a grid with the given options.
 * @param optionsFunc Grid options.
 */
export function createGrid<T extends GridOptions>(
    optionsFunc: OptionsFunc<T, BaseGrid, GenericGrid>
): Grid<T> {
    const cellState = persistent<Record<string | number, State>>({}, false);
    return createLazyProxy(feature => {
        const grid = optionsFunc.call(feature, feature);
        grid.id = getUniqueID("grid-");
        grid[Component] = GridComponent as GenericComponent;

        grid.cellState = cellState;

        grid.getID = function (this: GenericGrid, cell: string | number) {
            return grid.id + "-" + cell;
        };
        grid.getState = function (this: GenericGrid, cell: string | number) {
            if (this.cellState.value[cell] != undefined) {
                return cellState.value[cell];
            }
            return this.cells[cell].startState;
        };
        grid.setState = function (this: GenericGrid, cell: string | number, state: State) {
            cellState.value[cell] = state;
        };

        grid.cells = createGridProxy(grid as GenericGrid);

        processComputable(grid as T, "visibility");
        setDefault(grid, "visibility", Visibility.Visible);
        processComputable(grid as T, "rows");
        processComputable(grid as T, "cols");
        processComputable(grid as T, "getVisibility");
        setDefault(grid, "getVisibility", Visibility.Visible);
        processComputable(grid as T, "getCanClick");
        setDefault(grid, "getCanClick", true);
        processComputable(grid as T, "getStartState");
        processComputable(grid as T, "getStyle");
        processComputable(grid as T, "getClasses");
        processComputable(grid as T, "getTitle");
        processComputable(grid as T, "getDisplay");

        if (grid.onClick) {
            const onClick = grid.onClick.bind(grid);
            grid.onClick = function (id, state, e) {
                if (unref((grid as GenericGrid).cells[id].canClick)) {
                    onClick(id, state, e);
                }
            };
        }
        if (grid.onHold) {
            const onHold = grid.onHold.bind(grid);
            grid.onHold = function (id, state) {
                if (unref((grid as GenericGrid).cells[id].canClick)) {
                    onHold(id, state);
                }
            };
        }

        grid[GatherProps] = function (this: GenericGrid) {
            const { visibility, rows, cols, cells, id } = this;
            return { visibility, rows, cols, cells, id };
        };

        return grid as unknown as Grid<T>;
    });
}
