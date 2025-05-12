<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
</script>

<div class="">
	<header class="bg-surface-100-800-token p-4">
		<div class="container mx-auto flex justify-between items-center">
			<a href="{base}/" class="text-xl font-bold no-underline">Coffee Survey</a>
			
			<nav class="flex items-center gap-4">
				<a href="{base}/taste-test" class="btn btn-sm preset-tonal">Taste Test</a>
				<a href="{base}/preference-survey" class="btn btn-sm preset-tonal">Personal Survey</a>
			</nav>
		</div>
	</header>

	<main class="container mx-auto p-4">
		<slot />
	</main>
</div>

<style>

</style>
