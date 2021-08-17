import { Theme } from "@/typings/theme";

const defaultTheme: Theme = {
    variables: {
        "--background": "#0f0f0f",
        "--background-tooltip": "rgba(0, 0, 0, 0.75)",
        "--secondary-background": "#0f0f0f",
        "--color": "#dfdfdf",
        "--points": "#ffffff",
        "--locked": "#bf8f8f",
        "--bought": "#77bf5f",
        "--link": "#02f2f2",
        "--separator": "#dfdfdf",
        "--border-radius": "25%",
        "--danger": "rgb(220, 53, 69)",
        "--modal-border": "solid 2px var(--color)",
        "--feature-margin": "0px"
    },
    stackedInfoboxes: false,
    floatingTabs: true
};

export enum Themes {
    Classic = "classic",
    Paper = "paper",
    Aqua = "aqua"
}

export default {
    classic: defaultTheme,
    paper: {
        ...defaultTheme,
        variables: {
            ...defaultTheme.variables,
            "--background": "#2a323d",
            "--secondary-background": "#333c4a",
            "--locked": "#3a3e45",
            "--bought": "#5C8A58",
            "--separator": "#333c4a",
            "--border-radius": "4px",
            "--modal-border": "",
            "--feature-margin": "5px"
        },
        stackedInfoboxes: true,
        floatingTabs: false
    } as Theme,
    aqua: {
        ...defaultTheme,
        variables: {
            ...defaultTheme.variables,
            "--background": "#001f3f",
            "--background-tooltip": "rgba(0, 15, 31, 0.75)",
            "--secondary-background": "#001f3f",
            "--color": "#bfdfff",
            "--points": "#dfefff",
            "--locked": "#c4a7b3",
            "--separator": "#bfdfff"
        }
    } as Theme
} as Record<Themes, Theme>;
