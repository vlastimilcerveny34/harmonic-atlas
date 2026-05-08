<script lang="ts">
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { theme } from '$lib/stores/session.js';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();

	$effect(() => { theme.init(); });
	$effect(() => { document.documentElement.dataset.theme = $theme; });
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

{@render children()}

<style>
	:global(:root) {
		--bg-page: radial-gradient(ellipse at top, #1a1612 0%, #0a0807 70%);

		--surface-1: #0f0d0b;
		--surface-2: #13100e;
		--surface-3: #16120f;
		--surface-4: #1a1612;
		--surface-5: #2a221a;
		--surface-6: #3a2e22;
		--surface-hover: #161210;

		--surface-green-0: #101510;
		--surface-green-1: #1a221a;
		--surface-green-2: #2a3a22;

		--border-1: #2a251f;
		--border-2: #26211c;
		--border-3: #3a342f;
		--border-4: #5a4f3f;

		--border-green-1: #2a4a2a;
		--border-green-2: #3a6a3a;
		--border-green-3: #3a4a32;
		--border-green-4: #5a7a45;

		--text-0: #f4ead7;
		--text-1: #e8e2d5;
		--text-2: #c8c1b5;
		--text-3: #9b948a;
		--text-4: #7a736a;
		--text-5: #5c5650;

		--accent: #d4a574;
		--on-accent: #1a1612;
		--on-chip: #1a1612;
		--badge-bg: #1a1410;

		--btn-color-text: #8eaf6e;
		--btn-color-text-active: #c8dca0;
		--btn-color-bg-active: #2a3a22;
		--btn-color-border: #3a4a32;
		--btn-color-border-active: #5a7a45;

		--toggle-thumb: #0a0807;
		--overlay: rgba(0, 0, 0, 0.7);
	}

	:global([data-theme="light"]) {
		--bg-page: radial-gradient(ellipse at top, #f5f0ea 0%, #ede6dc 100%);

		--surface-1: #f2ece3;
		--surface-2: #f8f3ec;
		--surface-3: #ffffff;
		--surface-4: #f0e8de;
		--surface-5: #e8ddd0;
		--surface-6: #ddd0c0;
		--surface-hover: #ece5da;

		--surface-green-0: #eef5e8;
		--surface-green-1: #e4f0da;
		--surface-green-2: #d8eecc;

		--border-1: #d8d0c5;
		--border-2: #ddd5c8;
		--border-3: #c8bfb4;
		--border-4: #b8a898;

		--border-green-1: #a8c07a;
		--border-green-2: #8aaa5a;
		--border-green-3: #9ab870;
		--border-green-4: #6a9a3a;

		--text-0: #1a1410;
		--text-1: #2a2018;
		--text-2: #4a3f35;
		--text-3: #7a6f65;
		--text-4: #9b8f85;
		--text-5: #b5aaa0;

		--accent: #8a5820;
		--on-accent: #fff8f0;
		--on-chip: #1a1410;
		--badge-bg: #f8f3ec;

		--btn-color-text: #3a6a20;
		--btn-color-text-active: #2a5010;
		--btn-color-bg-active: #d8eecc;
		--btn-color-border: #8aaa5a;
		--btn-color-border-active: #6a9a3a;

		--toggle-thumb: #ffffff;
		--overlay: rgba(0, 0, 0, 0.5);
	}

	:global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
	:global(body) {
		background: var(--bg-page);
		min-height: 100vh;
		color: var(--text-1);
		font-family: 'Outfit', sans-serif;
	}
	:global(select) {
		background: var(--surface-4); color: var(--text-1);
		border: 1px solid var(--border-3); padding: 6px 10px;
		border-radius: 4px; font-family: inherit; cursor: pointer;
	}
	:global(select:hover) { border-color: var(--accent); }
	:global(button) { font-family: inherit; cursor: pointer; transition: all 0.2s; }
</style>
