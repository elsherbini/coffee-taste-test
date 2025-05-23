import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import formConfigData from '$lib/config/preference-survey-form.json';
import type { FormConfig } from '$lib/types/form-config';

// Cast the imported JSON to our FormConfig type
const formConfig: FormConfig = formConfigData as FormConfig;

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse the incoming JSON data
        const formData = await request.json();
        
        // Function to format arrays for URL
        const formatArrayForUrl = (arr: string[]): string => {
            return Array.isArray(arr) ? arr.join(', ') : '';
        };
        
        // Create URLSearchParams for Google Forms
        const params = new URLSearchParams();
        
        // Process form data and map to Google Form entry IDs
        Object.entries(formData).forEach(([field, value]) => {
            const entryId = formConfig.fieldMappings[field];
            if (!entryId) {
                console.warn(`No mapping found for field: ${field}`);
                return;
            }
            
            // Handle arrays specially
            if (Array.isArray(value)) {
                params.append(entryId, formatArrayForUrl(value));
            } else {
                // Convert all other values to string
                params.append(entryId, String(value));
            }
        });
        
        params.append('submit', 'Submit');
        
        // Send the data to Google Forms using the URL from config
        const response = await fetch(formConfig.formUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            redirect: 'manual', // Prevent following redirects
        });
        
        // Google Forms typically returns a redirect status code after submission
        if (response.status >= 200 && response.status < 400) {
            return json({ success: true, message: 'Form submitted successfully' });
        } else {
            console.error('Google Forms submission failed with status:', response.status);
            return json(
                { success: false, message: 'Failed to submit form to Google Forms' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        return json(
            { success: false, message: 'Server error processing form submission' },
            { status: 500 }
        );
    }
} 