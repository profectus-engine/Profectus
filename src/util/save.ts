import projInfo from "data/projInfo.json";
import player, { Player, PlayerData, stringifySave } from "game/player";
import settings, { loadSettings } from "game/settings";
import { ProxyState } from "./proxies";
import LZString from "lz-string";

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

export function save(playerData?: PlayerData): string {
    const stringifiedSave = LZString.compressToUTF16(
        stringifySave(playerData ?? player[ProxyState])
    );
    localStorage.setItem((playerData ?? player[ProxyState]).id, stringifiedSave);
    return stringifiedSave;
}

export async function load(): Promise<void> {
    // Load global settings
    loadSettings();

    try {
        let save = localStorage.getItem(settings.active);
        if (save == null) {
            await loadSave(newSave());
            return;
        }
        if (save[0] === "{") {
            // plaintext. No processing needed
        } else if (save[0] === "e") {
            // Assumed to be base64, which starts with e
            save = decodeURIComponent(escape(atob(save)));
        } else if (save[0] === "ᯡ") {
            // Assumed to be lz, which starts with ᯡ
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            save = LZString.decompressFromUTF16(save)!;
        } else {
            throw `Unable to determine save encoding`;
        }
        const player = JSON.parse(save);
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
    save(player);

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
        const l = layers[layer];
        if (l) {
            removeLayer(l);
        }
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
