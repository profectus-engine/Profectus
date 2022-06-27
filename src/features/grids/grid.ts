import type { CoercableComponent, OptionsFunc, Replace, StyleValue } from "features/feature";
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

export const GridType = Symbol("Grid");

export type CellComputable<T> = Computable<T> | ((id: string | number, state: State) => T);

function createGridProxy(grid: GenericGrid): Record<string | number, GridCell> {
    return new Proxy({}, getGridHandler(grid)) as Record<string | number, GridCell>;
}

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

export interface GridCell {
    id: string;
    visibility: Visibility;
    canClick: boolean;
    startState: State;
    state: State;
    style?: StyleValue;
    classes?: Record<string, boolean>;
    title?: CoercableComponent;
    display: CoercableComponent;
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    onHold?: VoidFunction;
}

export interface GridOptions {
    visibility?: Computable<Visibility>;
    rows: Computable<number>;
    cols: Computable<number>;
    getVisibility?: CellComputable<Visibility>;
    getCanClick?: CellComputable<boolean>;
    getStartState: Computable<State> | ((id: string | number) => State);
    getStyle?: CellComputable<StyleValue>;
    getClasses?: CellComputable<Record<string, boolean>>;
    getTitle?: CellComputable<CoercableComponent>;
    getDisplay: CellComputable<CoercableComponent>;
    onClick?: (id: string | number, state: State, e?: MouseEvent | TouchEvent) => void;
    onHold?: (id: string | number, state: State) => void;
}

export interface BaseGrid {
    id: string;
    getID: (id: string | number, state: State) => string;
    getState: (id: string | number) => State;
    setState: (id: string | number, state: State) => void;
    cells: Record<string | number, GridCell>;
    cellState: Persistent<Record<string | number, State>>;
    type: typeof GridType;
    [Component]: typeof GridComponent;
    [GatherProps]: () => Record<string, unknown>;
}

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

export type GenericGrid = Replace<
    Grid<GridOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        getVisibility: ProcessedComputable<Visibility>;
        getCanClick: ProcessedComputable<boolean>;
    }
>;

export function createGrid<T extends GridOptions>(
    optionsFunc: OptionsFunc<T, BaseGrid, GenericGrid>
): Grid<T> {
    const cellState = persistent<Record<string | number, State>>({});
    return createLazyProxy(() => {
        const grid = optionsFunc();
        grid.id = getUniqueID("grid-");
        grid[Component] = GridComponent;

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
            grid.onClick = function (id, state) {
                if (unref((grid as GenericGrid).cells[id].canClick)) {
                    onClick(id, state);
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
