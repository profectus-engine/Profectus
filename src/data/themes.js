const defaultTheme = {
	"--background": "#0f0f0f",
	"--background_tooltip": "rgba(0, 0, 0, 0.75)",
	"--background_nav": "#0f0f0f",
	"--color": "#dfdfdf",
	"--points": "#ffffff",
	"--locked": "#bf8f8f",
	"--link": "#02f2f2",
	"--separator": "#dfdfdf"
};

export default {
	default: defaultTheme,
	paper: {
		...defaultTheme,
		"--background": "#2a323d",
		"--background_nav": "#333c4a",
		"--separator": "#333c4a"
	},
	aquad: {
		...defaultTheme,
		"--background": "#001f3f",
		"--background_tooltip": "rgba(0, 15, 31, 0.75)",
		"--background_nav": "#001f3f",
		"--color": "#bfdfff",
		"--points": "#dfefff",
		"--locked": "#c4a7b3",
		"--separator": "#bfdfff"
	}
};
