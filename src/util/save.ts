import { fixOldSave, getInitialLayers, getStartingData } from "@/data/mod";
import modInfo from "@/data/modInfo.json";
import { Themes } from "@/data/themes";
import { ImportingStatus, MilestoneDisplay } from "@/game/enums";
import player from "@/game/player";
import { ModSaveData, PlayerData } from "@/typings/player";
import Decimal from "./bignum";

export function getInitialStore(playerData: Partial<PlayerData> = {}): PlayerData {
    return applyPlayerData(
        {
            id: `${modInfo.id}-0`,
            points: new Decimal(0),
            oomps: new Decimal(0),
            oompsMag: 0,
            name: "Default Save",
            tabs: modInfo.initialTabs.slice(),
            time: Date.now(),
            autosave: true,
            offlineProd: true,
            offlineTime: new Decimal(0),
            timePlayed: new Decimal(0),
            keepGoing: false,
            lastTenTicks: [],
            showTPS: true,
            msDisplay: MilestoneDisplay.All,
            hideChallenges: false,
            theme: Themes.Nordic,
            subtabs: {},
            minimized: {},
            modID: modInfo.id,
            modVersion: modInfo.versionNumber,
            layers: {},
            justLoaded: false,
            ...getStartingData(),

            // Values that don't get loaded/saved
            hasNaN: false,
            NaNPath: [],
            NaNReceiver: null,
            importing: ImportingStatus.NotImporting,
            saveToImport: "",
            saveToExport: ""
        },
        playerData
    ) as PlayerData;
}

export function save(): void {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
        hasNaN,
        NaNPath,
        NaNReceiver,
        importing,
        saveToImport,
        saveToExport,
        ...playerData
    } = player.__state as PlayerData;
    /* eslint-enable @typescript-eslint/no-unused-vars */
    player.saveToExport = btoa(unescape(encodeURIComponent(JSON.stringify(playerData))));

    localStorage.setItem(player.id, player.saveToExport);
}

export async function load(): Promise<void> {
    try {
        let modData: string | ModSaveData | null = localStorage.getItem(modInfo.id);
        if (modData == null) {
            await loadSave(newSave());
            return;
        }
        modData = JSON.parse(decodeURIComponent(escape(atob(modData)))) as ModSaveData;
        if (modData?.active == null) {
            await loadSave(newSave());
            return;
        }
        const save = localStorage.getItem(modData.active);
        if (save == null) {
            await loadSave(newSave());
            return;
        }
        const playerData = JSON.parse(decodeURIComponent(escape(atob(save))));
        if (playerData.modID !== modInfo.id) {
            await loadSave(newSave());
            return;
        }
        playerData.id = modData.active;
        await loadSave(playerData);
    } catch (e) {
        await loadSave(newSave());
    }
}

export function newSave(): PlayerData {
    const id = getUniqueID();
    const playerData = getInitialStore({ id });
    localStorage.setItem(id, btoa(unescape(encodeURIComponent(JSON.stringify(playerData)))));

    const rawModData = localStorage.getItem(modInfo.id);
    if (rawModData == null) {
        const modData = { active: id, saves: [id] };
        localStorage.setItem(
            modInfo.id,
            btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
        );
    } else {
        const modData = JSON.parse(decodeURIComponent(escape(atob(rawModData))));
        modData.saves.push(id);
        localStorage.setItem(
            modInfo.id,
            btoa(unescape(encodeURIComponent(JSON.stringify(modData))))
        );
    }

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
    const modData = JSON.parse(decodeURIComponent(escape(atob(localStorage.getItem(modInfo.id)!))));
    modData.active = player.id;
    localStorage.setItem(modInfo.id, btoa(unescape(encodeURIComponent(JSON.stringify(modData)))));
});
