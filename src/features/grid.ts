import GridComponent from "@/components/features/Grid.vue";
import {
    CoercableComponent,
    Component,
    getUniqueID,
    makePersistent,
    Persistent,
    PersistentState,
    Replace,
    setDefault,
    State,
    StyleValue,
    Visibility
} from "@/features/feature";
import { isFunction } from "@/util/common";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy, Proxied } from "@/util/proxies";
import { unref } from "vue";

export const GridType = Symbol("Grid");

export type CellComputable<T> = Computable<T> | ((id: string | number, state: State) => T);

function createGridProxy(object: Record<string, unknown>): Record<string | number, GridCell> {
    if (object.isProxy) {
        console.warn(
            "Creating a proxy out of a proxy! This may cause unintentional function calls and stack overflows."
        );
    }
    return new Proxy(object, gridHandler) as Proxied<Record<string | number, GridCell>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gridHandler: ProxyHandler<Record<PropertyKey, any>> = {
    get(target, key) {
        if (key === "isProxy") {
            return true;
        }

        if (target[key] == null) {
            target[key] = new Proxy(target, getCellHandler(key.toString()));
        }

        return target[key];
    },
    set(target, key, value) {
        console.warn("Cannot set grid cells", target, key, value);
        return false;
    }
};

function getCellHandler(id: string) {
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get(target: Record<string, any>, key: string, receiver: typeof Proxy): any {
            if (key === "isProxy") {
                return true;
            }

            let prop = target[key];

            if (isFunction(prop)) {
                return () => prop.call(receiver, id, target.getState(id));
            }
            if (prop != undefined || key.slice == undefined) {
                return prop;
            }

            key = key.slice(0, 1).toUpperCase() + key.slice(1);
            prop = target[`get${key}`];
            if (isFunction(prop)) {
                return prop.call(receiver, id, target.getState(id));
            } else if (prop != undefined) {
                return unref(prop);
            }

            prop = target[`on${key}`];
            if (isFunction(prop)) {
                return () => prop.call(receiver, id, target.getState(id));
            } else if (prop != undefined) {
                return prop;
            }

            return target[key];
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(target: Record<string, any>, key: string, value: any, receiver: typeof Proxy): boolean {
            if (
                `${key}Set` in target &&
                isFunction(target[`${key}Set`]) &&
                target[`${key}Set`].length < 3
            ) {
                target[`${key}Set`].call(receiver, id, value);
                return true;
            } else {
                console.warn(`No setter for "${key}".`, target);
                return false;
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
    onClick?: VoidFunction;
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
    onClick?: (id: string | number, state: State) => void;
    onHold?: (id: string | number, state: State) => void;
}

export interface BaseGrid extends Persistent<Record<string | number, State>> {
    id: string;
    getID: (id: string | number, state: State) => string;
    getState: (id: string | number, state: State) => State;
    setState: (id: string | number, state: State) => void;
    cells: Record<string | number, GridCell>;
    type: typeof GridType;
    [Component]: typeof GridComponent;
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

export function createGrid<T extends GridOptions>(options: T & ThisType<Grid<T>>): Grid<T> {
    const grid: T & Partial<BaseGrid> = options;
    makePersistent(grid, {});
    grid.id = getUniqueID("grid-");
    grid[Component] = GridComponent;

    grid.cells = createGridProxy(grid as unknown as Record<string, unknown>);
    grid.getID = function (this: GenericGrid, cell: string | number) {
        return grid.id + "-" + cell;
    };
    grid.getState = function (this: GenericGrid, cell: string | number) {
        if (this[PersistentState].value[cell] != undefined) {
            return this[PersistentState].value[cell];
        }
        return this.cells[cell].startState;
    };
    grid.setState = function (this: GenericGrid, cell: string | number, state: State) {
        this[PersistentState].value[cell] = state;
    };

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

    const proxy = createProxy(grid as unknown as Grid<T>);
    return proxy;
}
