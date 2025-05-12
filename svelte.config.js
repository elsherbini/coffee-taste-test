import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use Netlify adapter for better integration
		adapter: adapter({
			// Add adapter options for server-side functions
			edge: false,
			split: false
		}),
		paths: {
			// Remove GitHub Pages specific base path
			base: ''
		},
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore 404s that happen during prerendering
				if (message.includes('Not found')) return;
				console.warn(`${path} referred from ${referrer} - ${message}`);
			}
		}
	}
};

export default config;
