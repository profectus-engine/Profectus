export interface Theme {
    variables: {
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
    };
    stackedInfoboxes: boolean;
    floatingTabs: boolean;
}
