<template>
    <div class="tab-family-container" :class="classes" :style="style">
        <Sticky class="tab-buttons-container">
            <div class="tab-buttons" :class="{ floating }">
                <TabButton
                    v-for="(button, id) in tabs"
                    @selectTab="selectTab(id)"
                    :key="id"
                    :active="button.tab === activeTab"
                    v-bind="button"
                />
            </div>
        </Sticky>
        <template v-if="activeTab">
            <component :is="display" />
        </template>
    </div>
</template>

<script setup lang="ts">
import themes from "@/data/themes";
import { FeatureComponent } from "@/features/feature";
import { GenericTabFamily } from "@/features/tabFamily";
import settings from "@/game/settings";
import { coerceComponent, isCoercableComponent } from "@/util/vue";
import { computed, toRefs, unref } from "vue";
import Sticky from "../system/Sticky.vue";

const props = toRefs(defineProps<FeatureComponent<GenericTabFamily>>());

const floating = computed(() => {
    return themes[settings.theme].floatingTabs;
});

const display = computed(() => {
    const activeTab = props.activeTab.value;
    return activeTab
        ? coerceComponent(isCoercableComponent(activeTab) ? activeTab : activeTab.display)
        : null;
});

const classes = computed(() => {
    const activeTab = props.activeTab.value;
    const tabClasses =
        isCoercableComponent(activeTab) || !activeTab ? undefined : unref(activeTab.classes);
    return tabClasses;
});

const style = computed(() => {
    const activeTab = props.activeTab.value;
    return isCoercableComponent(activeTab) || !activeTab ? undefined : unref(activeTab.style);
});

function selectTab(tab: string) {
    props.state.value = tab;
}
</script>

<style scoped>
.tab-family-container {
    margin: var(--feature-margin) -11px;
    position: relative;
    border: solid 4px var(--outline);
}

.tab-buttons:not(.floating) {
    text-align: left;
    border-bottom: inherit;
    border-width: 4px;
    box-sizing: border-box;
    height: 50px;
}

.tab-family-container .sticky {
    margin-left: unset !important;
    margin-right: unset !important;
}

.tab-buttons {
    margin-bottom: 24px;
    display: flex;
    flex-flow: wrap;
    padding-right: 60px;
    z-index: 4;
}

.tab-buttons-container:not(.floating) {
    border-top: solid 4px var(--outline);
    border-bottom: solid 4px var(--outline);
}

.tab-buttons-container:not(.floating) .tab-buttons {
    width: calc(100% + 14px);
    margin-left: -7px;
    margin-right: -7px;
    box-sizing: border-box;
    text-align: left;
    padding-left: 14px;
    margin-bottom: -4px;
}

.tab-buttons-container.floating .tab-buttons {
    justify-content: center;
    margin-top: -25px;
}

.modal-body .tab-buttons {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
}

.showGoBack > .tab-buttons-container:not(.floating) .subtabs {
    padding-left: 0;
    padding-right: 0;
}

.tab-buttons-container:not(.floating):first-child {
    border-top: 0;
}

.minimizable > .tab-buttons-container:not(.floating):first-child {
    padding-right: 50px;
}

.tab-buttons-container:not(.floating):first-child .tab-buttons {
    margin-top: -50px;
}

:not(.showGoBack) > .tab-buttons-container:not(.floating) .tab-buttons {
    padding-left: 70px;
}

.tab-buttons-container + * {
    margin-top: 20px;
}
</style>
