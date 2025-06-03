<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import type { CoffeeData, UserCoffeePreferences } from '$lib/services/dataService';
  
  // Local interface for taste test response since it's not exported
  interface TasteTestResponse {
    uuid: string;
    whichCoffee: string;
    overallEnjoyment: number;
    [key: string]: any;
  }
  
  interface Props {
    coffeeData: CoffeeData[];
    userPreferences: UserCoffeePreferences | null;
    tasteTestData: TasteTestResponse[];
    loading?: boolean;
  }
  
  let { coffeeData, userPreferences, tasteTestData, loading = false }: Props = $props();
  
  let chartContainer: HTMLDivElement;
  let chart: echarts.ECharts | null = null;
  
  // Calculate each participant's favorite coffee(s) and their brewing methods
  const participantPreferredBrewingMethods = $derived(() => {
    if (!tasteTestData || tasteTestData.length === 0 || !coffeeData) return [];
    
    // Group taste test responses by participant
    const participantResponses: Record<string, TasteTestResponse[]> = {};
    tasteTestData.forEach(response => {
      if (!participantResponses[response.uuid]) {
        participantResponses[response.uuid] = [];
      }
      participantResponses[response.uuid].push(response);
    });
    
    // For each participant, find their favorite coffee(s) and get brewing methods
    const preferredMethods: string[] = [];
    
    Object.entries(participantResponses).forEach(([uuid, responses]) => {
      if (responses.length === 0) return;
      
      // Find the highest rating for this participant
      const maxRating = Math.max(...responses.map(r => r.overallEnjoyment));
      
      // Find all coffees with the highest rating (handles ties)
      const favoriteCoffees = responses
        .filter(r => r.overallEnjoyment === maxRating)
        .map(r => r.whichCoffee);
      
      // Get brewing methods for these favorite coffees
      favoriteCoffees.forEach(coffeeId => {
        const coffee = coffeeData.find(c => c.coffee_id === coffeeId);
        if (coffee?.brew_method?.trim()) {
          preferredMethods.push(coffee.brew_method.trim());
        }
      });
    });
    
    return preferredMethods;
  });
  
  // Calculate brewing method distribution from participant preferences
  const brewingDistribution = $derived(() => {
    const methods = participantPreferredBrewingMethods();
    const distribution: Record<string, number> = {};
    
    methods.forEach(method => {
      distribution[method] = (distribution[method] || 0) + 1;
    });
    
    return distribution;
  });
  
  // Get user's favorite coffee brewing methods
  const userFavoriteBrewMethods = $derived(() => {
    if (!userPreferences?.favoriteCoffees || !coffeeData) return [];
    
    const methods = userPreferences.favoriteCoffees.map(coffeeId => {
      const coffee = coffeeData.find(c => c.coffee_id === coffeeId);
      return coffee?.brew_method?.trim();
    }).filter(method => method);
    
    return [...new Set(methods)]; // Remove duplicates
  });
  
  // Prepare chart data
  const chartData = $derived(() => {
    const distribution = brewingDistribution();
    const entries = Object.entries(distribution);
    
    if (entries.length === 0) return { categories: [], data: [], total: 0 };
    
    const sortedEntries = entries.sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [_, count]) => sum + count, 0);
    
    return {
      categories: sortedEntries.map(([method]) => method),
      data: sortedEntries.map(([method, count]) => ({
        name: method,
        value: count,
        percentage: ((count / total) * 100).toFixed(1),
        isUserFavorite: userFavoriteBrewMethods().includes(method)
      })),
      total
    };
  });
  
  // Initialize chart
  function initChart() {
    if (!chartContainer || !chartData()) return;
    
    if (chart) {
      chart.dispose();
    }
    
    chart = echarts.init(chartContainer);
    updateChart();
  }
  
  // Update chart with current data
  function updateChart() {
    if (!chart || !chartData()) return;
    
    const { data } = chartData();
    
    const option = {
      title: {
        text: 'Preferred Brewing Methods',
        subtext: 'Based on participants\' favorite coffees',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold' as const
        },
        subtextStyle: {
          fontSize: 12,
          color: '#666'
        }
      },
      tooltip: {
        trigger: 'item' as const,
        formatter: function(params: any) {
          const isUserFav = params.data.isUserFavorite;
          const favIcon = isUserFav ? '⭐ ' : '';
          return `${favIcon}<strong>${params.name}</strong><br/>
                  Participant Preferences: ${params.value}<br/>
                  Percentage: ${params.data.percentage}%${isUserFav ? '<br/><em>You also prefer this method!</em>' : ''}`;
        }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '60%'],
        data: data.map(item => ({
          name: item.name,
          value: item.value,
          percentage: item.percentage,
          isUserFavorite: item.isUserFavorite,
          itemStyle: {
            color: item.isUserFavorite ? '#10b981' : undefined, // Green for user favorites
            borderColor: item.isUserFavorite ? '#065f46' : '#fff',
            borderWidth: item.isUserFavorite ? 3 : 1
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        })),
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11
        },
        labelLine: {
          show: true
        }
      }]
    };
    
    chart.setOption(option);
  }
  
  // Handle resize
  function handleResize() {
    if (chart) {
      chart.resize();
    }
  }
  
  // Reactive updates
  $effect(() => {
    if (chartContainer && chartData() && !loading) {
      initChart();
    }
  });
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          chart.dispose();
        }
      };
    }
  });
  
  // Format brewing method for display
  function formatBrewMethod(method: string): string {
    return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  }
  
  // Get total number of participants analyzed
  const totalParticipants = $derived(() => {
    if (!tasteTestData) return 0;
    const uniqueParticipants = new Set(tasteTestData.map(r => r.uuid));
    return uniqueParticipants.size;
  });
</script>

<div class="space-y-6">
  <div class="text-center">
    <h4 class="h4 mb-3 text-lg sm:text-xl">🫖 Community Brewing Preferences</h4>
    <p class="text-sm sm:text-base opacity-75 max-w-2xl mx-auto leading-relaxed">
      See which brewing methods are most popular based on what participants actually rated as their favorites
    </p>
  </div>
  
  {#if loading}
    <!-- Loading state -->
    <div class="flex items-center justify-center py-8">
      <div class="flex items-center space-x-3">
        <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm opacity-75">Analyzing participant preferences...</span>
      </div>
    </div>
    
  {:else if !tasteTestData || tasteTestData.length === 0}
    <!-- No data state -->
    <div class="card p-6 text-center bg-surface-50-900-token">
      <div class="text-4xl mb-3">📊</div>
      <h5 class="h5 mb-2">No Taste Test Data Available</h5>
      <p class="text-sm opacity-75 max-w-md mx-auto">
        Taste test preference data is not available to analyze brewing method preferences.
      </p>
    </div>
    
  {:else if chartData().total === 0}
    <!-- No preferences found -->
    <div class="card p-6 text-center bg-surface-50-900-token">
      <div class="text-4xl mb-3">🤷‍♀️</div>
      <h5 class="h5 mb-2">No Brewing Preferences Found</h5>
      <p class="text-sm opacity-75 max-w-md mx-auto">
        Unable to determine brewing method preferences from the available taste test data.
      </p>
    </div>
    
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Chart Section -->
      <div class="card p-4 sm:p-6">
        <div bind:this={chartContainer} class="w-full h-80"></div>
      </div>
      
      <!-- Analysis Section -->
      <div class="space-y-4">
        
        <!-- Overall Distribution -->
        <div class="card p-4 sm:p-6">
          <h5 class="h5 mb-4 flex items-center gap-2">
            <span>📈</span>
            <span>Community Preferences</span>
          </h5>
          
          <div class="space-y-3">
            {#each chartData().data as method}
              <div class="flex items-center justify-between p-2 rounded-lg bg-surface-50-900-token">
                <div class="flex items-center gap-2">
                  {#if method.isUserFavorite}
                    <span class="text-success-500">⭐</span>
                  {/if}
                  <span class="font-medium text-sm sm:text-base">{formatBrewMethod(method.name)}</span>
                </div>
                <div class="text-right">
                  <div class="font-bold text-primary-500">{method.value}</div>
                  <div class="text-xs opacity-75">{method.percentage}%</div>
                </div>
              </div>
            {/each}
          </div>
          
          <div class="mt-4 pt-3 border-t border-surface-300-600-token">
            <div class="text-center text-sm opacity-75">
              Based on {totalParticipants()} participants' favorites<br/>
              Total preferences: {chartData().total}
            </div>
          </div>
        </div>
        
        <!-- User's Alignment with Community -->
        {#if userPreferences?.userId && userFavoriteBrewMethods().length > 0}
          <div class="card p-4 sm:p-6 preset-outlined-success-500">
            <h5 class="h5 mb-4 flex items-center gap-2 text-success-600 dark:text-success-400">
              <span>🎯</span>
              <span>Brewing Method Preferences</span>
            </h5>
            
            <p class="text-sm opacity-75 mb-3">
              How your brewing preferences compare to the community:
            </p>
            
            <div class="space-y-2">
              {#each userFavoriteBrewMethods() as method}
                {#each chartData().data as communityMethod}
                  {#if communityMethod.name === method}
                    <div class="flex items-center gap-3 p-2 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                      <span class="text-xl">☕</span>
                      <div class="flex-1">
                        <div class="font-medium text-success-800 dark:text-success-200">
                          {formatBrewMethod(method!)}
                        </div>
                        <div class="text-xs opacity-75">
                          {communityMethod.percentage}% of participants also prefer this method
                        </div>
                      </div>
                    </div>
                  {/if}
                {/each}
                {#if !chartData().data.some(d => d.name === method)}
                  <div class="flex items-center gap-3 p-2 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                    <span class="text-xl">☕</span>
                    <div class="flex-1">
                      <div class="font-medium text-success-800 dark:text-success-200">
                        {formatBrewMethod(method!)}
                      </div>
                      <div class="text-xs opacity-75">
                        You're unique - no other participants chose this brewing method as their favorite!
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
            
            <!-- Community alignment insight -->
            {#if userFavoriteBrewMethods().filter(method => chartData().data.some(d => d.name === method)).length === userFavoriteBrewMethods().length}
              <div class="mt-3 p-3 bg-success-100 dark:bg-success-900/30 rounded-lg text-xs">
                <p class="text-success-800 dark:text-success-200">
                  🤝 <strong>Community Aligned!</strong> Your brewing preferences match what other participants also loved.
                </p>
              </div>
            {:else if userFavoriteBrewMethods().filter(method => chartData().data.some(d => d.name === method)).length === 0}
              <div class="mt-3 p-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg text-xs">
                <p class="text-warning-800 dark:text-warning-200">
                  🦄 <strong>Unique Taste!</strong> Your brewing preferences are completely different from the community.
                </p>
              </div>
            {:else}
              <div class="mt-3 p-3 bg-tertiary-100 dark:bg-tertiary-900/30 rounded-lg text-xs">
                <p class="text-tertiary-800 dark:text-tertiary-200">
                  🌟 <strong>Partially Aligned!</strong> Some of your preferences match the community, others are uniquely yours.
                </p>
              </div>
            {/if}
          </div>
          
        {:else if userPreferences?.userId}
          <div class="card p-4 sm:p-6 bg-surface-50-900-token">
            <h5 class="h5 mb-2">🤔 No Personal Preferences Yet</h5>
            <p class="text-sm opacity-75 mb-3">
              Complete the taste test to see how your brewing preferences compare to the community!
            </p>
            <a href="/taste-test" class="btn btn-sm preset-filled-primary-500">
              Take Taste Test
            </a>
          </div>
        {/if}
        
        <!-- Community Insights -->
        <div class="card p-4 bg-surface-50-900-token">
          <h6 class="font-medium mb-2 flex items-center gap-2">
            <span>💡</span>
            <span>What methods do people prefer?</span>
          </h6>
          
          <div class="text-xs sm:text-sm space-y-2 opacity-75">
            {#if chartData().data.length > 0}
              {#if chartData().data[0]}
                <p>
                  • <strong>{formatBrewMethod(chartData().data[0].name)}</strong> is the most preferred brewing method ({chartData().data[0].percentage}% of preferences)
                </p>
              {/if}
              
              {#if chartData().data.length > 1 && chartData().data[chartData().data.length - 1]}
                <p>
                  • <strong>{formatBrewMethod(chartData().data[chartData().data.length - 1].name)}</strong> is the least preferred method ({chartData().data[chartData().data.length - 1].percentage}% of preferences)
                </p>
              {/if}
              
              <p>
                • Community shows preference for <strong>{chartData().data.length}</strong> different brewing methods
              </p>
              
              <p>
                • Analysis based on <strong>{totalParticipants()}</strong> participants' taste test results
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Enhanced card hover effects */
  .card {
    transition: all 0.2s ease-in-out;
  }
  
  /* Improved mobile responsiveness */
  @media (max-width: 640px) {
    .grid {
      gap: 1rem;
    }
    
    /* Make chart container responsive */
    :global(.chart-container) {
      height: 250px !important;
    }
  }
  
  /* Enhanced focus styles for accessibility */
  a:focus-visible {
    outline: 2px solid rgb(var(--color-primary-500));
    outline-offset: 2px;
  }
  
  /* Loading animation */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style> 