<template>
	<transition name="modal">
		<div class="modal-mask" v-show="show" v-on:pointerdown.self="$emit('close')">
			<div class="modal-wrapper">
				<div class="modal-container">

					<div class="modal-header">
						<slot name="header">
							default header
						</slot>
					</div>

					<div class="modal-body">
						<slot name="body">
							default body
						</slot>
					</div>

					<div class="modal-footer">
						<slot name="footer">
							<div class="modal-default-footer">
								<div class="modal-default-flex-grow"></div>
								<button class="modal-default-button" @click="$emit('close')">
									Close
								</button>
							</div>
						</slot>
					</div>
				</div>
			</div>
		</div>
	</transition>
</template>

<script>
export default {
	name: 'Modal',
	props: {
		show: Boolean
	}
}
</script>

<style scoped>
.modal-mask {
	position: fixed;
	z-index: 9998;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	background-color: rgba(0, 0, 0, 0.5);
	transition: opacity 0.3s ease;
}

.modal-wrapper {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
}

.modal-container {
	width: 400px;
	max-width: calc(95vw - 40px);
	background-color: var(--background);
	padding: 20px;
	border-radius: 5px;
	transition: all 0.3s ease;
	text-align: left;
	border: var(--modal-border);
}

.modal-body {
	margin: 20px 0;
}

.modal-default-footer {
	display: flex;
}

.modal-default-flex-grow {
	flex-grow: 1;
}

.modal-enter {
	opacity: 0;
}

.modal-leave-active {
	opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
	-webkit-transform: scale(1.1);
	transform: scale(1.1);
}
</style>
