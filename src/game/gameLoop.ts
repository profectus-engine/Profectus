import { hasWon, pointGain, update as modUpdate } from "@/data/mod";
import modInfo from "@/data/modInfo.json";
import Decimal, { DecimalSource } from "@/util/bignum";
import { layers } from "./layers";
import player from "./player";
import settings from "./settings";
import state from "./state";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function updateParticles(diff: number) {
    // TODO
}

function updateOOMPS(diff: DecimalSource) {
    if (player.points != undefined) {
        state.oompsMag = 0;
        if (player.points.lte(new Decimal(1e100))) {
            state.lastPoints = player.points;
            return;
        }

        let curr = player.points;
        let prev = (state.lastPoints as Decimal) || new Decimal(0);
        state.lastPoints = curr;
        if (curr.gt(prev)) {
            if (curr.gte("10^^8")) {
                curr = curr.slog(1e10);
                prev = prev.slog(1e10);
                state.oomps = curr.sub(prev).div(diff);
                state.oompsMag = -1;
            } else {
                while (
                    curr
                        .div(prev)
                        .log(10)
                        .div(diff)
                        .gte("100") &&
                    state.oompsMag <= 5 &&
                    prev.gt(0)
                ) {
                    curr = curr.log(10);
                    prev = prev.log(10);
                    state.oomps = curr.sub(prev).div(diff);
                    state.oompsMag++;
                }
            }
        }
    }
}

function updateLayers(diff: DecimalSource) {
    // Update each active layer
    const activeLayers = Object.keys(layers).filter(layer => !layers[layer].deactivated);
    activeLayers.forEach(layer => {
        if (player.layers[layer].resetTime != undefined) {
            player.layers[layer].resetTime = player.layers[layer].resetTime.add(diff);
        }
        if (layers[layer].passiveGeneration) {
            const passiveGeneration =
                typeof layers[layer].passiveGeneration == "boolean"
                    ? 1
                    : (layers[layer].passiveGeneration as DecimalSource);
            player.layers[layer].points = player.layers[layer].points.add(
                Decimal.times(layers[layer].resetGain, passiveGeneration).times(diff)
            );
        }
        layers[layer].update?.(diff);
        if (layers[layer].boards && layers[layer].boards?.data) {
            Object.values(layers[layer].boards!.data!).forEach(board => {
                board.nodes.forEach(node => {
                    const nodeType = board.types[node.type];
                    nodeType.update?.(node, diff);
                });
            });
        }
    });
    // Automate each active layer
    activeLayers.forEach(layer => {
        if (layers[layer].autoReset && layers[layer].canReset) {
            layers[layer].reset();
        }
        layers[layer].automate?.();
        if (layers[layer].upgrades && layers[layer].autoUpgrade) {
            Object.values(layers[layer].upgrades!.data).forEach(upgrade => upgrade.buy());
        }
    });
    // Check each active layer for newly unlocked achievements or milestones
    activeLayers.forEach(layer => {
        if (layers[layer].milestones) {
            Object.values(layers[layer].milestones!.data).forEach(milestone => {
                if (milestone.unlocked !== false && !milestone.earned && milestone.done) {
                    player.layers[layer].milestones.push(milestone.id);
                    milestone.onComplete?.();
                    // TODO popup notification
                    player.layers[layer].lastMilestone = milestone.id;
                }
            });
        }
        if (layers[layer].achievements) {
            Object.values(layers[layer].achievements!.data).forEach(achievement => {
                if (achievement.unlocked !== false && !achievement.earned && achievement.done) {
                    player.layers[layer].achievements.push(achievement.id);
                    achievement.onComplete?.();
                    // TODO popup notification
                }
            });
        }
    });
}

let intervalID: number | null = null;

function update() {
    const now = Date.now();
    let diff: DecimalSource = (now - player.time) / 1e3;
    player.time = now;
    const trueDiff = diff;

    // Always update UI
    updateParticles(trueDiff);
    state.lastTenTicks.push(trueDiff);
    if (state.lastTenTicks.length > 10) {
        state.lastTenTicks = state.lastTenTicks.slice(1);
    }

    // Stop here if the game is paused on the win screen
    if (hasWon.value && !player.keepGoing) {
        return;
    }
    // Stop here if the player had a NaN value
    if (state.hasNaN) {
        return;
    }

    diff = new Decimal(diff).max(0);

    // Add offline time if any
    if (player.offlineTime != undefined) {
        if (player.offlineTime.gt(modInfo.offlineLimit * 3600)) {
            player.offlineTime = new Decimal(modInfo.offlineLimit * 3600);
        }
        if (player.offlineTime.gt(0) && player.devSpeed !== 0) {
            const offlineDiff = Decimal.max(player.offlineTime.div(10), diff);
            player.offlineTime = player.offlineTime.sub(offlineDiff);
            diff = diff.add(offlineDiff);
        } else if (player.devSpeed === 0) {
            player.offlineTime = player.offlineTime.add(diff);
        }
        if (!player.offlineProd || player.offlineTime.lt(0)) {
            player.offlineTime = null;
        }
    }

    // Cap at max tick length
    diff = Decimal.min(diff, modInfo.maxTickLength);

    // Apply dev speed
    if (player.devSpeed != undefined) {
        diff = diff.times(player.devSpeed);
    }

    // Update
    if (diff.eq(0)) {
        return;
    }
    player.timePlayed = player.timePlayed.add(diff);
    if (player.points != undefined) {
        player.points = player.points.add(Decimal.times(pointGain.value, diff));
    }
    modUpdate(diff);
    updateOOMPS(trueDiff);
    updateLayers(diff);

    player.justLoaded = false;

    if (settings.unthrottled) {
        requestAnimationFrame(update);
        if (intervalID != null) {
            clearInterval(intervalID);
            intervalID = null;
        }
    } else if (intervalID == null) {
        intervalID = setInterval(update, 50);
    }
}

export default function startGameLoop(): void {
    if (settings.unthrottled) {
        requestAnimationFrame(update);
    } else {
        intervalID = setInterval(update, 50);
    }
}
