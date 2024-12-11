/* eslint-disable @typescript-eslint/no-explicit-any */
import Column from "components/layout/Column.vue";
import Row from "components/layout/Row.vue";
import Clickable from "features/clickables/Clickable.vue";
import { getUniqueID, Visibility } from "features/feature";
import type { Persistent, State } from "game/persistence";
import { persistent } from "game/persistence";
import { isFunction } from "util/common";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import {
    isJSXElement,
    render,
    Renderable,
    VueFeature,
    vueFeatureMixin,
    VueFeatureOptions
} from "util/vue";
import type { CSSProperties, MaybeRef, MaybeRefOrGetter, Ref } from "vue";
import { computed, unref } from "vue";

/** A symbol used to identify {@link Grid} features. */
export const GridType = Symbol("Grid");

/** A type representing a MaybeRefOrGetter value for a cell in the grid. */
export type CellMaybeRefOrGetter<T> =
    | MaybeRefOrGetter<T>
    | ((row: number, col: number, state: State) => T);
export type ProcessedCellRefOrGetter<T> =
    | MaybeRef<T>
    | ((row: number, col: number, state: State) => T);

/**
 * Represents a cell within a grid. These properties will typically be accessed via a cell proxy that calls functions on the grid to get the properties for a specific cell.
 * @see {@link createGridProxy}
 */
export interface GridCell extends VueFeature {
    /** Which roe in the grid this cell is from. */
    row: number;
    /** Which col in the grid this cell is from. */
    col: number;
    /** Whether this cell can be clicked. */
    canClick: boolean;
    /** The initial persistent state of this cell. */
    startState: State;
    /** The persistent state of this cell. */
    state: State;
    /** The main text that appears in the display. */
    display: MaybeGetter<Renderable>;
    /** A function that is called when the cell is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the cell is held down. */
    onHold?: VoidFunction;
}

/**
 * An object that configures a {@link Grid}.
 */
export interface GridOptions extends VueFeatureOptions {
    /** The number of rows in the grid. */
    rows: MaybeRefOrGetter<number>;
    /** The number of columns in the grid. */
    cols: MaybeRefOrGetter<number>;
    /** A getter for the visibility of a cell. */
    getVisibility?: CellMaybeRefOrGetter<Visibility | boolean>;
    /** A getter for if a cell can be clicked. */
    getCanClick?: CellMaybeRefOrGetter<boolean>;
    /** A getter for the initial persistent state of a cell. */
    getStartState: MaybeRefOrGetter<State> | ((row: number, col: number) => State);
    /** A getter for the CSS styles for a cell. */
    getStyle?: CellMaybeRefOrGetter<CSSProperties>;
    /** A getter for the CSS classes for a cell. */
    getClasses?: CellMaybeRefOrGetter<Record<string, boolean>>;
    /** A getter for the display component for a cell. */
    getDisplay:
        | Renderable
        | ((row: number, col: number, state: State) => Renderable)
        | {
              getTitle?: Renderable | ((row: number, col: number, state: State) => Renderable);
              getDescription: Renderable | ((row: number, col: number, state: State) => Renderable);
          };
    /** A function that is called when a cell is clicked. */
    onClick?: (row: number, col: number, state: State, e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when a cell is held down. */
    onHold?: (row: number, col: number, state: State) => void;
}

/** An object that represents a feature that is a grid of cells that all behave according to the same rules. */
export interface Grid extends VueFeature {
    /** A function that is called when a cell is clicked. */
    onClick?: (row: number, col: number, state: State, e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when a cell is held down. */
    onHold?: (row: number, col: number, state: State) => void;
    /** A getter for determine the visibility of a cell. */
    getVisibility?: ProcessedCellRefOrGetter<Visibility | boolean>;
    /** A getter for determine if a cell can be clicked. */
    getCanClick?: ProcessedCellRefOrGetter<boolean>;
    /** The number of rows in the grid. */
    rows: MaybeRef<number>;
    /** The number of columns in the grid. */
    cols: MaybeRef<number>;
    /** A getter for the initial persistent state of a cell. */
    getStartState: MaybeRef<State> | ((row: number, col: number) => State);
    /** A getter for the CSS styles for a cell. */
    getStyle?: ProcessedCellRefOrGetter<CSSProperties>;
    /** A getter for the CSS classes for a cell. */
    getClasses?: ProcessedCellRefOrGetter<Record<string, boolean>>;
    /** A getter for the display component for a cell. */
    getDisplay: Renderable | ((row: number, col: number, state: State) => Renderable);
    /** Get the auto-generated ID for identifying a specific cell of this grid that appears in the DOM. Will not persist between refreshes or updates. */
    getID: (row: number, col: number, state: State) => string;
    /** Get the persistent state of the given cell. */
    getState: (row: number, col: number) => State;
    /** Set the persistent state of the given cell. */
    setState: (row: number, col: number, state: State) => void;
    /** A dictionary of cells within this grid. */
    cells: GridCell[][];
    /** The persistent state of this grid, which is a dictionary of cell states. */
    cellState: Persistent<Record<number, Record<number, State>>>;
    /** A symbol that helps identify features of the same type. */
    type: typeof GridType;
}

function getCellRowHandler(grid: Grid, row: number) {
    return new Proxy({} as GridCell[], {
        get(target, key) {
            if (key === "length") {
                return unref(grid.cols);
            }
            if (typeof key !== "number" && typeof key !== "string") {
                return;
            }

            const keyNum = typeof key === "number" ? key : parseInt(key);
            if (Number.isFinite(keyNum) && keyNum < unref(grid.cols)) {
                if (keyNum in target) {
                    return target[keyNum];
                }
                return (target[keyNum] = getCellHandler(grid, row, keyNum));
            }
        },
        set(target, key, value) {
            console.warn("Cannot set grid cells", target, key, value);
            return false;
        },
        ownKeys() {
            return [...new Array(unref(grid.cols)).fill(0).map((_, i) => "" + i), "length"];
        },
        has(target, key) {
            if (key === "length") {
                return true;
            }
            if (typeof key !== "number" && typeof key !== "string") {
                return false;
            }
            const keyNum = typeof key === "number" ? key : parseInt(key);
            if (!Number.isFinite(keyNum) || keyNum >= unref(grid.cols)) {
                return false;
            }
            return true;
        },
        getOwnPropertyDescriptor(target, key) {
            if (typeof key !== "number" && typeof key !== "string") {
                return;
            }
            const keyNum = typeof key === "number" ? key : parseInt(key);
            if (key !== "length" && (!Number.isFinite(keyNum) || keyNum >= unref(grid.cols))) {
                return;
            }
            return {
                configurable: true,
                enumerable: true,
                writable: false
            };
        }
    });
}

/**
 * Returns traps for a proxy that will get the properties for the specified cell
 * @param id The grid cell ID to get properties from.
 * @see {@link getGridHandler}
 * @see {@link createGridProxy}
 */
function getCellHandler(grid: Grid, row: number, col: number): GridCell {
    const keys = [
        "id",
        "visibility",
        "classes",
        "style",
        "components",
        "wrappers",
        VueFeature,
        "row",
        "col",
        "canClick",
        "startState",
        "state",
        "title",
        "display",
        "onClick",
        "onHold"
    ] as const;
    const cache: Record<string, Ref<unknown>> = {};
    return new Proxy({} as GridCell, {
        // The typing in this function is absolutely atrocious in order to support custom properties
        get(target, key, receiver) {
            switch (key) {
                case "wrappers":
                    return [];
                case VueFeature:
                    return true;
                case "row":
                    return row;
                case "col":
                    return col;
                case "startState": {
                    if (typeof grid.getStartState === "function") {
                        return grid.getStartState(row, col);
                    }
                    return unref(grid.getStartState);
                }
                case "state": {
                    return grid.getState(row, col);
                }
                case "id":
                    return (target.id = target.id ?? getUniqueID("gridcell"));
                case "components":
                    return [
                        computed(() => (
                            <Clickable
                                onClick={receiver.onClick}
                                onHold={receiver.onHold}
                                display={receiver.display}
                                canClick={receiver.canClick}
                            />
                        ))
                    ];
            }

            if (typeof key === "symbol") {
                return (grid as any)[key];
            }

            key = key.slice(0, 1).toUpperCase() + key.slice(1);

            let prop = (grid as any)[`get${key}`];
            if (isFunction(prop)) {
                if (!(key in cache)) {
                    cache[key] = computed(() =>
                        prop.call(receiver, row, col, grid.getState(row, col))
                    );
                }
                return cache[key].value;
            } else if (prop != null) {
                return unref(prop);
            }

            prop = (grid as any)[`on${key}`];
            if (isFunction(prop)) {
                return () => prop.call(receiver, row, col, grid.getState(row, col));
            } else if (prop != null) {
                return prop;
            }

            // Revert key change
            key = key.slice(0, 1).toLowerCase() + key.slice(1);
            prop = (grid as any)[key];

            if (isFunction(prop)) {
                return () => prop.call(receiver, row, col, grid.getState(row, col));
            }

            return (grid as any)[key];
        },
        set(target, key, value) {
            if (typeof key !== "string") {
                return false;
            }
            key = `set${key.slice(0, 1).toUpperCase() + key.slice(1)}`;
            if (key in grid && isFunction((grid as any)[key]) && (grid as any)[key].length <= 3) {
                (grid as any)[key].call(grid, row, col, value);
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
            return (keys as readonly (string | symbol)[]).includes(key);
        },
        getOwnPropertyDescriptor(target, key) {
            if ((keys as readonly (string | symbol)[]).includes(key)) {
                return {
                    configurable: true,
                    enumerable: true,
                    writable: false
                };
            }
        }
    });
}

function convertCellMaybeRefOrGetter<T>(
    value: NonNullable<CellMaybeRefOrGetter<T>>
): ProcessedCellRefOrGetter<T>;
function convertCellMaybeRefOrGetter<T>(
    value: CellMaybeRefOrGetter<T> | undefined
): ProcessedCellRefOrGetter<T> | undefined;
function convertCellMaybeRefOrGetter<T>(
    value: CellMaybeRefOrGetter<T>
): ProcessedCellRefOrGetter<T> {
    if (typeof value === "function" && value.length > 0) {
        return value;
    }
    return processGetter(value) as MaybeRef<T>;
}

/**
 * Lazily creates a grid with the given options.
 * @param optionsFunc Grid options.
 */
export function createGrid<T extends GridOptions>(optionsFunc: () => T) {
    const cellState = persistent<Record<number, Record<number, State>>>({}, false);
    return createLazyProxy(() => {
        const options = optionsFunc();
        const {
            rows,
            cols,
            getVisibility,
            getCanClick,
            getStartState,
            getStyle,
            getClasses,
            getDisplay: _getDisplay,
            onClick,
            onHold,
            ...props
        } = options;

        let getDisplay;
        if (typeof _getDisplay === "object" && !isJSXElement(_getDisplay)) {
            const { getTitle, getDescription } = _getDisplay;
            getDisplay = function (row: number, col: number, state: State) {
                const title = typeof getTitle === "function" ? getTitle(row, col, state) : getTitle;
                const description =
                    typeof getDescription === "function"
                        ? getDescription(row, col, state)
                        : getDescription;
                return (
                    <>
                        {title}
                        {description}
                    </>
                );
            };
        } else {
            getDisplay = _getDisplay;
        }

        const grid = {
            type: GridType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof GridOptions>),
            ...vueFeatureMixin("grid", options, () => (
                <Column>
                    {new Array(unref(grid.rows)).fill(0).map((_, row) => (
                        <Row>
                            {new Array(unref(grid.cols))
                                .fill(0)
                                .map((_, col) => render(grid.cells[row][col]))}
                        </Row>
                    ))}
                </Column>
            )),
            cellState,
            cells: new Proxy({} as GridCell[][], {
                get(target, key: PropertyKey) {
                    if (key === "length") {
                        return unref(grid.rows);
                    }

                    if (typeof key !== "number" && typeof key !== "string") {
                        return;
                    }

                    const keyNum = typeof key === "number" ? key : parseInt(key);
                    if (Number.isFinite(keyNum) && keyNum < unref(grid.rows)) {
                        if (!(keyNum in target)) {
                            target[keyNum] = getCellRowHandler(grid, keyNum);
                        }
                        return target[keyNum];
                    }
                },
                set(target, key, value) {
                    console.warn("Cannot set grid cells", target, key, value);
                    return false;
                },
                ownKeys(): string[] {
                    return [...new Array(unref(grid.rows)).fill(0).map((_, i) => "" + i), "length"];
                },
                has(target, key) {
                    if (key === "length") {
                        return true;
                    }
                    if (typeof key !== "number" && typeof key !== "string") {
                        return false;
                    }
                    const keyNum = typeof key === "number" ? key : parseInt(key);
                    if (!Number.isFinite(keyNum) || keyNum >= unref(grid.rows)) {
                        return false;
                    }
                    return true;
                },
                getOwnPropertyDescriptor(target, key) {
                    if (typeof key !== "number" && typeof key !== "string") {
                        return;
                    }
                    const keyNum = typeof key === "number" ? key : parseInt(key);
                    if (
                        key !== "length" &&
                        (!Number.isFinite(keyNum) || keyNum >= unref(grid.rows))
                    ) {
                        return;
                    }
                    return {
                        configurable: true,
                        enumerable: true,
                        writable: false
                    };
                }
            }),
            rows: processGetter(rows),
            cols: processGetter(cols),
            getVisibility: convertCellMaybeRefOrGetter(getVisibility ?? true),
            getCanClick: convertCellMaybeRefOrGetter(getCanClick ?? true),
            getStartState:
                typeof getStartState === "function" && getStartState.length > 0
                    ? getStartState
                    : processGetter(getStartState),
            getStyle: convertCellMaybeRefOrGetter(getStyle),
            getClasses: convertCellMaybeRefOrGetter(getClasses),
            getDisplay,
            getID: function (row: number, col: number): string {
                return grid.id + "-" + row + "-" + col;
            },
            getState: function (row: number, col: number): State {
                cellState.value[row] ??= {};
                if (cellState.value[row][col] != null) {
                    return cellState.value[row][col];
                }
                return grid.cells[row][col].startState;
            },
            setState: function (row: number, col: number, state: State) {
                cellState.value[row] ??= {};
                cellState.value[row][col] = state;
            },
            onClick:
                onClick == null
                    ? undefined
                    : function (row, col, state, e) {
                          if (grid.cells[row][col].canClick !== false) {
                              onClick.call(grid, row, col, state, e);
                          }
                      },
            onHold:
                onHold == null
                    ? undefined
                    : function (row, col, state) {
                          if (grid.cells[row][col].canClick !== false) {
                              onHold.call(grid, row, col, state);
                          }
                      }
        } satisfies Grid;

        return grid;
    });
}
