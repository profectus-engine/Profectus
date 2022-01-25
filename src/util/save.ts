import modInfo from "@/data/modInfo.json";
import player, { Player, PlayerData, stringifySave } from "@/game/player";
import settings, { loadSettings } from "@/game/settings";
import Decimal from "./bignum";

export function setupInitialStore(player: Partial<PlayerData> = {}): asserts player is Player {
    Object.assign(
        {
            id: `${modInfo.id}-0`,
            name: "Default Save",
            tabs: modInfo.initialTabs.slice(),
            time: Date.now(),
            autosave: true,
            offlineProd: true,
            offlineTime: new Decimal(0),
            timePlayed: new Decimal(0),
            keepGoing: false,
            modID: modInfo.id,
            modVersion: modInfo.versionNumber,
            layers: {}
        },
        player
    );
}

export function save(): string {
    const stringifiedSave = btoa(unescape(encodeURIComponent(stringifySave(player))));
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
        if (player.modID !== modInfo.id) {
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
    const player = { id };
    setupInitialStore(player);
    localStorage.setItem(id, btoa(unescape(encodeURIComponent(stringifySave(player)))));

    settings.saves.push(id);

    return player;
}

export function getUniqueID(): string {
    let id,
        i = 0;
    do {
        id = `${modInfo.id}-${i++}`;
    } while (localStorage.getItem(id));
    return id;
}

export async function loadSave(playerObj: Partial<PlayerData>): Promise<void> {
    console.info("Loading save", playerObj);
    const { layers, removeLayer, addLayer } = await import("@/game/layers");
    const { fixOldSave, getInitialLayers } = await import("@/data/mod");

    for (const layer in layers) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        removeLayer(layers[layer]!);
    }
    console.log(getInitialLayers(playerObj))
    getInitialLayers(playerObj).forEach(layer => addLayer(layer, playerObj));

    setupInitialStore(playerObj);
    if (playerObj.offlineProd && playerObj.time) {
        if (playerObj.offlineTime == undefined) playerObj.offlineTime = new Decimal(0);
        playerObj.offlineTime = playerObj.offlineTime.add((Date.now() - playerObj.time) / 1000);
    }
    playerObj.time = Date.now();
    if (playerObj.modVersion !== modInfo.versionNumber) {
        fixOldSave(playerObj.modVersion, playerObj);
    }

    Object.assign(player, playerObj);
    settings.active = playerObj.id;
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
