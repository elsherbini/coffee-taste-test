<script lang="ts">
    import { browser } from '$app/environment';
    import { Toaster, createToaster, Segment } from '@skeletonlabs/skeleton-svelte';
    import { fade, scale } from 'svelte/transition';
    import { onMount } from 'svelte';
    
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
    
    // Form fields with default values
    let coffeesPerDay = $state(0);
    let teasPerDay = $state(0);
    let otherCaffeinatedDrinks = $state(0);
    let blackCoffee = $state('No');
    let drinkDecaf = $state('No');
    
    // Preference type
    const preferenceOptions = ['Coffee', 'Tea', 'Both', 'Neither'];
    let preference = $state(preferenceOptions[0]); // Default to Coffee
    
    // Frequency options
    const frequencyOptions = ['Daily', 'Several times a week', 'Once a week', 'Less than weekly'];
    let coffeeFrequency = $state(frequencyOptions[0]); // Default to daily
    
    // Coffee additions
    const additionOptions = ['Nothing!', 'Milk/Dairy', 'Non-dairy creamer', 'Sugar', 'Sweetener', 'Flavor syrup'];
    let selectedAdditions = $state<string[]>([]);
    
    // Coffee types
    const coffeeTypeOptions = [
        'The Ragon machine',
        'Coffee pod / Keurig',
        'Americano / Espresso',
        'Espresso drinks with milk',
        'Filter coffee (batch brew, pour over)',
        'French press / Immersion',
        'Instant powder',
        'Cold brew'
    ];
    let selectedCoffeeTypes = $state<string[]>([]);
    
    // Roast preference
    const roastOptions = ['Light', 'Medium', 'Dark'];
    let roastPreference = $state(roastOptions[1]); // Default to medium
    
    // Why drink coffee
    const reasonOptions = [
        'I don\'t normally drink coffee',
        'I like the taste',
        'Caffeine',
        'I like the ritual',
        'To poop'
    ];
    let selectedReasons = $state<string[]>([]);
    
    // Why don't drink more coffee
    const limitReasonOptions = [
        'I don\'t like the taste',
        'It makes me jittery',
        'It affects my sleep',
        'It\'s too expensive',
        'Health concerns',
        'I already drink enough'
    ];
    let selectedLimitReasons = $state<string[]>([]);
    
    // Status for form submission
    let isSubmitting = $state(false);
    let flashVisible = $state(false);
    let isSuccess = $state(false);
    let hasSubmitted = $state(false);

    // Load saved form data from localStorage on mount
    onMount(() => {
        if (browser) {
            // Check if user has already submitted the form
            const submitted = localStorage.getItem('coffee-preference-submitted');
            if (submitted === 'true') {
                hasSubmitted = true;
            }

            // Load saved form data
            const savedCoffeesPerDay = localStorage.getItem('coffee-preference-coffeesPerDay');
            if (savedCoffeesPerDay) coffeesPerDay = parseInt(savedCoffeesPerDay);
            
            const savedTeasPerDay = localStorage.getItem('coffee-preference-teasPerDay');
            if (savedTeasPerDay) teasPerDay = parseInt(savedTeasPerDay);
            
            const savedOtherCaffeinatedDrinks = localStorage.getItem('coffee-preference-otherCaffeinatedDrinks');
            if (savedOtherCaffeinatedDrinks) otherCaffeinatedDrinks = parseInt(savedOtherCaffeinatedDrinks);
            
            const savedBlackCoffee = localStorage.getItem('coffee-preference-blackCoffee');
            if (savedBlackCoffee) blackCoffee = savedBlackCoffee;
            
            const savedDrinkDecaf = localStorage.getItem('coffee-preference-drinkDecaf');
            if (savedDrinkDecaf) drinkDecaf = savedDrinkDecaf;
            
            const savedFrequency = localStorage.getItem('coffee-preference-frequency');
            if (savedFrequency) coffeeFrequency = savedFrequency;
            
            const savedAdditions = localStorage.getItem('coffee-preference-additions');
            if (savedAdditions) selectedAdditions = JSON.parse(savedAdditions);
            
            const savedCoffeeTypes = localStorage.getItem('coffee-preference-coffeeTypes');
            if (savedCoffeeTypes) selectedCoffeeTypes = JSON.parse(savedCoffeeTypes);
            
            const savedRoastPreference = localStorage.getItem('coffee-preference-roastPreference');
            if (savedRoastPreference) roastPreference = savedRoastPreference;
            
            const savedReasons = localStorage.getItem('coffee-preference-reasons');
            if (savedReasons) selectedReasons = JSON.parse(savedReasons);
            
            const savedLimitReasons = localStorage.getItem('coffee-preference-limitReasons');
            if (savedLimitReasons) selectedLimitReasons = JSON.parse(savedLimitReasons);
            
            const savedPreference = localStorage.getItem('coffee-preference-preference');
            if (savedPreference) preference = savedPreference;
        }
    });

    // Save form data to localStorage whenever values change
    $effect(() => {
        if (browser) {
            localStorage.setItem('coffee-preference-coffeesPerDay', coffeesPerDay.toString());
            localStorage.setItem('coffee-preference-preference', preference);
            localStorage.setItem('coffee-preference-teasPerDay', teasPerDay.toString());
            localStorage.setItem('coffee-preference-otherCaffeinatedDrinks', otherCaffeinatedDrinks.toString());
            localStorage.setItem('coffee-preference-blackCoffee', blackCoffee);
            localStorage.setItem('coffee-preference-drinkDecaf', drinkDecaf);
            localStorage.setItem('coffee-preference-frequency', coffeeFrequency);
            localStorage.setItem('coffee-preference-additions', JSON.stringify(selectedAdditions));
            localStorage.setItem('coffee-preference-coffeeTypes', JSON.stringify(selectedCoffeeTypes));
            localStorage.setItem('coffee-preference-roastPreference', roastPreference);
            localStorage.setItem('coffee-preference-reasons', JSON.stringify(selectedReasons));
            localStorage.setItem('coffee-preference-limitReasons', JSON.stringify(selectedLimitReasons));
            localStorage.setItem('coffee-preference-submitted', hasSubmitted.toString());
        }
    });
    
    function toggleAddition(addition: string) {
        if (selectedAdditions.includes(addition)) {
            selectedAdditions = selectedAdditions.filter(a => a !== addition);
        } else {
            selectedAdditions = [...selectedAdditions, addition];
        }
    }
    
    function toggleCoffeeType(type: string) {
        if (selectedCoffeeTypes.includes(type)) {
            selectedCoffeeTypes = selectedCoffeeTypes.filter(t => t !== type);
        } else {
            selectedCoffeeTypes = [...selectedCoffeeTypes, type];
        }
    }
    
    function toggleReason(reason: string) {
        if (selectedReasons.includes(reason)) {
            selectedReasons = selectedReasons.filter(r => r !== reason);
        } else {
            selectedReasons = [...selectedReasons, reason];
        }
    }
    
    function toggleLimitReason(reason: string) {
        if (selectedLimitReasons.includes(reason)) {
            selectedLimitReasons = selectedLimitReasons.filter(r => r !== reason);
        } else {
            selectedLimitReasons = [...selectedLimitReasons, reason];
        }
    }
    
    function setRoastPreference(roast: string) {
        roastPreference = roast;
    }
    
    function setBlackCoffee(value: string) {
        blackCoffee = value;
    }
    
    function setDrinkDecaf(value: string) {
        drinkDecaf = value;
    }
    
    function setFrequency(frequency: string) {
        coffeeFrequency = frequency;
    }
    
    function setPreference(pref: string) {
        preference = pref;
    }
    
    // Reset form to initial state and clear localStorage
    function resetForm() {
        coffeesPerDay = 0;
        teasPerDay = 0;
        otherCaffeinatedDrinks = 0;
        blackCoffee = 'No';
        drinkDecaf = 'No';
        preference = preferenceOptions[0];
        coffeeFrequency = frequencyOptions[0];
        selectedAdditions = [];
        selectedCoffeeTypes = [];
        roastPreference = roastOptions[1];
        selectedReasons = [];
        selectedLimitReasons = [];
        
        if (browser) {
            // Clear saved form data
            localStorage.removeItem('coffee-preference-coffeesPerDay');
            localStorage.removeItem('coffee-preference-preference');
            localStorage.removeItem('coffee-preference-teasPerDay');
            localStorage.removeItem('coffee-preference-otherCaffeinatedDrinks');
            localStorage.removeItem('coffee-preference-blackCoffee');
            localStorage.removeItem('coffee-preference-drinkDecaf');
            localStorage.removeItem('coffee-preference-frequency');
            localStorage.removeItem('coffee-preference-additions');
            localStorage.removeItem('coffee-preference-coffeeTypes');
            localStorage.removeItem('coffee-preference-roastPreference');
            localStorage.removeItem('coffee-preference-reasons');
            localStorage.removeItem('coffee-preference-limitReasons');
        }
    }
    
    async function handleSubmit() {
        if (isSubmitting) return;
        
        isSubmitting = true;
        
        if (browser) {
            try {
                // Create form data object with all our values
                const formData = {
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
                    selectedLimitReasons,
                    timestamp: new Date().toISOString()
                };
                
                // Send data to our API endpoint
                const response = await fetch('/.netlify/functions/submit-preference-survey', {
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
                    hasSubmitted = true;
                    
                    toaster.success({
                        title: 'Success',
                        description: 'Your preferences have been submitted!'
                    });
                    
                    // Save submission status to localStorage
                    localStorage.setItem('coffee-preference-submitted', 'true');
                    
                    setTimeout(() => {
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
            } finally {
                isSubmitting = false;
            }
        }
    }
    
    // Format arrays for URL submission
    function formatArrayForUrl(arr: string[]): string {
        return arr.join(', ');
    }
    
    let prefilledLink = $derived(`https://docs.google.com/forms/d/e/1FAIpQLScEqPRm9qKfdgCpRz1WbjQoO5xLLRtwnp2eUMY5TXxeZGWklQ/formResponse?usp=pp_url&entry.649444699=${userId}&entry.1827359057=${preference}&entry.70561061=${coffeeFrequency}&entry.465256553=${coffeesPerDay}&entry.1432820961=${teasPerDay}&entry.1544061021=${otherCaffeinatedDrinks}&entry.2016949479=${blackCoffee}&entry.461709431=${drinkDecaf}&entry.270068699=${selectedAdditions}&entry.1869977587=${selectedCoffeeTypes}&entry.1035930586=${roastPreference}&entry.558699320=${selectedReasons}&entry.1572246610=${selectedLimitReasons}&submit=Submit`);
</script>

<!-- Add the Toaster component at the top level -->
<Toaster {toaster} />

<div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Coffee Preference Survey</h1>
    
    {#if hasSubmitted}
        <div class="card p-6 variant-glass-surface" transition:scale={{ duration: 300 }}>
            <h2 class="h3 mb-4">Thank You!</h2>
            <p class="mb-4">Your coffee preferences have been recorded. Thank you for participating in our survey!</p>
            <div class="flex gap-4">
                <a href="/" class="btn variant-filled-surface">Back to Home</a>
                <button type="button" class="btn variant-ghost" onclick={() => hasSubmitted = false}>Edit Response</button>
            </div>
        </div>
    {:else}
        <form class="space-y-6">
            <div class="card p-6 variant-glass-surface space-y-6">
                <div class="form-group">
                    <label class="label">Are you a coffee person or a tea person?</label>
                    <div class="flex flex-wrap gap-2">
                        {#each preferenceOptions as pref}
                            <button 
                                type="button" 
                                class={`btn ${preference === pref ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                                onclick={() => setPreference(pref)}
                            >
                                <span>{pref}</span>
                            </button>
                        {/each}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label">How often do you drink coffee?</label>
                    <!-- Horizontal on medium/large screens -->
                    <div class="hidden sm:block">
                        <div class="flex flex-wrap gap-2">
                            {#each frequencyOptions as frequency}
                                <button 
                                    type="button" 
                                    class={`chip ${coffeeFrequency === frequency ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                                    onclick={() => setFrequency(frequency)}
                                >
                                    <span>{frequency}</span>
                                </button>
                            {/each}
                        </div>
                    </div>
                    <!-- Vertical segment for small screens -->
                    <div class="block sm:hidden">
                        <Segment 
                            value={coffeeFrequency}
                            onValueChange={(e) => setFrequency(e.value)} 
                            orientation="vertical"
                        >
                            {#each frequencyOptions as frequency}
                                <Segment.Item value={frequency}>{frequency}</Segment.Item>
                            {/each}
                        </Segment>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="form-group">
                        <label class="label">How much coffee in a day?</label>
                        <div class="flex items-center gap-2">
                            <input 
                                type="number" 
                                bind:value={coffeesPerDay} 
                                min="0" 
                                max="20" 
                                class="input" 
                            />
                            <span>{coffeesPerDay === 1 ? 'cup' : 'cups'}</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="label">How much tea in a day?</label>
                        <div class="flex items-center gap-2">
                            <input 
                                type="number" 
                                bind:value={teasPerDay} 
                                min="0" 
                                max="20" 
                                class="input" 
                            />
                            <span>{teasPerDay === 1 ? 'cup' : 'cups'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label">Other caffeinated drinks in a day?</label>
                    <div class="flex items-center gap-2">
                        <input 
                            type="number" 
                            bind:value={otherCaffeinatedDrinks} 
                            min="0" 
                            max="20" 
                            class="input" 
                        />
                        <span>{otherCaffeinatedDrinks === 1 ? 'drink' : 'drinks'}</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label">Do you like the taste of black coffee?</label>
                    <div class="flex gap-4">
                        <button 
                            type="button" 
                            class={`btn ${blackCoffee === 'Yes' ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                            onclick={() => setBlackCoffee('Yes')}
                        >
                            Yes
                        </button>
                        <button 
                            type="button" 
                            class={`btn ${blackCoffee === 'No' ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                            onclick={() => setBlackCoffee('No')}
                        >
                            No
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label">Do you drink decaf coffee often?</label>
                    <div class="flex gap-4">
                        <button 
                            type="button" 
                            class={`btn ${drinkDecaf === 'Yes' ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                            onclick={() => setDrinkDecaf('Yes')}
                        >
                            Yes
                        </button>
                        <button 
                            type="button" 
                            class={`btn ${drinkDecaf === 'No' ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                            onclick={() => setDrinkDecaf('No')}
                        >
                            No
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label">What do you normally add to coffee? (select all that apply)</label>
                    <div class="flex flex-wrap gap-2">
                        {#each additionOptions as addition}
                            <button 
                                type="button" 
                                class={`chip ${selectedAdditions.includes(addition) ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                                onclick={() => toggleAddition(addition)}
                            >
                                <span>{addition}</span>
                            </button>
                        {/each}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label" for="coffee-types">Coffee types you drink the most? (select all that apply)</label>
                    <div class="flex flex-col gap-2" id="coffee-types">
                        {#each coffeeTypeOptions as type, i}
                            <label class="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={selectedCoffeeTypes.includes(type)} 
                                    onchange={() => toggleCoffeeType(type)} 
                                    id={`coffee-type-${i}`}
                                />
                                <span>{type}</span>
                            </label>
                        {/each}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label">If you had to choose one: dark, medium or light roasted coffee?</label>
                    <div class="flex gap-2">
                        {#each roastOptions as roast}
                            <button 
                                type="button" 
                                class={`chip ${roastPreference === roast ? 'preset-gradient' : 'preset-outlined-primary-500'}`} 
                                onclick={() => setRoastPreference(roast)}
                            >
                                <span>{roast}</span>
                            </button>
                        {/each}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label" for="reasons">Why do you drink coffee? (select all that apply)</label>
                    <div class="flex flex-col gap-2">
                        {#each reasonOptions as reason, i}
                            <label class="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={selectedReasons.includes(reason)} 
                                    onchange={() => toggleReason(reason)} 
                                    id={`reasons-${i}`}
                                />
                                <span>{reason}</span>
                            </label>
                        {/each}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="label" for="limit-reasons">Why don't you drink more coffee? (select all that apply)</label>
                    <div class="flex flex-col gap-2">
                        {#each limitReasonOptions as reason, i}
                            <label class="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={selectedLimitReasons.includes(reason)} 
                                    onchange={() => toggleLimitReason(reason)} 
                                    id={`limit-reasons-${i}`}
                                />
                                <span>{reason}</span>
                            </label>
                        {/each}
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <div class="relative">
                        <button 
                            type="button" 
                            class="btn preset-gradient" 
                            onclick={handleSubmit}
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
                    <button type="button" class="btn preset-outlined-primary-500" onclick={resetForm}>Reset</button>
                </div>
            </div>
            
            <div class="flex justify-start">
                <a href="/" class="btn variant-ghost-surface">Back to Home</a>
            </div>
        </form>
    {/if}
</div>
<div class="text-xs">
    {prefilledLink}
</div>
<style>
    /* Add any custom styles here if needed */
</style> 