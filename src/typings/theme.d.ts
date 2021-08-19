export interface Theme {
    variables: {
        "--background": string;
        "--background-tooltip": string;
        "--secondary-background": string;
        "--color": string;
        "--points": string;
        "--locked": string;
        "--bought": string;
        "--link": string;
        "--separator": string;
        "--border-radius": string;
        "--danger": string;
        "--modal-border": string;
        "--feature-margin": string;
    };
    stackedInfoboxes: boolean;
    floatingTabs: boolean;
}
