import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import formConfigData from '$lib/config/taste-test-form.json';
import type { FormConfig } from '$lib/types/form-config';

// Cast the imported JSON to our FormConfig type
const formConfig: FormConfig = formConfigData as FormConfig;

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse the incoming JSON data
        const formData = await request.json();
        
        // Create URLSearchParams for Google Forms
        const params = new URLSearchParams();
        
        // Extract all the form fields and map them to Google Form entry IDs
        Object.entries(formData).forEach(([field, value]) => {
            const entryId = formConfig.fieldMappings[field];
            if (entryId) {
                // Convert all values to string
                params.append(entryId, String(value));
            } else {
                console.warn(`No mapping found for field: ${field}`);
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