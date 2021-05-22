const defaultTheme = {
	"--background": "#0f0f0f",
	"--background-tooltip": "rgba(0, 0, 0, 0.75)",
	"--secondary-background": "#0f0f0f",
	"--color": "#dfdfdf",
	"--points": "#ffffff",
	"--locked": "#bf8f8f",
	"--link": "#02f2f2",
	"--separator": "#dfdfdf",
	"--border-radius": "25%",
	"--danger": "rgb(220, 53, 69)",
	"--modal-border": "solid 2px var(--color)"
};

export default {
	default: defaultTheme,
	paper: {
		...defaultTheme,
		"--background": "#2a323d",
		"--secondary-background": "#333c4a",
		"--separator": "#333c4a",
		"--border-radius": "4px",
		"--modal-border": ""
	},
	aqua: {
		...defaultTheme,
		"--background": "#001f3f",
		"--background-tooltip": "rgba(0, 15, 31, 0.75)",
		"--secondary-background": "#001f3f",
		"--color": "#bfdfff",
		"--points": "#dfefff",
		"--locked": "#c4a7b3",
		"--separator": "#bfdfff"
	}
};
