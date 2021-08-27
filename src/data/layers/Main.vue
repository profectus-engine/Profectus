<template>
    <div v-if="devSpeed === 0">Game Paused</div>
    <div v-else-if="devSpeed && devSpeed !== 1">Dev Speed: {{ formattedDevSpeed }}x</div>
    <div>Day {{ day }}</div>
    <Board id="main" />
    <Modal :show="showModal" @close="closeModal">
        <template v-slot:header v-if="title">
            <component :is="title" />
        </template>
        <template v-slot:body v-if="body">
            <component :is="body" />
        </template>
        <template v-slot:footer v-if="footer">
            <component :is="footer" />
        </template>
    </Modal>
</template>

<script lang="ts">
import player from "@/game/player";
import { CoercableComponent } from "@/typings/component";
import { format } from "@/util/break_eternity";
import { camelToTitle } from "@/util/common";
import { coerceComponent } from "@/util/vue";
import { computed, defineComponent, shallowRef, watchEffect } from "vue";
import { ActionNodeData } from "./main";

export default defineComponent(function Main() {
    const title = shallowRef<CoercableComponent | null>(null);
    const body = shallowRef<CoercableComponent | null>(null);
    const footer = shallowRef<CoercableComponent | null>(null);

    watchEffect(() => {
        const node = player.layers.main.boards.main.nodes.find(
            node => node.id === player.layers.main.openNode
        );
        if (node == null) {
            player.layers.main.showModal = false;
            return;
        }
        switch (node.type) {
            default:
                player.layers.main.showModal = false;
                break;
            case "action":
                title.value = coerceComponent(
                    camelToTitle((node.data as ActionNodeData).actionType)
                );
                body.value = coerceComponent(
                    "<div><div class='entry'>" +
                        (node.data as ActionNodeData).log
                            .map(log => {
                                let display = log.description;
                                if (log.effectDescription) {
                                    display += `<div style="font-style: italic;">${log.effectDescription}</div>`;
                                }
                                return display;
                            })
                            .join("</div><div class='entry'>") +
                        "</div></div>"
                );
                break;
        }
    });

    const showModal = computed(() => player.layers.main.showModal);
    const closeModal = () => {
        player.layers.main.showModal = false;
    };

    const devSpeed = computed(() => player.devSpeed);
    const formattedDevSpeed = computed(() => player.devSpeed && format(player.devSpeed));

    const day = computed(() => player.day);

    return { title, body, footer, showModal, closeModal, devSpeed, formattedDevSpeed, day };
});
</script>

<style>
.entry {
    padding: var(--feature-margin);
}

.entry:not(:last-child) {
    border-bottom: solid 4px var(--separator);
}

.boardnode.action .progressDiamond {
    transition-duration: 0s;
}
</style>
