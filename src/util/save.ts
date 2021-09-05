import { fixOldSave, getInitialLayers, getStartingData } from "@/data/mod";
import modInfo from "@/data/modInfo.json";
import player from "@/game/player";
import settings, { loadSettings } from "@/game/settings";
import state from "@/game/state";
import { PlayerData } from "@/typings/player";
import Decimal from "./bignum";

export function getInitialStore(playerData: Partial<PlayerData> = {}): PlayerData {
    return applyPlayerData(
        {
            id: `${modInfo.id}-0`,
            points: new Decimal(0),
            name: "Default Save",
            tabs: modInfo.initialTabs.slice(),
            time: Date.now(),
            autosave: true,
            offlineProd: true,
            offlineTime: new Decimal(0),
            timePlayed: new Decimal(0),
            keepGoing: false,
            subtabs: {},
            minimized: {},
            modID: modInfo.id,
            modVersion: modInfo.versionNumber,
            layers: {},
            justLoaded: false,
            ...getStartingData()
        },
        playerData
    ) as PlayerData;
}

export function save(): void {
    state.saveToExport = btoa(unescape(encodeURIComponent(JSON.stringify(player.__state))));
    localStorage.setItem(player.id, state.saveToExport);
}

export async function load(): Promise<void> {
    // Load global settings
    loadSettings();

    try {
        const save = localStorage.getItem(settings.active);
        if (save == null) {
            await loadSave(newSave());
            return;
        }
        const playerData = JSON.parse(decodeURIComponent(escape(atob(save))));
        if (playerData.modID !== modInfo.id) {
            await loadSave(newSave());
            return;
        }
        playerData.id = settings.active;
        await loadSave(playerData);
    } catch (e) {
        await loadSave(newSave());
    }
}

export function newSave(): PlayerData {
    const id = getUniqueID();
    const playerData = getInitialStore({ id });
    localStorage.setItem(id, btoa(unescape(encodeURIComponent(JSON.stringify(playerData)))));

    settings.saves.push(id);

    return playerData;
}

export function getUniqueID(): string {
    let id,
        i = 0;
    do {
        id = `${modInfo.id}-${i++}`;
    } while (localStorage.getItem(id));
    return id;
}

export async function loadSave(playerData: Partial<PlayerData>): Promise<void> {
    const { layers, removeLayer, addLayer } = await import("../game/layers");

    for (const layer in layers) {
        removeLayer(layer);
    }
    getInitialLayers(playerData).forEach(layer => addLayer(layer, playerData));

    playerData = getInitialStore(playerData);
    if (playerData.offlineProd && playerData.time) {
        if (playerData.offlineTime == undefined) playerData.offlineTime = new Decimal(0);
        playerData.offlineTime = playerData.offlineTime.add((Date.now() - playerData.time) / 1000);
    }
    playerData.time = Date.now();
    if (playerData.modVersion !== modInfo.versionNumber) {
        fixOldSave(playerData.modVersion, playerData);
    }

    Object.assign(player, playerData);
    for (const prop in player) {
        if (!(prop in playerData) && !(prop in layers) && prop !== "__state" && prop !== "__path") {
            delete player.layers[prop];
        }
    }
    player.justLoaded = true;
    settings.active = player.id;
}

export function applyPlayerData<T extends Record<string, any>>(
    target: T,
    source: T,
    destructive = false
): T {
    for (const prop in source) {
        if (target[prop] == null) {
            target[prop] = source[prop];
        } else if (target[prop as string] instanceof Decimal) {
            target[prop as keyof T] = new Decimal(source[prop]) as any;
        } else if (Array.isArray(target[prop]) || typeof target[prop] === "object") {
            target[prop] = applyPlayerData(target[prop], source[prop], destructive);
        } else {
            target[prop] = source[prop];
        }
    }
    if (destructive) {
        for (const prop in target) {
            if (!(prop in source)) {
                delete target[prop];
            }
        }
    }
    return target;
}

setInterval(() => {
    if (player.autosave) {
        save();
    }
}, 1000);
window.onbeforeunload = () => {
    if (player.autosave) {
        save();
    }
};
window.save = save;
export const hardReset = (window.hardReset = async () => {
    await loadSave(newSave());
});
