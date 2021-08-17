import { RawLayer } from "@/typings/layer";

export default {
    id: "main",
    display: `
		<div v-if="player.devSpeed === 0">Game Paused</div>
		<div v-else-if="player.devSpeed && player.devSpeed !== 1">Dev Speed: {{ format(player.devSpeed) }}x</div>
        <div>TODO: Board</div>
		`,
    minimizable: false
} as RawLayer;
