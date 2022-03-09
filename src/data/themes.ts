export interface ThemeVars {
    "--foreground": string;
    "--background": string;
    "--feature-foreground": string;
    "--tooltip-background": string;
    "--raised-background": string;
    "--points": string;
    "--locked": string;
    "--highlighted": string;
    "--bought": string;
    "--danger": string;
    "--link": string;
    "--outline": string;
    "--accent1": string;
    "--accent2": string;
    "--accent3": string;
    "--border-radius": string;
    "--modal-border": string;
    "--feature-margin": string;
}

export interface Theme {
    variables: ThemeVars;
    floatingTabs: boolean;
    mergeAdjacent: boolean;
}

declare module "@vue/runtime-dom" {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface CSSProperties extends Partial<ThemeVars> {}
}

const defaultTheme: Theme = {
    variables: {
        "--foreground": "#dfdfdf",
        "--background": "#0f0f0f",
        "--feature-foreground": "#eee",
        "--tooltip-background": "rgba(0, 0, 0, 0.75)",
        "--raised-background": "#0f0f0f",
        "--points": "#ffffff",
        "--locked": "#bf8f8f",
        "--highlighted": "#333",
        "--bought": "#77bf5f",
        "--danger": "rgb(220, 53, 69)",
        "--link": "#02f2f2",
        "--outline": "#dfdfdf",
        "--accent1": "#627a82",
        "--accent2": "#658262",
        "--accent3": "#7c6282",

        "--border-radius": "15px",
        "--modal-border": "solid 2px var(--color)",
        "--feature-margin": "0px"
    },
    floatingTabs: true,
    mergeAdjacent: true
};

export enum Themes {
    Classic = "classic",
    Paper = "paper",
    Nordic = "nordic",
    Aqua = "aqua"
}

export default {
    classic: defaultTheme,
    paper: {
        ...defaultTheme,
        variables: {
            ...defaultTheme.variables,
            "--background": "#2a323d",
            "--feature-foreground": "#000",
            "--raised-background": "#333c4a",
            "--locked": "#3a3e45",
            "--bought": "#5C8A58",
            "--outline": "#333c4a",
            "--border-radius": "4px",
            "--modal-border": "",
            "--feature-margin": "5px"
        },
        floatingTabs: false
    } as Theme,
    // Based on https://www.nordtheme.com
    nordic: {
        ...defaultTheme,
        variables: {
            ...defaultTheme.variables,
            "--foreground": "#D8DEE9",
            "--background": "#2E3440",
            "--feature-foreground": "#000",
            "--raised-background": "#3B4252",
            "--points": "#E5E9F0",
            "--locked": "#4c566a",
            "--highlighted": "#434c5e",
            "--bought": "#8FBCBB",
            "--danger": "#D08770",
            "--link": "#88C0D0",
            "--outline": "#3B4252",
            "--accent1": "#B48EAD",
            "--accent2": "#A3BE8C",
            "--accent3": "#EBCB8B",
            "--border-radius": "4px",
            "--modal-border": "solid 2px #3B4252",
            "--feature-margin": "5px"
        },
        floatingTabs: false
    } as Theme,
    aqua: {
        ...defaultTheme,
        variables: {
            ...defaultTheme.variables,
            "--foreground": "#bfdfff",
            "--background": "#001f3f",
            "--tooltip-background": "rgba(0, 15, 31, 0.75)",
            "--raised-background": "#001f3f",
            "--points": "#dfefff",
            "--locked": "#c4a7b3",
            "--outline": "#bfdfff"
        }
    } as Theme
} as Record<Themes, Theme>;
