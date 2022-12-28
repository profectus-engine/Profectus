import type { Ref } from "vue";
import { reactive, unref } from "vue";

/** The player save data object. */
export interface Player {
    /** The ID of this save. */
    id: string;
    /** A multiplier for time passing. Set to 0 when the game is paused. */
    devSpeed: number | null;
    /** The display name of this save. */
    name: string;
    /** The open tabs. */
    tabs: Array<string>;
    /** The current time this save was last opened at, in ms since the unix epoch. */
    time: number;
    /** Whether or not to automatically save every couple of seconds and on tab close. */
    autosave: boolean;
    /** Whether or not to apply offline time when loading this save. */
    offlineProd: boolean;
    /** How much offline time has been accumulated and not yet processed. */
    offlineTime: number | null;
    /** How long, in ms, this game has been played. */
    timePlayed: number;
    /** Whether or not to continue playing after {@link data/projEntry.hasWon} is true. */
    keepGoing: boolean;
    /** The ID of this project, to make sure saves aren't imported into the wrong project. */
    modID: string;
    /** The version of the project this save was created by. Used for upgrading saves for new versions. */
    modVersion: string;
    /** A dictionary of layer save data. */
    layers: Record<string, LayerData<unknown>>;
}

/** A layer's save data. Automatically unwraps refs. */
export type LayerData<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? Record<string, LayerData<U>>
        : T[P] extends Record<string, never>
        ? never
        : T[P] extends Ref<infer S>
        ? S
        : T[P] extends object
        ? LayerData<T[P]>
        : T[P];
};

const player = reactive<Player>({
    id: "",
    devSpeed: null,
    name: "",
    tabs: [],
    time: -1,
    autosave: true,
    offlineProd: true,
    offlineTime: null,
    timePlayed: 0,
    keepGoing: false,
    modID: "",
    modVersion: "",
    layers: {}
});

export default window.player = player;

/** Convert a player save data object into a JSON string. Unwraps refs. */
export function stringifySave(player: Player): string {
    return JSON.stringify(player, (key, value) => unref(value));
}

declare global {
    /** Augment the window object so the player can be accessed from the console. */
    interface Window {
        player: Player;
    }
}
