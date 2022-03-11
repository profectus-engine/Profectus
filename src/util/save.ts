import projInfo from "data/projInfo.json";
import player, { Player, PlayerData, stringifySave } from "game/player";
import settings, { loadSettings } from "game/settings";
import { ProxyState } from "./proxies";

export function setupInitialStore(player: Partial<PlayerData> = {}): Player {
    return Object.assign(
        {
            id: `${projInfo.id}-0`,
            name: "Default Save",
            tabs: projInfo.initialTabs.slice(),
            time: Date.now(),
            autosave: true,
            offlineProd: true,
            offlineTime: 0,
            timePlayed: 0,
            keepGoing: false,
            modID: projInfo.id,
            modVersion: projInfo.versionNumber,
            layers: {}
        },
        player
    ) as Player;
}

export function save(): string {
    const stringifiedSave = btoa(unescape(encodeURIComponent(stringifySave(player[ProxyState]))));
    localStorage.setItem(player.id, stringifiedSave);
    return stringifiedSave;
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
        const player = JSON.parse(decodeURIComponent(escape(atob(save))));
        if (player.modID !== projInfo.id) {
            await loadSave(newSave());
            return;
        }
        player.id = settings.active;
        await loadSave(player);
    } catch (e) {
        console.error("Failed to load save. Falling back to new save.\n", e);
        await loadSave(newSave());
    }
}

export function newSave(): PlayerData {
    const id = getUniqueID();
    const player = setupInitialStore({ id });
    localStorage.setItem(id, btoa(unescape(encodeURIComponent(stringifySave(player)))));

    settings.saves.push(id);

    return player;
}

export function getUniqueID(): string {
    let id,
        i = 0;
    do {
        id = `${projInfo.id}-${i++}`;
    } while (localStorage.getItem(id));
    return id;
}

export async function loadSave(playerObj: Partial<PlayerData>): Promise<void> {
    console.info("Loading save", playerObj);
    const { layers, removeLayer, addLayer } = await import("game/layers");
    const { fixOldSave, getInitialLayers } = await import("data/projEntry");

    for (const layer in layers) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        removeLayer(layers[layer]!);
    }
    getInitialLayers(playerObj).forEach(layer => addLayer(layer, playerObj));

    playerObj = setupInitialStore(playerObj);
    if (playerObj.offlineProd && playerObj.time) {
        if (playerObj.offlineTime == undefined) playerObj.offlineTime = 0;
        playerObj.offlineTime += (Date.now() - playerObj.time) / 1000;
    }
    playerObj.time = Date.now();
    if (playerObj.modVersion !== projInfo.versionNumber) {
        fixOldSave(playerObj.modVersion, playerObj);
    }

    Object.assign(player, playerObj);
    settings.active = player.id;
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
