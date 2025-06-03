<script>
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  
  // Props
  let { 
    isOpen = $bindable(),
    userSurveyStatus = {},
    onProceed = () => {},
    onCancel = () => {}
  } = $props();
  
  // Reactive state using Svelte 5 runes
  let showModal = $state(false);
  
  // Update modal visibility when isOpen changes
  $effect(() => {
    showModal = isOpen;
  });
  
  // Determine warning message based on user completion status
  const warningMessage = $derived(() => {
    const { hasPreferenceResponse, hasTasteTestResponse, canViewPersonalizedResults } = userSurveyStatus;
    
    if (canViewPersonalizedResults) {
      return {
        title: "View Your Results",
        message: "You're about to view your personalized coffee taste test results. This will show how your preferences compare to other participants.",
        severity: "info",
        showWarning: false
      };
    }
    
    if (!hasPreferenceResponse && !hasTasteTestResponse) {
      return {
        title: "Results Preview Warning",
        message: "You haven't completed either the preference survey or taste test yet. You can still view the aggregate results, but you won't see personalized comparisons. Consider completing the surveys first for the full experience!",
        severity: "warning",
        showWarning: true
      };
    }
    
    if (!hasPreferenceResponse) {
      return {
        title: "Partial Results Warning", 
        message: "You haven't completed the preference survey yet. You can view the taste test results, but you'll miss out on personalized brewing method and coffee preference comparisons.",
        severity: "warning",
        showWarning: true
      };
    }
    
    if (!hasTasteTestResponse) {
      return {
        title: "Partial Results Warning",
        message: "You haven't completed the taste test yet. You can view preference survey results, but you won't see your individual coffee ratings compared to others.",
        severity: "warning", 
        showWarning: true
      };
    }
    
    return {
      title: "View Results",
      message: "Ready to view your results!",
      severity: "success",
      showWarning: false
    };
  });
  
  function handleProceed() {
    showModal = false;
    isOpen = false;
    onProceed();
  }
  
  function handleCancel() {
    showModal = false;
    isOpen = false;
    onCancel();
  }
  
  function handleBackdropClick() {
    // Allow closing by clicking backdrop only if it's not a critical warning
    if (!warningMessage().showWarning) {
      handleCancel();
    }
  }
</script>

<Modal 
  open={showModal}
  onOpenChange={(e) => showModal = e.open}
  contentBase="card bg-surface-100-900 p-6 space-y-4 shadow-xl max-w-2xl"
  backdropClasses="backdrop-blur-sm"
>
  {#snippet content()}
    <header class="flex items-center space-x-3 mb-4">
      {#if warningMessage().severity === 'warning'}
        <svg class="w-8 h-8 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
      {:else if warningMessage().severity === 'info'}
        <svg class="w-8 h-8 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
      {:else}
        <svg class="w-8 h-8 text-success-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
      {/if}
      <h2 class="h2">{warningMessage().title}</h2>
    </header>

    <div class="space-y-4">
      <p class="text-lg leading-relaxed">
        {warningMessage().message}
      </p>
      
      {#if warningMessage().showWarning}
        <div class="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <svg class="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <div>
              <h4 class="font-semibold text-warning-800 dark:text-warning-200">
                You're about to "unblind" yourself
              </h4>
              <p class="text-sm text-warning-700 dark:text-warning-300 mt-1">
                Once you view the results, you'll know which coffees were rated highest and lowest. 
                This knowledge might influence your responses if you decide to take the surveys later.
              </p>
            </div>
          </div>
        </div>
        
        <div class="bg-surface-100-800-token rounded-lg p-4">
          <h4 class="font-semibold mb-2">Survey Status:</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-center space-x-2">
              {#if userSurveyStatus.hasPreferenceResponse}
                <svg class="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              {:else}
                <svg class="w-4 h-4 text-error-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              {/if}
              <span>Preference Survey: {userSurveyStatus.hasPreferenceResponse ? 'Complete' : 'Not completed'}</span>
            </div>
            <div class="flex items-center space-x-2">
              {#if userSurveyStatus.hasTasteTestResponse}
                <svg class="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              {:else}
                <svg class="w-4 h-4 text-error-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              {/if}
              <span>Taste Test: {userSurveyStatus.hasTasteTestResponse ? 'Complete' : 'Not completed'}</span>
            </div>
          </div>
        </div>
      {/if}
      
      {#if !warningMessage().showWarning && userSurveyStatus.canViewPersonalizedResults}
        <div class="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
          <div class="flex items-center space-x-3">
            <svg class="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <div>
              <h4 class="font-semibold text-success-800 dark:text-success-200">Great job!</h4>
              <p class="text-sm text-success-700 dark:text-success-300">
                You've completed both surveys and can view your full personalized results.
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <footer class="flex justify-end space-x-3 mt-6">
      <button 
        class="btn preset-tonal" 
        onclick={handleCancel}
      >
        {warningMessage().showWarning ? 'Take Surveys First' : 'Cancel'}
      </button>
      <button 
        class="btn preset-filled-primary" 
        onclick={handleProceed}
      >
        {warningMessage().showWarning ? 'View Results Anyway' : 'View Results'}
      </button>
    </footer>
  {/snippet}
</Modal>

<style>
  /* Additional custom styling if needed */
  :global(.modal-backdrop-blur) {
    backdrop-filter: blur(4px);
  }
</style> 