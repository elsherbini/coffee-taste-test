<script lang="ts">
    import { browser } from '$app/environment';
    import { Rating, Segment } from '@skeletonlabs/skeleton-svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';

    // Initialize the toaster
    const toaster = createToaster();

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
    let acidity = $state(0);
    let sweetness = $state(0);
    let quality = $state(0);
    let tastingNotes = '';
    
    const bodyOptions = ['Light', 'Medium', 'Heavy'];
    let body = $state(bodyOptions[0]);

    const coffeeOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    let coffee = $state('');
    let coffeeSelected = $state(false);

    // Status for form submission
    let isSubmitting = $state(false);
    let flashVisible = $state(false);
    let isSuccess = $state(false);

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
        coffeeSelected = true;
    }

    // Reset form to initial state
    function resetForm() {
        bitterness = 0;
        acidity = 0;
        sweetness = 0;
        quality = 0;
        tastingNotes = '';
        body = bodyOptions[0];
        coffee = '';
        coffeeSelected = false;
        aftertaste = aftertasteOptions[0];
    }

    async function handleSubmit() {
        if (isSubmitting || !coffeeSelected) return;
        
        isSubmitting = true;
        
        if (browser) {
            try {
                // Create form data object with all our values
                const formData = {
                    userId,
                    coffee,
                    bitterness,
                    sweetness,
                    acidity,
                    body,
                    aftertaste,
                    tastingNotes,
                    quality,
                    timestamp: new Date().toISOString()
                };
                
                // Send data to our API endpoint
                const response = await fetch('/.netlify/functions/server/api/submit-taste-test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    // Show success message
                    isSuccess = true;
                    flashVisible = true;
                    
                    toaster.success({
                        title: 'Success',
                        description: 'Your taste test has been submitted!'
                    });
                    
                    // Reset the form after successful submission
                    setTimeout(() => {
                        resetForm();
                        flashVisible = false;
                    }, 2000);
                } else {
                    // Show error message
                    isSuccess = false;
                    flashVisible = true;
                    
                    toaster.error({
                        title: 'Error',
                        description: 'Failed to submit form. Please try again.'
                    });
                    
                    setTimeout(() => {
                        flashVisible = false;
                    }, 2000);
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                
                // Show error toast
                toaster.error({
                    title: 'Error',
                    description: 'Could not submit the form. Please try again.'
                });
                
                isSuccess = false;
                flashVisible = true;
                setTimeout(() => {
                    flashVisible = false;
                }, 2000);
                isSubmitting = false;
            }
        }
    }
    
    let prefilledLink = $derived(`https://docs.google.com/forms/d/e/1FAIpQLSdUU_4nttpp5a15pp2T9bQqDAkiSSGaHx4MZJzvhp9r_zjmRA/viewform?usp=pp_url&entry.1794639938=${userId}&entry.1599024898=${coffee}&entry.1824965704=${bitterness}&entry.671551337=${sweetness}&entry.272037129=${acidity}&entry.1154026105=${body}&entry.832944999=${aftertaste}&entry.1596012011=${tastingNotes}&entry.354662826=${quality}`)
</script>

<!-- Add the Toaster component at the top level -->
<Toaster {toaster} />

<div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Coffee Taste Test</h1>
    
    <form class="space-y-6">
        <!-- Coffee Selection - Always Visible -->
        <div class="card p-6 variant-glass-surface">
            <div class="form-group">
                <label class="h3 mb-4">Select Coffee Sample to Test</label>
                <div class="flex flex-wrap gap-2 mt-4">
                    {#each coffeeOptions as c}
                        <button 
                            type="button" 
                            class={`btn ${coffee === c ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                            on:click={() => setSelectedCoffee(c)}
                        >
                            <span>{c}</span>
                        </button>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Rest of the form - Only visible after coffee selection -->
        {#if coffeeSelected}
            <div transition:scale={{ duration: 300, start: 0.95 }}>
                <div class="card p-6 variant-glass-surface space-y-6">
                    <h2 class="h3">Evaluating Coffee {coffee}</h2>

                    <div class="form-group">
                        <label class="label">
                            Bitterness{bitterness > 0 ? ` ${bitterness}/5` : ''}
                        </label>
                        <Rating allowHalf value={bitterness} onValueChange={(e) => (bitterness = e.value)} />
                    </div>
                    
                    <div class="form-group">
                        <label class="label">
                            Acidity{acidity > 0 ? ` ${acidity}/5` : ''}
                        </label>
                        <Rating allowHalf value={acidity} onValueChange={(e) => (acidity = e.value)} />
                    </div>
                    
                    <div class="form-group">
                        <label class="label">
                            Sweetness{sweetness > 0 ? ` ${sweetness}/5` : ''}
                        </label>
                        <Rating allowHalf value={sweetness} onValueChange={(e) => (sweetness = e.value)} />
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Body</label>
                        <div class="flex gap-2">
                            {#each bodyOptions as b}
                                <button type="button" class={`chip capitalize ${body === b ? 'preset-gradient' : 'preset-outlined-primary-500'}`} on:click={() => setBody(b)}>
                                    <span>{b}</span>
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="label">Aftertaste</label>
                        <!-- Horizontal on medium/large screens, vertical on small screens -->
                        <div class="hidden sm:block">
                            <div class="flex gap-2">
                                {#each aftertasteOptions as a}
                                    <button type="button" class={`chip capitalize ${aftertaste === a ? 'preset-gradient' : 'preset-outlined-primary-500'}`} on:click={() => setAftertaste(a)}>
                                        <span>{a}</span>
                                    </button>
                                {/each}
                            </div>
                        </div>
                        <!-- Vertical segment for small screens -->
                        <div class="block sm:hidden">
                            <Segment 
                                value={aftertaste} 
                                onValueChange={(e) => setAftertaste(e.value as string)} 
                                orientation="vertical"
                            >
                                {#each aftertasteOptions as a}
                                    <Segment.Item value="{a}">{a}</Segment.Item>
                                {/each}
                            </Segment>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="label">
                            Overall Quality{quality > 0 ? ` ${quality}/5` : ''}
                        </label>
                        <Rating allowHalf value={quality} onValueChange={(e) => (quality = e.value)} />
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Tasting Notes</label>
                        <textarea bind:value={tastingNotes} class="textarea" rows="3" placeholder="Enter any additional notes"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="label">Change Coffee Selection</label>
                        <div class="flex gap-2 items-center">
                            <span class="text-sm">Currently testing: <strong>Coffee {coffee}</strong></span>
                            <select class="select" bind:value={coffee}>
                                {#each coffeeOptions as c}
                                    <option value={c}>Coffee {c}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex gap-4">
                        <div class="relative">
                            <button 
                                type="button" 
                                class="btn preset-gradient" 
                                on:click={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                            
                            {#if flashVisible}
                                <div 
                                    class="absolute inset-0 {isSuccess ? 'bg-green-500' : 'bg-red-500'} opacity-70 rounded" 
                                    transition:fade={{ duration: 300 }}
                                ></div>
                            {/if}
                        </div>
                        <button type="button" class="btn preset-outlined-primary-500" on:click={resetForm}>Reset</button>
                    </div>
                </div>
            </div>
        {/if}
        
        <div class="flex justify-start">
            <a href="/" class="btn variant-ghost-surface">Back to Home</a>
        </div>
    </form>
</div>

<style>
    /* Removed alert styles as they're no longer needed */
</style> 