<script lang="ts">
    import { browser } from '$app/environment';
    import { Rating, Segment, TagsInput } from '@skeletonlabs/skeleton-svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';
    import { onMount } from 'svelte';
    import FlavorWheel from '$lib/components/FlavorWheel.svelte';

    // Initialize the toaster
    const toaster = createToaster();

    // Store for completed tests
    type CoffeeTest = {
        coffee: string;
        aroma: number;
        acidity: string;
        flavor: number;
        enjoyment: number;
        tastingNotes: string[];
        body: string;
        aftertaste: number;
        timestamp: string;
    };

    let completedTests = $state<Record<string, CoffeeTest>>({});
    let isAlreadyTested = $state(false);

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

    let aroma = $state(0);
    let acidity = $state("No acidity");
    let flavor = $state(0);
    let enjoyment = $state(0);
    let tastingNotes = $state<string[]>([]);
    let aftertaste = $state(0);
    
    const bodyOptions = ['Light', 'Medium', 'Heavy'];
    let body = $state(bodyOptions[0]);

    const acidityOptions = ['No acidity', 'Pleasant acidity', 'Too acidic'];

    const coffeeOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    let coffee = $state('');
    let coffeeSelected = $state(false);

    // Status for form submission
    let isSubmitting = $state(false);
    let flashVisible = $state(false);
    let isSuccess = $state(false);

    // Load completed tests from localStorage on mount
    onMount(() => {
        if (browser) {
            const storedTests = localStorage.getItem('completed-coffee-tests');
            if (storedTests) {
                completedTests = JSON.parse(storedTests);
            }
        }
    });

    // Use $effect to keep isAlreadyTested in sync with completedTests and coffee
    $effect(() => {
        if (coffee) {
            isAlreadyTested = completedTests[coffee] !== undefined;
        } else {
            isAlreadyTested = false;
        }
    });

    function setBody(selectedBody: string) {
        body = selectedBody;
    }

    function setAcidity(selectedAcidity: string) {
        acidity = selectedAcidity;
    }

    const aftertasteOptions = ['No finish/quick finish', 'Unpleasant', 'Pleasant'];
    
    function setSelectedCoffee(selectedCoffee: string) {
        coffee = selectedCoffee;
        coffeeSelected = true;
        isSubmitting = false; // Reset submission state when changing coffees
        
        // If already tested, load the previous results
        if (completedTests[selectedCoffee]) {
            const test = completedTests[selectedCoffee];
            aroma = test.aroma;
            acidity = test.acidity;
            flavor = test.flavor;
            aftertaste = test.aftertaste;
            enjoyment = test.enjoyment;
            tastingNotes = test.tastingNotes;
            body = test.body;
        } else {
            // Reset values for a new test
            aroma = 0;
            acidity = acidityOptions[0];
            flavor = 0;
            aftertaste = 0;
            enjoyment = 0;
            tastingNotes = [];
            body = bodyOptions[0];
        }
    }

    // Reset form to initial state
    function resetForm() {
        aroma = 0;
        acidity = acidityOptions[0];
        flavor = 0;
        aftertaste = 0;
        enjoyment = 0;
        tastingNotes = [];
        body = bodyOptions[0];
        coffee = '';
        coffeeSelected = false;
    }

    async function handleSubmit() {
        if (isSubmitting || !coffeeSelected || isAlreadyTested) return;
        
        // Validate that enjoyment is rated (required field)
        if (enjoyment === 0) {
            toaster.error({
                title: 'Required Field',
                description: 'Please rate your overall enjoyment before submitting.'
            });
            return;
        }
        
        isSubmitting = true;
        
        if (browser) {
            try {
                // Create form data object with all our values
                const formData = {
                    userId,
                    coffee,
                    aroma,
                    flavor,
                    acidity,
                    body,
                    aftertaste,
                    tastingNotes,
                    enjoyment,
                    timestamp: new Date().toISOString()
                };
                
                // Send data to our API endpoint
                const response = await fetch('/api/submit-taste-test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    // Store the test in local storage
                    isSubmitting = false;
                    completedTests[coffee] = {
                        coffee,
                        aroma,
                        flavor,
                        acidity,
                        body,
                        aftertaste,
                        tastingNotes,
                        enjoyment,
                        timestamp: new Date().toISOString()
                    };
                    
                    localStorage.setItem('completed-coffee-tests', JSON.stringify(completedTests));
                    
                    // Show success message
                    isSuccess = true;
                    flashVisible = true;
                    
                    toaster.success({
                        title: 'Success',
                        description: 'Your taste test has been submitted!'
                    });
                    
                    // Just mark as submitted, but don't reset the form
                    setTimeout(() => {
                        flashVisible = false;
                        isSubmitting = false;
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
                        isSubmitting = false;
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
    
    let prefilledLink = $derived(`https://docs.google.com/forms/d/e/1FAIpQLSdUU_4nttpp5a15pp2T9bQqDAkiSSGaHx4MZJzvhp9r_zjmRA/viewform?usp=pp_url&entry.1794639938=${userId}&entry.1599024898=${coffee}&entry.1824965704=${aroma}&entry.671551337=${flavor}&entry.272037129=${acidity}&entry.1154026105=${body}&entry.832944999=${aftertaste}&entry.1596012011=${tastingNotes}&entry.354662826=${enjoyment}`)

    function handleFlavorSelect(flavor: string) {
        if (!isAlreadyTested && !tastingNotes.includes(flavor)) {
            tastingNotes = [...tastingNotes, flavor];
        }
    }
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
                        <!-- Change color for tested coffees -->
                        <button 
                            type="button" 
                            class={`btn ${coffee === c ? 'preset-gradient' : completedTests[c] ? 'preset-gradient-success' : 'preset-outlined-primary-500'}`} 
                            onclick={() => setSelectedCoffee(c)}
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
                    <h2 class="h3">
                        Evaluating Coffee {coffee}
                        {#if isAlreadyTested}
                            <span class="badge variant-filled-success">Already Tested</span>
                        {/if}
                    </h2>

                    <div class="form-group">
                        <label class="label" for="aroma">
                            Aroma{aroma > 0 ? ` ${aroma}/5` : ''}
                        </label>
                        <Rating allowHalf value={aroma} onValueChange={(e) => !isAlreadyTested && (aroma = e.value)} />
                    </div>
                    
                    
                    <div class="form-group">
                        <label class="label" for="flavor">
                            Flavor{flavor > 0 ? ` ${flavor}/5` : ''}
                        </label>
                        <Rating allowHalf value={flavor} onValueChange={(e) => !isAlreadyTested && (flavor = e.value)} />
                    </div>
                    
                    <div class="form-group">
                        <label class="label" for="aftertaste">
                            Aftertaste{aftertaste > 0 ? ` ${aftertaste}/5` : ''}
                        </label>
                        <Rating allowHalf value={aftertaste} onValueChange={(e) => !isAlreadyTested && (aftertaste = e.value)} />
                    </div>
                    
                    <div class="form-group">
                        <label class="label" for="body">Body</label>
                        <div class="flex gap-2">
                            {#each bodyOptions as b}
                                <button 
                                    type="button" 
                                    class={`chip capitalize ${body === b ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                                    onclick={() => setBody(b)}
                                    disabled={isAlreadyTested}
                                >
                                    <span>{b}</span>
                                </button>
                            {/each}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="label" for="acidity">Acidity</label>
                        <div class="flex gap-2 flex-wrap">
                            {#each acidityOptions as a}
                                <button 
                                    type="button" 
                                    class={`chip capitalize ${acidity === a ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                                    onclick={() => !isAlreadyTested && setAcidity(a)}
                                    disabled={isAlreadyTested}
                                >
                                    <span>{a}</span>
                                </button>
                            {/each}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="label" for="tastingNotes">Tasting Notes</label>
                        <div class="space-y-4">

                            <div class="card p-4 variant-glass-surface">
                                <h3 class="h4 mb-4">Coffee Flavor Wheel</h3>
                                <p class="text-sm mb-4">Click on flavors in the wheel to add them as tasting notes</p>
                                <FlavorWheel onFlavorSelect={handleFlavorSelect} />
                            </div>
                            <TagsInput 
                            value={tastingNotes}
                            editable={false}
                            onValueChange={(e) => !isAlreadyTested && (tastingNotes = e.value)}
                            placeholder="Add tasting note..."
                            disabled={isAlreadyTested}
                        />
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="label" for="enjoyment">
                            Overall Enjoyment{enjoyment > 0 ? ` ${enjoyment}/5` : ''} <span class="text-error-500">*</span>
                        </label>
                        <Rating allowHalf value={enjoyment} onValueChange={(e) => !isAlreadyTested && (enjoyment = e.value)} />
                        <p class="text-sm text-error-500 mt-1">{enjoyment === 0 ? 'This field is required' : ''}</p>
                    </div>
                    <div class="form-group">
                        <label class="label" for="changeCoffeeSelection">Change Coffee Selection</label>
                        <div class="flex gap-2 items-center">
                            <span class="text-sm">Currently testing: <strong>Coffee {coffee}</strong></span>
                            <select class="select" bind:value={coffee} onchange={() => setSelectedCoffee(coffee)}>
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
                                class="btn {isAlreadyTested ? 'preset-ghost-neutral' : 'preset-gradient'}" 
                                onclick={handleSubmit}
                                disabled={isSubmitting || isAlreadyTested}
                            >
                                {isSubmitting ? 'Submitting...' : isAlreadyTested ? 'Already Submitted' : 'Submit'}
                            </button>
                            
                            {#if flashVisible}
                                <div 
                                    class="absolute inset-0 {isSuccess ? 'bg-green-500' : 'bg-red-500'} opacity-70 rounded" 
                                    transition:fade={{ duration: 300 }}
                                ></div>
                            {/if}
                        </div>
                        <button 
                            type="button" 
                            class="btn preset-outlined-primary-500" 
                            onclick={resetForm}
                        >
                            Reset
                        </button>
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