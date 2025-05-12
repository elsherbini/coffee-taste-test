import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse the incoming JSON data
        const formData = await request.json();
        
        // Extract all the form fields
        const { 
            userId,
            preference,
            coffeeFrequency,
            coffeesPerDay,
            teasPerDay,
            otherCaffeinatedDrinks,
            blackCoffee,
            drinkDecaf,
            selectedAdditions,
            selectedCoffeeTypes,
            roastPreference,
            selectedReasons,
            selectedLimitReasons
        } = formData;
        
        // Function to format arrays for URL
        const formatArrayForUrl = (arr: string[]): string => {
            return Array.isArray(arr) ? arr.join(', ') : '';
        };
        
        // Create the Google Forms URL with query parameters
        const googleFormUrl = `https://docs.google.com/forms/d/e/1FAIpQLScEqPRm9qKfdgCpRz1WbjQoO5xLLRtwnp2eUMY5TXxeZGWklQ/formResponse`;
        
        // Prepare the form data for Google Forms
        const params = new URLSearchParams();
        params.append('entry.649444699', userId);
        params.append('entry.1827359057', preference);
        params.append('entry.70561061', coffeeFrequency);
        params.append('entry.465256553', coffeesPerDay.toString());
        params.append('entry.1432820961', teasPerDay.toString());
        params.append('entry.1544061021', otherCaffeinatedDrinks.toString());
        params.append('entry.2016949479', blackCoffee);
        params.append('entry.461709431', drinkDecaf);
        params.append('entry.270068699', formatArrayForUrl(selectedAdditions));
        params.append('entry.1869977587', formatArrayForUrl(selectedCoffeeTypes));
        params.append('entry.1035930586', roastPreference);
        params.append('entry.558699320', formatArrayForUrl(selectedReasons));
        params.append('entry.1572246610', formatArrayForUrl(selectedLimitReasons));
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