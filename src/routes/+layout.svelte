<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	
	// Helper to check if current route is active
	function isActive(path: string): boolean {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}
	
	// Mobile menu state
	let mobileMenuOpen = $state(false);
	
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<div class="">
	<header class="bg-surface-100-800-token border-b border-surface-300-600-token sticky top-0 z-50">
		<div class="container mx-auto px-4 py-3">
			<div class="flex justify-between items-center">
				<a href="{base}/" class="text-xl font-bold no-underline hover:text-primary-500 transition-colors">
					Coffee Survey
				</a>
				
				<!-- Desktop Navigation -->
				<nav class="hidden md:flex items-center gap-2">
					<a 
						href="{base}/preference-survey" 
						class="btn btn-sm {isActive('/preference-survey') ? 'preset-filled' : 'preset-tonal'}"
					>
						Personal Survey
					</a>
					<a 
						href="{base}/taste-test" 
						class="btn btn-sm {isActive('/taste-test') ? 'preset-filled' : 'preset-tonal'}"
					>
						Taste Test
					</a>
					<a 
						href="{base}/results" 
						class="btn btn-sm {isActive('/results') ? 'preset-filled' : 'preset-tonal'}"
					>
						Results
					</a>
				</nav>
				
				<!-- Mobile Menu Button -->
				<button 
					class="md:hidden btn btn-sm preset-ghost flex items-center gap-1"
					onclick={toggleMobileMenu}
					aria-label="Toggle mobile menu"
				>
					<span class="text-lg">
						{#if mobileMenuOpen}✕{:else}☰{/if}
					</span>
				</button>
			</div>
			
			<!-- Mobile Navigation Menu -->
			{#if mobileMenuOpen}
				<nav class="md:hidden mt-4 pb-4 border-t border-surface-300-600-token pt-4">
					<div class="flex flex-col gap-2">
						<a 
							href="{base}/preference-survey" 
							class="btn {isActive('/preference-survey') ? 'preset-filled' : 'preset-tonal'} justify-start"
							onclick={closeMobileMenu}
						>
							📝 Personal Survey
						</a>
						<a 
							href="{base}/taste-test" 
							class="btn {isActive('/taste-test') ? 'preset-filled' : 'preset-tonal'} justify-start"
							onclick={closeMobileMenu}
						>
							☕ Taste Test
						</a>
						<a 
							href="{base}/results" 
							class="btn {isActive('/results') ? 'preset-filled' : 'preset-tonal'} justify-start"
							onclick={closeMobileMenu}
						>
							📊 Results
						</a>
					</div>
				</nav>
			{/if}
		</div>
	</header>

	<main class="min-h-screen bg-surface-50-900-token">
		<slot />
	</main>
</div>

<style>
	/* Smooth transitions for mobile menu */
	nav {
		transition: all 0.2s ease-in-out;
	}
	
	/* Ensure proper stacking for sticky header */
	header {
		backdrop-filter: blur(8px);
		background-color: rgba(var(--color-surface-100), 0.95);
	}
	
	:global(.dark) header {
		background-color: rgba(var(--color-surface-800), 0.95);
	}
</style>
