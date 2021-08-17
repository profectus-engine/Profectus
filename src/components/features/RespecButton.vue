<template>
    <div style="display: flex">
        <tooltip display="Disable respec confirmation">
            <Toggle :value="confirmRespec" @change="setConfirmRespec" />
        </tooltip>
        <button
            @click="respec"
            :class="{ feature: true, respec: true, can: unlocked, locked: !unlocked }"
            style="margin-right: 18px"
            :style="style"
        >
            <component :is="respecButtonDisplay" />
        </button>
        <Modal :show="confirming" @close="cancel">
            <template v-slot:header>
                <h2>Confirm Respec</h2>
            </template>
            <template v-slot:body>
                <slot name="respec-warning">
                    <component :is="respecWarning" />
                </slot>
            </template>
            <template v-slot:footer>
                <div class="modal-footer">
                    <div class="modal-flex-grow"></div>
                    <danger-button class="button modal-button" @click="confirm" skipConfirm
                        >Yes</danger-button
                    >
                    <button class="button modal-button" @click="cancel">Cancel</button>
                </div>
            </template>
        </Modal>
    </div>
</template>

<script lang="ts">
import { layers } from "@/game/layers";
import player from "@/game/player";
import { CoercableComponent } from "@/typings/component";
import { coerceComponent, InjectLayerMixin } from "@/util/vue";
import { Component, defineComponent, PropType } from "vue";

export default defineComponent({
    name: "respec-button",
    mixins: [InjectLayerMixin],
    props: {
        confirmRespec: Boolean,
        display: [String, Object] as PropType<CoercableComponent>,
        respecWarningDisplay: [String, Object] as PropType<CoercableComponent>
    },
    data() {
        return {
            confirming: false
        };
    },
    emits: ["set-confirm-respec", "respec"],
    computed: {
        style(): Partial<CSSStyleDeclaration> | undefined {
            return layers[this.layer].componentStyles?.["respec-button"];
        },
        unlocked(): boolean {
            return player.layers[this.layer].unlocked;
        },
        respecButtonDisplay(): Component | string {
            if (this.display) {
                return coerceComponent(this.display);
            }
            return coerceComponent("Respec");
        },
        respecWarning(): Component | string {
            if (this.respecWarningDisplay) {
                return coerceComponent(this.respecWarningDisplay);
            }
            return coerceComponent(
                `Are you sure you want to respec? This will force you to do a ${layers[this.layer]
                    .name || this.layer} respec as well!`
            );
        }
    },
    methods: {
        setConfirmRespec(value: boolean) {
            this.$emit("set-confirm-respec", value);
        },
        respec() {
            if (this.confirmRespec) {
                this.confirming = true;
            } else {
                this.$emit("respec");
            }
        },
        confirm() {
            this.$emit("respec");
            this.confirming = false;
        },
        cancel() {
            this.confirming = false;
        }
    }
});
</script>

<style scoped>
.respec {
    height: 40px;
    width: 80px;
    background: var(--points);
    border: 2px solid rgba(0, 0, 0, 0.125);
}

.modal-footer {
    display: flex;
}

.modal-flex-grow {
    flex-grow: 1;
}

.modal-button {
    margin-left: 10px;
}
</style>
