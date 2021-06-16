import { update as modUpdate } from '../data/mod';
import Decimal from '../util/bignum';
import modInfo from '../data/modInfo.json';
import store from './index';
import { layers } from './layers';
import { player } from './proxies';

function updatePopups(/* diff */) {
	// TODO
}

function updateParticles(/* diff */) {
	// TODO
}

function updateOOMPS(diff) {
	if (player.points != undefined) {
		player.oompsMag = 0;
		if (player.points.lte(new Decimal(1e100))) {
			player.lastPoints = player.points;
			return;
		}

		let curr = player.points;
		let prev = player.lastPoints || new Decimal(0);
		player.lastPoints = curr;
		if (curr.gt(prev)) {
			if (curr.gte("10^^8")) {
				curr = curr.slog(1e10);
				prev = prev.slog(1e10);
				player.oomps = curr.sub(prev).div(diff);
				player.oompsMag = -1;
			} else {
				while (curr.div(prev).log(10).div(diff).gte("100") && player.oompsMag <= 5 && prev.gt(0)) {
					curr = curr.log(10);
					prev = prev.log(10);
					player.oomps = curr.sub(prev).div(diff);
					player.oompsMag++;
				}
			}
		}
	}
}

function updateLayers(diff) {
	// Update each active layer
	const activeLayers = Object.keys(layers).filter(layer => !layers[layer].deactivated);
	activeLayers.forEach(layer => {
		if (player[layer].resetTime != undefined) {
			player[layer].resetTime = player[layer].resetTime.add(diff);
		}
		if (layers[layer].passiveGeneration) {
			player[layer].points =
				player[layer].points.add(Decimal.times(layers[layer].resetGain, layers[layer].passiveGeneration).times(diff));
		}
		layers[layer].update?.(diff);
	});
	// Automate each active layer
	activeLayers.forEach(layer => {
		if (layers[layer].autoReset && layers[layer].canReset) {
			layers[layer].reset();
		}
		layers[layer].automate?.();
		if (layers[layer].upgrades && layers[layer].autoUpgrade) {
			Object.values(layers[layer].upgrades).forEach(upgrade => upgrade.buy());
		}
	});
	// Check each active layer for newly unlocked achievements or milestones
	activeLayers.forEach(layer => {
		if (layers[layer].milestones) {
			Object.values(layers[layer].milestones).forEach(milestone => {
				if (milestone.unlocked !== false && !milestone.earned && milestone.done) {
					player[layer].milestones.push(milestone.id);
					milestone.onComplete?.();
					// TODO popup notification
					player[layer].lastMilestone = milestone.id;
				}
			});
		}
		if (layers[layer].achievements) {
			Object.values(layers[layer].achievements).forEach(achievement => {
				if (achievement.unlocked !== false && !achievement.earned && achievement.done) {
					player[layer].achievements.push(achievement.id);
					achievement.onComplete?.();
					// TODO popup notification
				}
			});
		}
	});
}

function update() {
	let now = Date.now();
	let diff = (now - player.time) / 1e3;
	player.time = now;
	let trueDiff = diff;

	// Always update UI
	updatePopups(trueDiff);
	updateParticles(trueDiff);
	player.lastTenTicks.push(trueDiff);
	if (player.lastTenTicks.length > 10) {
		player.lastTenTicks = player.lastTenTicks.slice(1);
	}

	// Stop here if the game is paused on the win screen
	if (store.getters.hasWon && !player.keepGoing) {
		return;
	}

	diff = new Decimal(diff).max(0);

	// Add offline time if any
	if (player.offTime != undefined) {
		if (player.offTime.remain > modInfo.offlineLimit * 3600) {
			player.offTime.remain = modInfo.offlineLimit * 3600;
		}
		if (player.offTime.remain > 0) {
			let offlineDiff = Math.max(player.offTime.remain / 10, diff);
			player.offTime.remain -= offlineDiff;
			diff = diff.add(offlineDiff);
		}
		if (!player.offlineProd || player.offTime.remain <= 0) {
			player.offTime = undefined;
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
		player.points = player.points.add(Decimal.times(store.getters.pointGain, diff));
	}
	modUpdate(diff);
	updateOOMPS(trueDiff);
	updateLayers(diff);
}

export function startGameLoop() {
	setInterval(update, 50);
}
