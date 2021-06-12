<template>
	<div :tooltip="text">
		<slot />
	</div>
</template>

<script>
export default {
	name: 'tooltip',
	props: {
		text: String
	}
};
</script>

<style scoped>
[tooltip] {
	position: relative;
}

[tooltip]:before,
[tooltip]:after {
	visibility: hidden;
	-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";
	filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=0);
	opacity: 0;
	pointer-events: none;
	white-space: pre-wrap;
	z-index: 100 !important;
}

[tooltip]:before {
	position: absolute;
	bottom: 100%;
	left: 50%;
	margin-bottom: 5px;
	margin-left: -80px;
	padding: 7px;
	width: 160px;
	-webkit-border-radius: 3px;
	-moz-border-radius: 3px;
	border-radius: 3px;
	background-color: var(--background-tooltip);
	color: var(--points);
	content: attr(tooltip);
	text-align: center;
	font-size: 14px;
	line-height: 1.2;
	white-space: pre-wrap;
}

[tooltip]:after {
	position: absolute;
	bottom: 100%;
	left: 50%;
	margin-left: -5px;
	width: 0;
	border-top: 5px solid var(--background-tooltip);
	border-right: 5px solid transparent;
	border-left: 5px solid transparent;
	content: " ";
	font-size: 0;
	line-height: 0;
	white-space: pre-wrap;
}

[tooltip]:hover:before,
[tooltip].forceTooltip:before,
[tooltip]:hover:after,
[tooltip].forceTooltip:after {
	animation: tooltip 0.25s linear 1;
	animation-fill-mode: forwards;
	white-space: pre-wrap;
}

@keyframes tooltip {
	0% {
		-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";
		filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=0);
		opacity: 0;
		visibility: hidden;
	}
	100% {
		-ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=100)";
		filter: progid: DXImageTransform.Microsoft.Alpha(Opacity=100);
		opacity: 1;
		visibility: visible;
	}
}
</style>
