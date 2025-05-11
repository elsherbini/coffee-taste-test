<script lang="ts">
    import { browser } from '$app/environment';
    import { Rating } from '@skeletonlabs/skeleton-svelte';
    import { goto } from '$app/navigation';

    // Generate a random user ID
    function generateUserId(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    // Get stored user ID or generate a new one
    function getStoredUserId(): string {
        if (browser) {
            const stored = localStorage.getItem('coffee-survey-user-id');
            if (stored) return stored;
            
            const newId = generateUserId();
            localStorage.setItem('coffee-survey-user-id', newId);
            return newId;
        }
        return generateUserId();
    }

    let userId = $state(getStoredUserId());

    let bitterness = $state(0);
    let acidity = $state(0);;
    let sweetness = $state(0);;
    let quality = $state(0);
    let tastingNotes = '';
    
    const bodyOptions = ['Light', 'Medium', 'Heavy'];
      let body = $state(bodyOptions[0]);

    const coffeeOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    let coffee = $state(coffeeOptions[0]);


  function setBody(selectedBody: string) {
    body = selectedBody;
  }
    const aftertasteOptions = ['No finish/quick finish', 'Unpleasant', 'Pleasant'];
    
      let aftertaste = $state(aftertasteOptions[0]);

  function setAftertaste(selectedAftertaste: string) {
    aftertaste = selectedAftertaste;
  }

  function setSelectedCoffee(selectedCoffee: string) {
    coffee = selectedCoffee;
  }

    async function handleSubmit() {
        // Make a GET request to the prefilled Google Form link
        if (browser) {
            try {
                const response = await fetch(prefilledLink);
                const data = await response.text();
                console.log('Response from form submission:', response.status, response.statusText);
                console.log('Response data:', data.substring(0, 100) + '...'); // Log first 100 chars
            } catch (error) {
                console.error('Error submitting form:', error);
            }
        }
    }
    let prefilledLink = $derived(`https://docs.google.com/forms/d/e/1FAIpQLSdUU_4nttpp5a15pp2T9bQqDAkiSSGaHx4MZJzvhp9r_zjmRA/viewform?usp=pp_url&entry.1794639938=${userId}&entry.1599024898=${coffee}&entry.1824965704=${bitterness}&entry.671551337=${sweetness}&entry.272037129=${acidity}&entry.1154026105=${body}&entry.832944999=${aftertaste}&entry.1596012011=${tastingNotes}&entry.354662826=${quality}`)
</script>

<div class="max-w-2xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-8 text-center">Welcome to Coffee Survey</h1>
    
    <div class="flex flex-col gap-4">
        <div class="card p-6 variant-filled-primary">
            <h2 class="h3 mb-4">Coffee Taste Test</h2>
            <p class="mb-4">Rate and evaluate specific coffee samples based on taste characteristics.</p>
            <a href="/taste-test" class="btn variant-filled-surface">
                Start Taste Test
            </a>
        </div>
        
        <div class="card p-6 variant-filled-secondary">
            <h2 class="h3 mb-4">Coffee Preference Survey</h2>
            <p class="mb-4">Tell us about your general coffee preferences and habits.</p>
            <a href="/preference-survey" class="btn variant-filled-surface">
                Start Preference Survey
            </a>
        </div>
    </div>
</div>
