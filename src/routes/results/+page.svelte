<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import UnblindingWarning from '$lib/components/UnblindingWarning.svelte';
  import PreferenceResults from '$lib/components/PreferenceResults.svelte';
  import CoffeeCard from '$lib/components/CoffeeCard.svelte';
  import CoffeeQualityPlot from '$lib/components/CoffeeQualityPlot.svelte';
  import UserPersonalityInsights from '$lib/components/UserPersonalityInsights.svelte';
  import UserCoffeePreferencesDisplay from '$lib/components/UserCoffeePreferencesDisplay.svelte';
  import { 
    fetchAllSurveyData, 
    getUserSurveyStatus, 
    getPersonalizedSurveyData,
    transformAllDataForVisualization,
    fetchCoffeeData,
    fetchCoffeeQualityData,
    fetchParticipantHarshnessData,
    calculateCoffeeTasteStats,
    getUserCoffeePreferences,
    type CoffeeData,
    type CoffeeTasteStats,
    type UserCoffeePreferences,
    type CoffeeQualityData,
    type ParticipantHarshnessData
  } from '$lib/services/dataService';
  
  // State management using Svelte 5 runes
  let isLoading = $state(true);
  let loadingProgress = $state(0);
  let loadingMessage = $state('Initializing...');
  let error = $state<string | null>(null);
  let errorType = $state<'network' | 'data' | 'server' | 'unknown' | null>(null);
  let isOffline = $state(false);
  let retryCount = $state(0);
  let surveyData = $state<any>(null);
  let personalizedData = $state<any>(null);
  let transformedData = $state<any>(null);
  let userSurveyStatus = $state<any>({});
  
  // Coffee-related state
  let coffeeData = $state<CoffeeData[]>([]);
  let coffeeTasteStats = $state<CoffeeTasteStats[]>([]);
  let userCoffeePreferences = $state<UserCoffeePreferences | null>(null);
  let coffeeQualityData = $state<CoffeeQualityData[]>([]);
  let participantHarshnessData = $state<ParticipantHarshnessData[]>([]);
  
  // Warning modal state
  let showWarningModal = $state(false);
  let userHasSeenWarning = $state(false);
  
  // Results display state
  let showResults = $state(false);
  let activeTab = $state('overview');
  
  // Tab configuration - removed 'preferences' and 'taste-test' tabs
  const resultTabs = [
    { label: 'Overview', value: 'overview', icon: '📊' },
    { label: 'Coffee Details', value: 'coffee-details', icon: '📋' },
    { label: 'Personality', value: 'personality', icon: '🎭' }
  ];
  
  // Error type detection and messaging
  function getErrorDetails(err: any) {
    if (!navigator.onLine) {
      return {
        type: 'network' as const,
        title: 'No Internet Connection',
        message: 'Please check your internet connection and try again.',
        icon: '📡',
        canRetry: true,
        showOfflineHelp: true
      };
    }
    
    if (err.message?.includes('fetch')) {
      return {
        type: 'network' as const,
        title: 'Connection Failed',
        message: 'Unable to connect to our servers. This might be a temporary issue.',
        icon: '🔌',
        canRetry: true,
        showOfflineHelp: false
      };
    }
    
    if (err.message?.includes('CSV') || err.message?.includes('parse')) {
      return {
        type: 'data' as const,
        title: 'Data Format Error',
        message: 'The survey data appears to be corrupted or in an unexpected format.',
        icon: '📄',
        canRetry: true,
        showOfflineHelp: false
      };
    }
    
    if (err.status >= 500) {
      return {
        type: 'server' as const,
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Please try again in a few moments.',
        icon: '🖥️',
        canRetry: true,
        showOfflineHelp: false
      };
    }
    
    return {
      type: 'unknown' as const,
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred while loading your results.',
      icon: '⚠️',
      canRetry: true,
      showOfflineHelp: false
    };
  }
  
  // Load data with enhanced error handling
  async function loadData() {
    try {
      isLoading = true;
      error = null;
      errorType = null;
      loadingProgress = 0;
      
      // Check online status
      isOffline = !navigator.onLine;
      if (isOffline) {
        throw new Error('No internet connection');
      }
      
      // Step 1: Fetch survey data
      loadingMessage = 'Fetching survey data...';
      loadingProgress = 20;
      surveyData = await fetchAllSurveyData();
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for UX
      
      // Step 2: Check user status
      loadingMessage = 'Checking your survey status...';
      loadingProgress = 35;
      userSurveyStatus = getUserSurveyStatus(surveyData);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 3: Get personalized data
      loadingMessage = 'Preparing personalized insights...';
      loadingProgress = 50;
      personalizedData = getPersonalizedSurveyData(surveyData);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 4: Fetch coffee data
      loadingMessage = 'Loading coffee information...';
      loadingProgress = 65;
      coffeeData = await fetchCoffeeData();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 5: Calculate taste statistics
      loadingMessage = 'Calculating taste statistics...';
      loadingProgress = 80;
      coffeeTasteStats = calculateCoffeeTasteStats(surveyData.tasteTestData);
      userCoffeePreferences = getUserCoffeePreferences(surveyData.tasteTestData);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 6: Fetch coffee quality data
      loadingMessage = 'Loading coffee quality data...';
      loadingProgress = 90;
      coffeeQualityData = await fetchCoffeeQualityData();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 7: Fetch participant harshness data
      loadingMessage = 'Loading participant harshness data...';
      loadingProgress = 95;
      participantHarshnessData = await fetchParticipantHarshnessData();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 8: Transform data for visualization
      loadingMessage = 'Generating visualizations...';
      loadingProgress = 95;
      transformedData = transformAllDataForVisualization(surveyData, personalizedData);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      loadingMessage = 'Complete!';
      loadingProgress = 100;
      retryCount = 0; // Reset retry count on success
      
      console.log('User survey status:', userSurveyStatus);
      
    } catch (err) {
      console.error('Error loading survey data:', err);
      
      const errorDetails = getErrorDetails(err);
      error = errorDetails.message;
      errorType = errorDetails.type;
      retryCount += 1;
      
      // Log detailed error for debugging
      console.error('Error details:', {
        type: errorDetails.type,
        retryCount,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        error: err
      });
      
    } finally {
      setTimeout(() => {
        isLoading = false;
      }, 300);
    }
  }
  
  // Enhanced retry with exponential backoff
  async function retryLoad() {
    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // Max 10 seconds
    
    if (delay > 1000) {
      loadingMessage = `Retrying in ${Math.ceil(delay / 1000)} seconds...`;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    await loadData();
  }
  
  // Force refresh data (clear any cached data)
  async function forceRefresh() {
    // Clear any potential cached data
    surveyData = null;
    personalizedData = null;
    transformedData = null;
    userSurveyStatus = {};
    coffeeData = [];
    coffeeTasteStats = [];
    userCoffeePreferences = null;
    coffeeQualityData = [];
    participantHarshnessData = [];
    retryCount = 0;
    
    // Clear session storage
    if (browser) {
      sessionStorage.removeItem('results-warning-seen');
      // Clear any other cached data if applicable
    }
    
    await loadData();
  }
  
  // Offline detection
  function handleOnline() {
    isOffline = false;
    if (error && errorType === 'network') {
      loadData();
    }
  }
  
  function handleOffline() {
    isOffline = true;
  }
  
  // Check if user should see warning before results
  const shouldShowWarning = $derived(() => {
    if (!userSurveyStatus || userHasSeenWarning) return false;
    
    // Always show warning if user hasn't completed both surveys
    // This implements the "unblinding" warning concept
    return !userSurveyStatus.canViewPersonalizedResults;
  });
  
  // Handle when user proceeds from warning
  function handleWarningProceed() {
    userHasSeenWarning = true;
    showWarningModal = false;
    showResults = true;
    
    // Save that user has seen warning in this session
    if (browser) {
      sessionStorage.setItem('results-warning-seen', 'true');
    }
  }
  
  // Handle when user cancels from warning
  function handleWarningCancel() {
    showWarningModal = false;
    // Redirect back to home or surveys
    if (browser) {
      window.location.href = '/';
    }
  }
  
  // Check if warning was already seen in this session
  function checkWarningStatus() {
    if (browser) {
      const seenWarning = sessionStorage.getItem('results-warning-seen');
      if (seenWarning === 'true') {
        userHasSeenWarning = true;
        showResults = true;
      }
    }
  }
  
  // Effect to show warning modal when data loads and user needs warning
  $effect(() => {
    if (!isLoading && surveyData && shouldShowWarning() && !userHasSeenWarning) {
      showWarningModal = true;
    } else if (!isLoading && surveyData && !shouldShowWarning()) {
      // User completed both surveys, can view results directly
      showResults = true;
    }
  });
  
  // Tab navigation functions
  function setActiveTab(value: string) {
    activeTab = value;
  }
  
  onMount(() => {
    checkWarningStatus();
    loadData();
    
    // Add online/offline event listeners
    if (browser) {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Cleanup on component destroy
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  });
</script>

<svelte:head>
  <title>Coffee Survey Results</title>
  <meta name="description" content="View your personalized coffee taste test and preference survey results" />
</svelte:head>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
  <!-- Breadcrumb Navigation -->
  <nav class="mb-6 text-sm">
    <ol class="flex items-center space-x-2 text-surface-600-300-token overflow-x-auto">
      <li><a href="/" class="hover:text-primary-500 transition-colors whitespace-nowrap">Home</a></li>
      <li><span class="mx-2">/</span></li>
      <li class="text-surface-900-50-token font-medium whitespace-nowrap">Results</li>
    </ol>
  </nav>
  
  <!-- Page Header -->
  <header class="mb-8 text-center px-4">
    <h1 class="h1 mb-3 text-2xl sm:text-3xl lg:text-4xl">Coffee Survey Results</h1>
    <p class="text-lg sm:text-xl opacity-75 max-w-2xl mx-auto leading-relaxed">
      Discover how your coffee preferences compare to other participants and explore detailed insights from our community
    </p>
  </header>
  
  {#if isLoading}
    <!-- Enhanced Loading State -->
    <div class="card p-6 sm:p-8 max-w-sm sm:max-w-md mx-auto">
      <div class="flex flex-col items-center space-y-6">
        <!-- Coffee cup loading animation -->
        <div class="relative">
          <div class="w-12 h-12 sm:w-16 sm:h-16 border-4 border-surface-300 border-t-primary-500 rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-xl sm:text-2xl">☕</span>
          </div>
        </div>
        
        <!-- Progress information -->
        <div class="w-full space-y-3">
          <div class="text-center">
            <h3 class="h4 mb-2 text-base sm:text-lg">{loadingMessage}</h3>
            <!-- Custom progress bar -->
            <div class="w-full bg-surface-200-700-token rounded-full h-2 sm:h-3 mb-2">
              <div 
                class="bg-primary-500 h-2 sm:h-3 rounded-full transition-all duration-300 ease-out"
                style="width: {loadingProgress}%"
              ></div>
            </div>
            <p class="text-xs sm:text-sm opacity-60 mt-2">{loadingProgress}% complete</p>
          </div>
        </div>
        
        <!-- Loading tips -->
        <div class="text-center text-xs sm:text-sm opacity-60 max-w-xs px-4">
          <p>We're analyzing survey responses and preparing your personalized insights...</p>
        </div>
      </div>
    </div>
    
  {:else if error}
    <!-- Enhanced Error State -->
    <div class="max-w-lg mx-auto px-4">
      <!-- Offline Status Banner -->
      {#if isOffline}
        <div class="card preset-filled-warning-500 p-3 sm:p-4 mb-4">
          <div class="flex items-center gap-2 sm:gap-3">
            <span class="text-xl sm:text-2xl flex-shrink-0">📡</span>
            <div class="min-w-0">
              <h3 class="font-semibold text-sm sm:text-base">You're Offline</h3>
              <p class="text-xs sm:text-sm opacity-90">Check your internet connection to load results.</p>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Main Error Display -->
      <div class="card p-4 sm:p-6 border-2 border-error-500">
        <div class="text-center space-y-4">
          <!-- Error Icon and Type -->
          <div class="space-y-2">
            <div class="text-4xl sm:text-6xl">
              {#if errorType === 'network'}🔌
              {:else if errorType === 'data'}📄
              {:else if errorType === 'server'}🖥️
              {:else}⚠️{/if}
            </div>
            <h2 class="h4 sm:h3 text-error-600 dark:text-error-400">
              {#if errorType === 'network'}Connection Problem
              {:else if errorType === 'data'}Data Error
              {:else if errorType === 'server'}Server Issue
              {:else}Unexpected Error{/if}
            </h2>
          </div>
          
          <!-- Error Message -->
          <div class="space-y-2">
            <p class="text-base sm:text-lg px-4">{error}</p>
            
            <!-- Additional context based on error type -->
            {#if errorType === 'network'}
              <div class="text-xs sm:text-sm opacity-75 space-y-1 px-4">
                <p>This could be due to:</p>
                <ul class="list-disc list-inside text-left max-w-xs mx-auto space-y-1">
                  <li>Slow or unstable internet connection</li>
                  <li>Firewall or proxy settings</li>
                  <li>Temporary server maintenance</li>
                </ul>
              </div>
            {:else if errorType === 'data'}
              <div class="text-xs sm:text-sm opacity-75 px-4">
                <p>The survey data may have been updated recently. A refresh might help.</p>
              </div>
            {:else if errorType === 'server'}
              <div class="text-xs sm:text-sm opacity-75 px-4">
                <p>Our team has been notified. The issue should resolve automatically.</p>
              </div>
            {/if}
          </div>
          
          <!-- Retry Information -->
          {#if retryCount > 1}
            <div class="p-3 bg-surface-100-800-token rounded-lg mx-4">
              <p class="text-xs sm:text-sm">
                <span class="font-medium">Attempt {retryCount}</span>
                {#if retryCount >= 3}
                  <span class="text-warning-600 dark:text-warning-400">
                    - Multiple attempts failed
                  </span>
                {/if}
              </p>
            </div>
          {/if}
          
          <!-- Action Buttons -->
          <div class="flex flex-col gap-3 justify-center px-4">
            <!-- Primary retry button -->
            <button 
              class="btn preset-filled-primary-500 flex items-center justify-center gap-2 w-full sm:w-auto" 
              onclick={retryLoad}
              disabled={isLoading}
            >
              <span>🔄</span>
              <span>
                {#if retryCount <= 1}Try Again
                {:else if retryCount <= 3}Retry ({retryCount})
                {:else}Keep Trying{/if}
              </span>
            </button>
            
            <!-- Secondary actions -->
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <!-- Force refresh for data errors -->
              {#if errorType === 'data' || retryCount >= 3}
                <button 
                  class="btn preset-tonal-secondary-500 flex items-center justify-center gap-2 flex-1" 
                  onclick={forceRefresh}
                  disabled={isLoading}
                >
                  <span>🔄</span>
                  <span>Force Refresh</span>
                </button>
              {/if}
              
              <!-- Navigation alternatives -->
              <a href="/" class="btn preset-tonal flex items-center justify-center gap-2 flex-1">
                <span>🏠</span>
                <span>Back to Home</span>
              </a>
            </div>
          </div>
          
          <!-- Alternative Actions -->
          <div class="pt-4 border-t border-surface-300-600-token mx-4">
            <h4 class="font-medium mb-3 text-sm sm:text-base">Meanwhile, you can:</h4>
            <div class="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
              {#if errorType !== 'network'}
                <a href="/preference-survey" class="btn btn-sm preset-ghost flex-1">
                  📝 Take Preference Survey
                </a>
                <a href="/taste-test" class="btn btn-sm preset-ghost flex-1">
                  ☕ Take Taste Test
                </a>
              {/if}
              <button 
                class="btn btn-sm preset-ghost flex-1"
                onclick={() => {
                  if (browser) {
                    navigator.clipboard?.writeText(window.location.href);
                    // Could show a toast notification here
                  }
                }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
          
          <!-- Technical Details (collapsed by default) -->
          <details class="text-left mx-4">
            <summary class="cursor-pointer text-xs sm:text-sm opacity-60 hover:opacity-80 text-center">
              Technical Details
            </summary>
            <div class="mt-2 p-3 bg-surface-100-800-token rounded text-xs space-y-1 overflow-hidden">
              <div><strong>Error Type:</strong> {errorType || 'unknown'}</div>
              <div><strong>Retry Count:</strong> {retryCount}</div>
              <div><strong>Online Status:</strong> {navigator?.onLine ? 'Online' : 'Offline'}</div>
              <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
              <div class="break-all"><strong>User Agent:</strong> {navigator?.userAgent?.slice(0, 50)}...</div>
            </div>
          </details>
        </div>
      </div>
      
      <!-- Helpful Tips Card -->
      <div class="card p-4 mt-4 bg-surface-50-900-token">
        <h4 class="font-medium mb-2 text-sm sm:text-base">💡 Troubleshooting Tips</h4>
        <div class="text-xs sm:text-sm space-y-1 opacity-75">
          {#if errorType === 'network'}
            <p>• Check your internet connection</p>
            <p>• Try refreshing the page</p>
            <p>• Disable VPN or proxy temporarily</p>
            <p>• Try again in a few minutes</p>
          {:else if errorType === 'data'}
            <p>• The data format may have changed</p>
            <p>• Try force refreshing the page</p>
            <p>• Clear your browser cache</p>
          {:else if errorType === 'server'}
            <p>• This is likely temporary</p>
            <p>• No action needed on your part</p>
            <p>• Try again in a few minutes</p>
          {:else}
            <p>• Try refreshing the page</p>
            <p>• Check your internet connection</p>
            <p>• Try again later</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  
  {#if showResults && surveyData && transformedData}
    <!-- Results Content with Navigation -->
    <div class="space-y-6">
      
      <!-- User Status Card -->
      {#if userSurveyStatus?.hasUserId}
        <div class="card p-4 sm:p-6 preset-outlined-primary-500">
          <div class="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
            <h2 class="h4 text-lg sm:text-xl">Your Survey Progress</h2>
            <div class="badge preset-filled-{userSurveyStatus.canViewPersonalizedResults ? 'success' : 'warning'}-500 self-start">
              {userSurveyStatus.canViewPersonalizedResults ? '✓ Complete' : '⚠ Incomplete'}
            </div>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div class="flex items-center space-x-3 sm:space-x-4">
              <div class="flex-shrink-0">
                {#if userSurveyStatus.hasPreferenceResponse}
                  <div class="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                {:else}
                  <div class="w-8 h-8 bg-surface-300-600-token rounded-full flex items-center justify-center text-sm">1</div>
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm sm:text-base">Preference Survey</h3>
                <p class="text-xs sm:text-sm opacity-75">
                  {userSurveyStatus.hasPreferenceResponse ? 'Completed' : 'Not started'}
                </p>
              </div>
            </div>
            
            <div class="flex items-center space-x-3 sm:space-x-4">
              <div class="flex-shrink-0">
                {#if userSurveyStatus.hasTasteTestResponse}
                  <div class="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                {:else}
                  <div class="w-8 h-8 bg-surface-300-600-token rounded-full flex items-center justify-center text-sm">2</div>
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm sm:text-base">Taste Test</h3>
                <p class="text-xs sm:text-sm opacity-75">
                  {userSurveyStatus.hasTasteTestResponse ? 'Completed' : 'Not started'}
                </p>
              </div>
            </div>
          </div>
          
          {#if !userSurveyStatus.canViewPersonalizedResults}
            <div class="mt-6 p-3 sm:p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
              <h4 class="font-semibold text-warning-800 dark:text-warning-200 mb-2 text-sm sm:text-base">
                🔓 Unlock Personalized Insights
              </h4>
              <p class="text-sm text-warning-700 dark:text-warning-300 mb-3 leading-relaxed">
                Complete both surveys to see how your preferences compare to other participants and get detailed insights!
              </p>
              <div class="flex flex-col sm:flex-row flex-wrap gap-2">
                {#if !userSurveyStatus.hasPreferenceResponse}
                  <a href="/preference-survey" class="btn btn-sm preset-filled-warning-500 flex-1">
                    📝 Take Preference Survey
                  </a>
                {/if}
                {#if !userSurveyStatus.hasTasteTestResponse}
                  <a href="/taste-test" class="btn btn-sm preset-filled-warning-500 flex-1">
                    ☕ Take Taste Test
                  </a>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Results Navigation Tabs -->
      <div class="card">
        <!-- Custom Tab Navigation -->
        <div class="border-b border-surface-300-600-token overflow-hidden">
          <nav class="flex overflow-x-auto scrollbar-hide">
            {#each resultTabs as tab}
              <button
                class="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0
                       {activeTab === tab.value 
                         ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                         : 'border-transparent text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 hover:border-surface-300 dark:hover:border-surface-600'
                       }"
                onclick={() => setActiveTab(tab.value)}
              >
                <span class="text-sm sm:text-base">{tab.icon}</span>
                <span class="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            {/each}
          </nav>
        </div>
        
        <!-- Tab Content -->
        <div class="p-4 sm:p-6">
          {#if activeTab === 'overview'}
            <!-- Overview Tab -->
            <div class="space-y-6">
              <div class="text-center">
                <h3 class="h3 mb-4 text-xl sm:text-2xl">Survey Overview</h3>
                <p class="text-base sm:text-lg opacity-75 mb-6 leading-relaxed max-w-3xl mx-auto">
                  {#if userSurveyStatus.canViewPersonalizedResults}
                    Here's a summary of your personalized coffee survey results with comparisons to our community.
                  {:else}
                    Here's an overview of our community's coffee preferences. Complete both surveys for personalized insights!
                  {/if}
                </p>
              </div>
              
              {#if transformedData}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div class="card preset-filled-surface-500 p-4 text-center">
                    <div class="text-xl sm:text-2xl font-bold text-primary-500 mb-1">
                      {transformedData.metadata.totalPreferenceResponses}
                    </div>
                    <div class="text-xs sm:text-sm opacity-75">Preference Responses</div>
                  </div>
                  <div class="card preset-filled-surface-500 p-4 text-center">
                    <div class="text-xl sm:text-2xl font-bold text-secondary-500 mb-1">
                      {transformedData.metadata.totalTasteTestResponses}
                    </div>
                    <div class="text-xs sm:text-sm opacity-75">Taste Test Responses</div>
                  </div>
                  <div class="card preset-filled-surface-500 p-4 text-center sm:col-span-2 lg:col-span-1">
                    <div class="text-xl sm:text-2xl font-bold text-tertiary-500 mb-1">
                      {transformedData.metadata.uniqueCoffeesCount}
                    </div>
                    <div class="text-xs sm:text-sm opacity-75">Unique Coffees</div>
                  </div>
                </div>
              {/if}
            </div>
            
          {:else if activeTab === 'coffee-details'}
            <!-- Coffee Details Tab -->
            <div class="space-y-6">
              <div class="text-center">
                <h3 class="h3 mb-4 text-xl sm:text-2xl">Coffee Details</h3>
                <p class="text-base sm:text-lg opacity-75 mb-6 leading-relaxed max-w-3xl mx-auto">
                  {#if userCoffeePreferences?.userId}
                    Your personal favorites are highlighted!
                  {/if}
                </p>
              </div>
                              <!-- Coffee Quality Plot -->
              {#if coffeeQualityData.length > 0}
                <div class="card p-6 mt-8">
                  <h4 class="h4 mb-4 text-center">Coffee Quality Plot</h4>
                  <CoffeeQualityPlot qualityData={coffeeQualityData} />
                </div>
              {/if}
              {#if coffeeData.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {#each coffeeData as coffee (coffee.coffee_id)}
                    {@const tasteStats = coffeeTasteStats.find(stats => stats.coffee_id === coffee.coffee_id)}
                    <CoffeeCard 
                      {coffee} 
                      {tasteStats} 
                      userPreferences={userCoffeePreferences}
                    />
                  {/each}
                </div>
                

                
                <!-- Summary Statistics -->
                {#if coffeeTasteStats.length > 0}
                  <div class="card p-6 mt-8">
                    <h4 class="h4 mb-4 text-center">Coffee Ratings Summary</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div class="space-y-2">
                        <div class="text-2xl font-bold text-primary-500">
                          {coffeeData.length}
                        </div>
                        <div class="text-sm opacity-75">Total Coffees</div>
                      </div>
                      <div class="space-y-2">
                        <div class="text-2xl font-bold text-secondary-500">
                          {coffeeTasteStats.reduce((sum, stats) => sum + stats.totalRatings, 0)}
                        </div>
                        <div class="text-sm opacity-75">Total Ratings</div>
                      </div>
                      <div class="space-y-2">
                        <div class="text-2xl font-bold text-tertiary-500">
                          {userCoffeePreferences?.favoriteCoffees.length || 0}
                        </div>
                        <div class="text-sm opacity-75">Your Favorites</div>
                      </div>
                      <div class="space-y-2">
                        <div class="text-2xl font-bold text-warning-500">
                          {(coffeeTasteStats.reduce((sum, stats) => sum + stats.averageOverallEnjoyment, 0) / coffeeTasteStats.length).toFixed(1)}
                        </div>
                        <div class="text-sm opacity-75">Avg. Rating</div>
                      </div>
                    </div>
                  </div>
                {/if}
              {:else}
                <div class="text-center py-8 sm:py-12 px-4">
                  <div class="text-4xl sm:text-6xl mb-4">☕</div>
                  <h4 class="h4 mb-2 text-lg sm:text-xl">Loading Coffee Information</h4>
                  <p class="opacity-75 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                    We're fetching detailed information about each coffee in our taste test.
                  </p>
                </div>
              {/if}
            </div>
            
          {:else if activeTab === 'personality'}
            <!-- User Coffee Preferences -->
            <div class="mt-8">
              <UserCoffeePreferencesDisplay 
                {coffeeData}
                userPreferences={userCoffeePreferences}
                loading={isLoading}
              />
            </div>
            <!-- Personality Tab -->
            <UserPersonalityInsights 
              harshnessData={participantHarshnessData}
              userId={userSurveyStatus.userId}
              loading={isLoading}
              error={error}
            />
            

            
          {:else}
            <!-- Fallback for any unhandled tab values -->
            <div class="text-center py-8 sm:py-12 px-4">
              <div class="text-4xl sm:text-6xl mb-4">🚧</div>
              <h3 class="h4 mb-2 text-lg sm:text-xl">
                Coming Soon
              </h3>
              <p class="opacity-75 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                This section is under development and will be available soon.
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Warning Modal -->
<UnblindingWarning 
  bind:isOpen={showWarningModal}
  {userSurveyStatus}
  onProceed={handleWarningProceed}
  onCancel={handleWarningCancel}
/>

<style>
  /* Enhanced loading animation */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  /* Smooth transitions */
  .card {
    transition: all 0.2s ease-in-out;
  }
  
  .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  /* Custom scrollbar for tab navigation */
  nav::-webkit-scrollbar {
    height: 2px;
  }
  
  nav::-webkit-scrollbar-track {
    background: transparent;
  }
  
  nav::-webkit-scrollbar-thumb {
    background: rgba(var(--color-surface-300), 0.5);
    border-radius: 1px;
  }
  
  /* Hide scrollbar utility class */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
  }
  
  /* Enhanced touch targets for mobile */
  @media (max-width: 640px) {
    button, a.btn {
      min-height: 44px; /* iOS touch target minimum */
      min-width: 44px;
    }
    
    /* Better mobile text selection */
    p, li {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
    
    /* Prevent zoom on form focus for iOS */
    input, select, textarea {
      font-size: 16px;
    }
  }
  
  /* Custom breakpoint for very small screens */
  @media (min-width: 480px) {
    .xs\:inline {
      display: inline;
    }
  }
  
  /* Enhanced focus styles for accessibility */
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid rgb(var(--color-primary-500));
    outline-offset: 2px;
  }
  
  /* Improved hover states for touch devices */
  @media (hover: hover) {
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
  }
  
  /* Ensure proper stacking context for mobile menu */
  header {
    position: relative;
    z-index: 50;
  }
  
  /* Better spacing for mobile cards */
  @media (max-width: 640px) {
    .card {
      margin-left: -0.5rem;
      margin-right: -0.5rem;
      border-radius: 0.75rem 0.75rem 0 0;
    }
    
    .card:first-child {
      border-radius: 0.75rem;
    }
  }
  
  /* Responsive grid improvements */
  @media (max-width: 1024px) {
    .grid {
      gap: 1rem;
    }
  }
  
  @media (max-width: 640px) {
    .grid {
      gap: 0.75rem;
    }
  }
  
  /* Dark mode adjustments for mobile */
  @media (prefers-color-scheme: dark) {
    .card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    @media (hover: hover) {
      .card:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      }
    }
  }
</style> 