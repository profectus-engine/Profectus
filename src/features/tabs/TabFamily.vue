<template>
    <div class="tab-family-container" :class="tabClasses" :style="tabStyle">
        <Sticky
            class="tab-buttons-container"
            :class="unref(buttonContainerClasses)"
            :style="unref(buttonContainerStyle)"
        >
            <div class="tab-buttons" :class="{ floating }">
                <TabButtons />
            </div>
        </Sticky>
        <Component v-if="unref(activeTab) != null" />
    </div>
</template>

<script setup lang="ts">
import Sticky from "components/layout/Sticky.vue";
import themes from "data/themes";
import { isType } from "features/feature";
import settings from "game/settings";
import { MaybeGetter } from "util/computed";
import { render, Renderable } from "util/vue";
import type { Component, CSSProperties, MaybeRef, Ref } from "vue";
import { computed, unref } from "vue";
import { Tab, TabType } from "./tab";
import { TabButton } from "./tabFamily";

const props = defineProps<{
    activeTab: Ref<MaybeGetter<Renderable> | Tab | null>;
    tabs: Record<string, TabButton>;
    buttonContainerClasses?: MaybeRef<Record<string, boolean>>;
    buttonContainerStyle?: MaybeRef<CSSProperties>;
}>();

const Component = () => {
    const activeTab = unref(props.activeTab);
    if (activeTab == null) {
        return;
    }
    return render(activeTab);
};

const floating = computed(() => {
    return themes[settings.theme].floatingTabs;
});

const TabButtons = () => Object.values(props.tabs).map(tab => render(tab));

const tabClasses = computed(() => {
    const activeTab = unref(props.activeTab);
    if (isType(activeTab, TabType)) {
        return unref(activeTab.classes);
    }
});

const tabStyle = computed(() => {
    const activeTab = unref(props.activeTab);
    if (isType(activeTab, TabType)) {
        return unref(activeTab.style);
    }
});
</script>

<style scoped>
.tab-family-container {
    margin: calc(50px + var(--feature-margin)) 20px var(--feature-margin) 20px;
    position: relative;
    border: solid 4px;
    border-color: var(--outline);
}

.layer-tab > .tab-family-container:first-child {
    margin: -4px -11px var(--feature-margin) -11px;
}

.layer-tab > .tab-family-container:first-child:nth-last-child(3) {
    border-bottom-style: none;
    border-left-style: none;
    border-right-style: none;
    height: calc(100% + 50px);
}

.modal-body > .tab-family-container:first-child {
    margin: calc(10px + var(--feature-margin)) 10px 0 10px;
    border: none;
}

.tab-family-container > :nth-child(2) {
    margin-top: 20px;
}

.modal-body > .tab-family-container > :nth-child(2) {
    /* TODO Why does it need this instead of 20px? */
    margin-top: 50px;
}

.tab-family-container[data-v-f18896fc] > :last-child {
    margin-bottom: 20px;
}

.tab-buttons-container {
    z-index: 4;
}

.tab-buttons-container:not(.floating) {
    border-bottom: solid 4px;
    border-color: inherit;
}

:not(.layer-tab):not(.modal-body) > .tab-family-container > .tab-buttons-container:not(.floating) {
    width: calc(100% + 6px);
    margin-left: -3px;
}

.tab-buttons-container:not(.floating) .tab-buttons {
    text-align: left;
    margin-bottom: -4px;
}

.tab-buttons-container.floating .tab-buttons {
    justify-content: center;
    margin-top: -25px;
}

.tab-buttons {
    margin-bottom: 24px;
    display: flex;
    flex-flow: wrap;
    z-index: 4;
}

.tab-buttons > * {
    margin: 0;
}

.layer-tab
    > .tab-family-container:first-child:nth-last-child(3)
    > .tab-buttons-container
    > .tab-buttons {
    padding-right: 60px;
}

.tab-buttons:not(.floating) {
    text-align: left;
    border-bottom: inherit;
    border-width: 4px;
    box-sizing: border-box;
    height: 50px;
}

.modal-body .tab-buttons {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
}

.showGoBack
    > .tab-family-container:first-child
    > .tab-buttons-container:not(.floating)
    .tab-buttons {
    padding-left: 70px;
}

:not(.showGoBack)
    > .tab-family-container
    > .tab-buttons-container:not(.floating):first-child
    .tab-buttons {
    padding-left: 0;
}

.minimizable > .tab-buttons-container:not(.floating):first-child {
    padding-right: 50px;
}

.tab-buttons-container:not(.floating):first-child .tab-buttons {
    margin-top: -50px;
}

.tab-buttons-container + * {
    margin-top: 20px;
}
</style>
