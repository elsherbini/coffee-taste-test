import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse the incoming JSON data
        const formData = await request.json();
        
        // Extract all the form fields
        const { 
            userId, 
            coffee, 
            bitterness, 
            sweetness, 
            acidity, 
            body, 
            aftertaste, 
            tastingNotes, 
            quality 
        } = formData;
        
        // Create the Google Forms URL with query parameters
        const googleFormUrl = `https://docs.google.com/forms/d/e/1FAIpQLSdUU_4nttpp5a15pp2T9bQqDAkiSSGaHx4MZJzvhp9r_zjmRA/formResponse`;
        
        // Prepare the form data for Google Forms
        const params = new URLSearchParams();
        params.append('entry.1794639938', userId);
        params.append('entry.1599024898', coffee);
        params.append('entry.1824965704', bitterness.toString());
        params.append('entry.671551337', sweetness.toString());
        params.append('entry.272037129', acidity.toString());
        params.append('entry.1154026105', body);
        params.append('entry.832944999', aftertaste);
        params.append('entry.1596012011', tastingNotes);
        params.append('entry.354662826', quality.toString());
        params.append('submit', 'Submit');
        
        // Send the data to Google Forms
        const response = await fetch(googleFormUrl, {
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