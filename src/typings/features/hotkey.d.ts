import { Feature } from "./feature";

export interface Hotkey extends Feature {
    unlocked: boolean;
    press: () => void;
    description: string;
    key: string;
}
