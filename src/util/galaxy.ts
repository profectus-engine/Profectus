import player, { Player, stringifySave } from "game/player";
import settings from "game/settings";
import LZString from "lz-string";
import { GalaxyApi, initGalaxy } from "unofficial-galaxy-sdk";
import { ref } from "vue";
import { decodeSave, LoadablePlayerData, loadSave, save, setupInitialStore } from "./save";

export const galaxy = ref<GalaxyApi>();
export const conflictingSaves = ref<
    { id: string; local: LoadablePlayerData; cloud: LoadablePlayerData; slot: number }[]
>([]);
export const syncedSaves = ref<string[]>([]);

export function sync() {
    if (galaxy.value?.loggedIn !== true) {
        return;
    }
    if (conflictingSaves.value.length > 0) {
        // Pause syncing while resolving conflicted saves
        return;
    }
    galaxy.value
        .getSaveList()
        .then(syncSaves)
        .then(list => {
            syncedSaves.value = list.map(s => s.content.id);
        })
        .catch(console.error);
}

// Setup Galaxy API
initGalaxy({
    supportsSaving: true,
    supportsSaveManager: true,
    onLoggedInChanged
})
    .then(g => {
        galaxy.value = g;
        onLoggedInChanged(g);
    })
    .catch(console.error);

function onLoggedInChanged(g: GalaxyApi) {
    if (g.loggedIn !== true) {
        return;
    }
    if (conflictingSaves.value.length > 0) {
        // Pause syncing while resolving conflicted saves
        return;
    }

    g.getSaveList()
        .then(list => {
            const saves = syncSaves(list);
            syncedSaves.value = saves.map(s => s.content.id);

            // If our current save has under 2 minutes of playtime, load the cloud save with the most recent time.
            if (player.timePlayed < 120 * 1000 && saves.length > 0) {
                const longestSave = saves.reduce((acc, curr) =>
                    acc.content.time < curr.content.time ? curr : acc
                );
                loadSave(longestSave.content);
            }
        })
        .catch(console.error);

    setInterval(sync, 60 * 1000);
}

function syncSaves(
    list: Record<
        number,
        {
            label: string;
            content: string;
        }
    >
) {
    const savesToUpload = new Set(settings.saves.slice());
    const availableSlots = new Set(new Array(11).fill(0).map((_, i) => i));
    const saves = (
        Object.keys(list)
            .map(slot => {
                const { label, content } = list[parseInt(slot)];
                try {
                    return {
                        slot: parseInt(slot),
                        label,
                        content: JSON.parse(decodeSave(content) ?? "")
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(
                n =>
                    n != null &&
                    typeof n.content.id === "string" &&
                    typeof n.content.time === "number" &&
                    typeof n.content.timePlayed === "number"
            ) as {
            slot: number;
            label?: string;
            content: Partial<Player> & { id: string; time: number; timePlayed: number };
        }[]
    ).filter(cloudSave => {
        if (cloudSave.label != null) {
            cloudSave.content.name = cloudSave.label;
        }
        availableSlots.delete(cloudSave.slot);
        const localSaveId = settings.saves.find(id => id === cloudSave.content.id);
        if (localSaveId == null) {
            settings.saves.push(cloudSave.content.id);
            save(setupInitialStore(cloudSave.content));
        } else {
            savesToUpload.delete(localSaveId);
            try {
                const localSave = JSON.parse(
                    decodeSave(localStorage.getItem(localSaveId) ?? "") ?? ""
                ) as Partial<Player> | null;
                if (localSave == null) {
                    return false;
                }
                localSave.id = localSaveId;
                localSave.time = localSave.time ?? 0;
                localSave.timePlayed = localSave.timePlayed ?? 0;

                const timePlayedDiff = Math.abs(
                    localSave.timePlayed - cloudSave.content.timePlayed
                );
                const timeDiff = Math.abs(localSave.time - cloudSave.content.time);
                // If their last played time and total time played are both within 2 minutes, just use the newer save (very unlikely to be coincidence)
                // Otherwise, ask the player
                if (timePlayedDiff < 120 * 1000 && timeDiff < 120 * 1000) {
                    if (localSave.time < cloudSave.content.time) {
                        save(setupInitialStore(cloudSave.content));
                        if (settings.active === localSaveId) {
                            loadSave(cloudSave.content);
                        }
                    } else {
                        galaxy.value
                            ?.save(
                                cloudSave.slot,
                                LZString.compressToUTF16(
                                    stringifySave(setupInitialStore(localSave))
                                ),
                                localSave.name ?? cloudSave.label
                            )
                            .catch(console.error);
                        // Update cloud save content for the return value
                        cloudSave.content = localSave as Player;
                    }
                } else {
                    conflictingSaves.value.push({
                        id: localSaveId,
                        cloud: cloudSave.content,
                        local: localSave as LoadablePlayerData,
                        slot: cloudSave.slot
                    });
                }
            } catch (e) {
                return false;
            }
        }
        return true;
    });

    savesToUpload.forEach(id => {
        try {
            if (availableSlots.size > 0) {
                const localSave = localStorage.getItem(id) ?? "";
                const parsedLocalSave = JSON.parse(decodeSave(localSave) ?? "");
                const slot = availableSlots.values().next().value;
                if (slot == null) return;
                galaxy.value
                    ?.save(slot, localSave, parsedLocalSave.name)
                    .then(() => syncedSaves.value.push(parsedLocalSave.id))
                    .catch(console.error);
                availableSlots.delete(slot);
            }
        } catch (e) {}
    });

    return saves;
}
