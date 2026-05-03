<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

{@render children()}

<style>
	:global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
	:global(body) {
		background: radial-gradient(ellipse at top, #1a1612 0%, #0a0807 70%);
		min-height: 100vh;
		color: #e8e2d5;
		font-family: 'Outfit', sans-serif;
	}
	:global(select) {
		background: #1a1612; color: #e8e2d5;
		border: 1px solid #3a342f; padding: 6px 10px;
		border-radius: 4px; font-family: inherit; cursor: pointer;
	}
	:global(select:hover) { border-color: #d4a574; }
	:global(button) { font-family: inherit; cursor: pointer; transition: all 0.2s; }
</style>
