<script lang="ts">
  import { onMount } from 'svelte';
  
  // Props using Svelte 5 runes syntax
  const {
    // Props for direct data (from coffee-results page)
    preferenceData = [],
    tasteTestData = [],
    userId = null,
    // Props for transformed data (from main results page)
    transformedData = null,
    userSurveyStatus = null
  } = $props<{
    preferenceData?: any[];
    tasteTestData?: any[];
    userId?: string | null;
    transformedData?: any;
    userSurveyStatus?: any;
  }>();
  
  let brewingMethodStats: any = {};
  let userPreferences: any = null;
  let descriptiveStatements: string[] = [];
  
  // Check if we have transformed data or raw data
  const usingTransformedData = $derived(() => transformedData && userSurveyStatus);
  
  // Get brewing method data from either source
  const currentBrewingMethodData = $derived(() => {
    if (usingTransformedData() && transformedData?.brewingMethod) {
      return transformedData.brewingMethod;
    }
    return null;
  });
  
  // Get user ID from either source
  const currentUserId = $derived(() => {
    if (usingTransformedData() && userSurveyStatus?.userId) {
      return userSurveyStatus.userId;
    }
    return userId;
  });
  
  // Parse brewing methods from the Coffee Types field
  function parseBrewingMethods(coffeeTypesString: string): string[] {
    if (!coffeeTypesString) return [];
    
    // Split by comma and clean up each method
    return coffeeTypesString
      .split(',')
      .map(method => method.trim())
      .filter(method => method.length > 0);
  }
  
  // Generate brewing method statistics
  function calculateBrewingMethodStats() {
    const methodCounts: { [key: string]: number } = {};
    let totalResponses = 0;
    
    preferenceData.forEach((response: any) => {
      if (response.coffeeTypes || response['Coffee Types']) {
        const coffeeTypes = response.coffeeTypes || response['Coffee Types'];
        const methods = parseBrewingMethods(coffeeTypes);
        
        methods.forEach(method => {
          methodCounts[method] = (methodCounts[method] || 0) + 1;
        });
        
        totalResponses++;
      }
    });
    
    // Convert to percentages and sort by popularity
    const sortedMethods = Object.entries(methodCounts)
      .map(([method, count]) => ({
        method,
        count,
        percentage: Math.round((count / totalResponses) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
    brewingMethodStats = {
      totalResponses,
      methods: sortedMethods,
      methodCounts
    };
  }
  
  // Find user's brewing method preferences
  function findUserPreferences() {
    if (!currentUserId()) return;
    
    const userResponse = preferenceData.find((response: any) => 
      response.uuid === currentUserId() || response.UUID === currentUserId()
    );
    
    if (userResponse) {
      const coffeeTypes = userResponse.coffeeTypes || userResponse['Coffee Types'];
      const userMethods = parseBrewingMethods(coffeeTypes);
      
      userPreferences = {
        brewingMethods: userMethods,
        roastPreference: userResponse.roastPreference || userResponse['Roast Preference'],
        coffeesPerDay: userResponse.coffeesPerDay || userResponse['Coffees Per Day'],
        whyDrinkCoffee: userResponse.whyDrinkCoffee || userResponse['Why do you drink coffee?']
      };
    }
  }
  
  // Generate descriptive statements about brewing method preferences
  function generateDescriptiveStatements() {
    descriptiveStatements = [];
    
    if (!userPreferences || !userPreferences.brewingMethods.length) {
      descriptiveStatements.push("Complete the preference survey to see personalized brewing method comparisons!");
      return;
    }
    
    // Find the user's favorite brewing method (first one listed)
    const favoriteMethod = userPreferences.brewingMethods[0];
    const methodStats = brewingMethodStats.methods.find((m: any) => m.method === favoriteMethod);
    
    if (methodStats) {
      descriptiveStatements.push(
        `Your favorite brewing method is ${favoriteMethod}, which you share with ${methodStats.percentage}% of respondents (${methodStats.count} out of ${brewingMethodStats.totalResponses} people).`
      );
    }
    
    // Add information about all user's preferred methods
    if (userPreferences.brewingMethods.length > 1) {
      const allMethodsStats = userPreferences.brewingMethods.map((method: string) => {
        const stats = brewingMethodStats.methods.find((m: any) => m.method === method);
        return stats ? `${method} (${stats.percentage}%)` : method;
      });
      
      descriptiveStatements.push(
        `You enjoy multiple brewing methods: ${allMethodsStats.join(', ')}. This shows you appreciate variety in your coffee preparation!`
      );
    }
    
    // Add roast preference comparison if available
    if (userPreferences.roastPreference) {
      const roastCounts: { [key: string]: number } = {};
      let totalRoastResponses = 0;
      
      preferenceData.forEach((response: any) => {
        const roast = response.roastPreference || response['Roast Preference'];
        if (roast) {
          roastCounts[roast] = (roastCounts[roast] || 0) + 1;
          totalRoastResponses++;
        }
      });
      
      const userRoastCount = roastCounts[userPreferences.roastPreference] || 0;
      const userRoastPercentage = totalRoastResponses > 0 
        ? Math.round((userRoastCount / totalRoastResponses) * 100) 
        : 0;
      
      descriptiveStatements.push(
        `You prefer ${userPreferences.roastPreference} roast, which is shared by ${userRoastPercentage}% of respondents (${userRoastCount} out of ${totalRoastResponses} people).`
      );
    }
    
    // Add popular brewing method information
    const topMethod = brewingMethodStats.methods[0];
    if (topMethod && !userPreferences.brewingMethods.includes(topMethod.method)) {
      descriptiveStatements.push(
        `The most popular brewing method overall is ${topMethod.method} (${topMethod.percentage}% of respondents), which you haven't tried according to your preferences. Consider giving it a try!`
      );
    }
  }
  
  // Process all data when component mounts or data changes using $effect
  $effect(() => {
    // Debug logging
    console.log('PreferenceResults - Data check:', {
      usingTransformedData: usingTransformedData(),
      transformedData,
      userSurveyStatus,
      preferenceDataLength: preferenceData.length,
      currentUserId: currentUserId()
    });
    
    if (preferenceData.length > 0) {
      calculateBrewingMethodStats();
      findUserPreferences();
      generateDescriptiveStatements();
    } else if (usingTransformedData()) {
      // Handle case where we have transformed data but need to generate content
      generateTransformedDataStatements();
    }
  });
  
  // Generate statements from transformed data
  function generateTransformedDataStatements() {
    descriptiveStatements = [];
    
    if (!userSurveyStatus?.hasPreferenceResponse) {
      descriptiveStatements.push("Complete the preference survey to see personalized brewing method comparisons!");
      return;
    }
    
    // If we have transformed brewing method data, use it
    if (currentBrewingMethodData()) {
      const brewingData = currentBrewingMethodData();
      descriptiveStatements.push(
        `Based on ${brewingData.totalResponses || 'survey'} responses, we can show you brewing method preferences.`
      );
      
      if (brewingData.userPercentile !== null) {
        descriptiveStatements.push(
          `Your brewing preferences put you in the ${brewingData.userPercentile}th percentile of coffee enthusiasts.`
        );
      }
    } else {
      descriptiveStatements.push(
        "Brewing method analysis is being prepared. Check back soon for detailed insights!"
      );
    }
  }
</script>

<div class="preference-results">
  <h3 class="h3 mb-4">Your Brewing Method Preferences</h3>
  
  {#if descriptiveStatements.length > 0}
    <div class="card p-4 mb-6">
      <h4 class="h4 mb-3">Personalized Insights</h4>
      {#each descriptiveStatements as statement}
        <p class="mb-2 text-surface-600-300-token">{statement}</p>
      {/each}
    </div>
  {/if}
  
  {#if brewingMethodStats.methods && brewingMethodStats.methods.length > 0}
    <div class="card p-4">
      <h4 class="h4 mb-3">Brewing Method Popularity</h4>
      <div class="space-y-2">
        {#each brewingMethodStats.methods as methodStat}
          <div class="flex justify-between items-center p-2 bg-surface-100-800-token rounded">
            <span class="font-medium">{methodStat.method}</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-surface-600-300-token">
                {methodStat.count} people ({methodStat.percentage}%)
              </span>
              <div class="w-16 h-2 bg-surface-300-600-token rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary-500 transition-all duration-300"
                  style="width: {methodStat.percentage}%"
                ></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
      <p class="text-sm text-surface-600-300-token mt-3">
        Based on {brewingMethodStats.totalResponses} survey responses
      </p>
    </div>
  {:else if usingTransformedData() && currentBrewingMethodData()}
    <!-- Show transformed data if available -->
    <div class="card p-4">
      <h4 class="h4 mb-3">Community Brewing Preferences</h4>
      <p class="text-surface-600-300-token">
        Analysis based on {currentBrewingMethodData().totalResponses || 'community'} survey responses.
      </p>
      {#if !userSurveyStatus?.hasPreferenceResponse}
        <div class="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
          <p class="text-sm text-warning-700 dark:text-warning-300">
            <a href="/preference-survey" class="btn btn-sm preset-filled-warning-500 mr-2">
              📝 Take Preference Survey
            </a>
            to see your personalized brewing method comparisons!
          </p>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Fallback when no data is available -->
    <div class="card p-4">
      <h4 class="h4 mb-3">Brewing Method Analysis</h4>
      <p class="text-surface-600-300-token mb-4">
        We're analyzing community brewing preferences. This data will be available once we have sufficient survey responses.
      </p>
      <div class="text-center">
        <a href="/preference-survey" class="btn preset-filled-primary-500">
          📝 Take Preference Survey
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  .preference-results {
    max-width: 100%;
  }
</style> 