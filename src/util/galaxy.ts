import player, { Player } from "game/player";
import settings from "game/settings";
import { GalaxyApi, initGalaxy } from "lib/galaxy";
import { decodeSave, loadSave, save } from "./save";
import { setupInitialStore } from "./save";
import { ref } from "vue";

export const galaxy = ref<GalaxyApi>();
export const conflictingSaves = ref<string[]>([]);

export function sync() {
    if (galaxy.value == null || !galaxy.value.loggedIn) {
        return;
    }
    if (conflictingSaves.value.length > 0) {
        // Pause syncing while resolving conflicted saves
        return;
    }
    galaxy.value.getSaveList().then(syncSaves);
}

// Setup Galaxy API
initGalaxy({
    supportsSaving: true,
    supportsSaveManager: true,
    onLoggedInChanged
}).then(g => {
    galaxy.value = g;
    onLoggedInChanged(g);
});

function onLoggedInChanged(g: GalaxyApi) {
    if (g.loggedIn !== true) {
        return;
    }
    if (conflictingSaves.value.length > 0) {
        // Pause syncing while resolving conflicted saves
        return;
    }

    g.getSaveList().then(list => {
        const saves = syncSaves(list);

        // If our current save has under a minute of playtime, load the cloud save with the most recent time.
        if (player.timePlayed < 60 && saves.length > 0) {
            const longestSave = saves.reduce((acc, curr) =>
                acc.content.time < curr.content.time ? curr : acc
            );
            loadSave(longestSave.content);
        }
    });
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
    return (
        Object.keys(list)
            .map(slot => {
                const { label, content } = list[slot as unknown as number];
                try {
                    return { slot: parseInt(slot), label, content: JSON.parse(content) };
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
        const localSaveId = settings.saves.find(id => id === cloudSave.content.id);
        if (localSaveId == undefined) {
            settings.saves.push(cloudSave.content.id);
            save(setupInitialStore(cloudSave.content));
        } else {
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
                // If their last played time and total time played are both within a minute, just use the newer save (very unlikely to be coincidence)
                // Otherwise, ask the player
                if (timePlayedDiff < 60 && timeDiff < 60) {
                    if (localSave.time < cloudSave.content.time) {
                        save(setupInitialStore(cloudSave.content));
                        if (settings.active === localSaveId) {
                            loadSave(cloudSave.content);
                        }
                    } else {
                        galaxy.value?.save(
                            cloudSave.slot,
                            JSON.stringify(cloudSave.content),
                            cloudSave.label ?? null
                        );
                        // Update cloud save content for the return value
                        cloudSave.content = localSave as Player;
                    }
                } else {
                    conflictingSaves.value.push(localSaveId);
                }
            } catch (e) {
                return false;
            }
        }
        return true;
    });
}
