# Coffee Survey App

A SvelteKit application for conducting coffee taste tests and preference surveys. Built with SvelteKit, Skeleton UI, and Netlify.

## Features

- Taste test form for rating coffee samples
- Coffee preference survey for capturing user preferences
- Server-side API endpoints to submit form data to Google Forms
- Mobile-responsive design

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Netlify Deployment

This project is configured for deployment on Netlify. To deploy:

1. Push your code to a Git repository
2. Connect your repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Environment variables: None required

Netlify will automatically detect that this is a SvelteKit project using the Netlify adapter.

## API Endpoints

The application provides two server-side API endpoints that handle form submissions:

- `/api/submit-taste-test` - Handles submissions from the taste test form
- `/api/submit-preference-survey` - Handles submissions from the preference survey

These endpoints forward the data to Google Forms for storage and analysis.

## Technology Stack

- SvelteKit 2.x
- Skeleton UI
- Tailwind CSS
- TypeScript
- Netlify Adapter 