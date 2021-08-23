import { ComponentPublicInstance } from "vue";

export interface BranchLink {
    start: string;
    end: string;
    options: string | BranchOptions;
}

export interface BranchNode {
    x?: number;
    y?: number;
    component: ComponentPublicInstance;
    element: HTMLElement;
}

export interface BranchOptions {
    target?: string;
    featureType?: string;
    stroke?: string;
    strokeWidth?: number | string;
    startOffset?: Position;
    endOffset?: Position;
    [key: string]: any;
}

export interface Position {
    x: number;
    y: number;
}
