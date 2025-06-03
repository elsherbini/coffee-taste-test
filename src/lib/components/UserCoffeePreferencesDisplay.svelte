<script lang="ts">
  import type { CoffeeData, UserCoffeePreferences } from '$lib/services/dataService';
  
  interface Props {
    coffeeData: CoffeeData[];
    userPreferences: UserCoffeePreferences | null;
    loading?: boolean;
  }
  
  let { coffeeData, userPreferences, loading = false }: Props = $props();
  
  // Get coffee details for favorite coffees
  const favoriteCoffeeDetails = $derived(() => {
    if (!userPreferences?.favoriteCoffees) return [];
    return userPreferences.favoriteCoffees.map(coffeeId => {
      const coffee = coffeeData.find(c => c.coffee_id === coffeeId);
      const rating = userPreferences.userRatings[coffeeId];
      return { coffee, rating };
    }).filter((item): item is { coffee: CoffeeData; rating: number } => 
      item.coffee !== undefined
    );
  });
  
  // Get coffee details for least favorite coffees
  const leastFavoriteCoffeeDetails = $derived(() => {
    if (!userPreferences?.leastFavoriteCoffees) return [];
    return userPreferences.leastFavoriteCoffees.map(coffeeId => {
      const coffee = coffeeData.find(c => c.coffee_id === coffeeId);
      const rating = userPreferences.userRatings[coffeeId];
      return { coffee, rating };
    }).filter((item): item is { coffee: CoffeeData; rating: number } => 
      item.coffee !== undefined
    );
  });
  
  // Check if user has any preference data
  const hasPreferences = $derived(() => {
    return userPreferences?.userId && 
           (favoriteCoffeeDetails().length > 0 || leastFavoriteCoffeeDetails().length > 0);
  });
  
  // Format rating display
  function formatRating(rating: number): string {
    return `${rating}/5`;
  }
  
  // Get star display for rating
  function getStarDisplay(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }
</script>

<div class="space-y-6">
  <div class="text-center">
    <h4 class="h4 mb-3 text-lg sm:text-xl">☕ Your Coffee Preferences</h4>
    <p class="text-sm sm:text-base opacity-75 max-w-2xl mx-auto leading-relaxed">
      Based on your taste test ratings, here are your coffee favorites and least favorites
    </p>
  </div>
  
  {#if loading}
    <!-- Loading state -->
    <div class="flex items-center justify-center py-8">
      <div class="flex items-center space-x-3">
        <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm opacity-75">Loading your coffee preferences...</span>
      </div>
    </div>
    
  {:else if !hasPreferences()}
    <!-- No preferences state -->
    <div class="card p-6 text-center bg-surface-50-900-token">
      <div class="text-4xl mb-3">🤷‍♀️</div>
      <h5 class="h5 mb-2">No Coffee Preferences Yet</h5>
      <p class="text-sm opacity-75 mb-4 max-w-md mx-auto">
        Complete the taste test to see which coffees you liked most and least!
      </p>
      <a href="/taste-test" class="btn preset-filled-primary-500">
        Take Taste Test
      </a>
    </div>
    
  {:else}
    <!-- Preferences display -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Favorite Coffees -->
      {#if favoriteCoffeeDetails().length > 0}
        <div class="card p-4 sm:p-6 preset-outlined-success-500">
          <div class="flex items-center gap-3 mb-4">
            <div class="text-2xl">🏆</div>
            <div>
              <h5 class="h5 text-success-600 dark:text-success-400">
                Your Favorite{favoriteCoffeeDetails().length > 1 ? 's' : ''}
              </h5>
              <p class="text-xs sm:text-sm opacity-75">
                {favoriteCoffeeDetails().length > 1 ? 'These coffees tied for' : 'This coffee got'} your highest rating
              </p>
            </div>
          </div>
          
          <div class="space-y-3">
            {#each favoriteCoffeeDetails() as { coffee, rating }}
              <div class="bg-success-50 dark:bg-success-900/20 rounded-lg p-3 border border-success-200 dark:border-success-800">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-success-800 dark:text-success-200">
                        Coffee {coffee.coffee_id}
                      </span>
                      <span class="text-lg" title={`Rated ${formatRating(rating)}`}>
                        {getStarDisplay(rating)}
                      </span>
                    </div>
                    <h6 class="font-medium text-sm sm:text-base mb-1 text-success-900 dark:text-success-100">
                      {coffee.coffee_name}
                    </h6>
                    <div class="text-xs sm:text-sm opacity-75 space-y-1">
                      {#if coffee.coffee_geography}
                        <div>📍 {coffee.coffee_geography}</div>
                      {/if}
                      {#if coffee.process}
                        <div>⚙️ {coffee.process}</div>
                      {/if}
                      {#if coffee.brew_method}
                        <div>☕ {coffee.brew_method}</div>
                      {/if}
                      {#if coffee.price}
                        <div>💰 {coffee.price}</div>
                      {/if}
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="text-lg font-bold text-success-600 dark:text-success-400">
                      {formatRating(rating)}
                    </div>
                    <div class="text-xs opacity-60">rating</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Least Favorite Coffees -->
      {#if leastFavoriteCoffeeDetails().length > 0}
        <div class="card p-4 sm:p-6 preset-outlined-warning-500">
          <div class="flex items-center gap-3 mb-4">
            <div class="text-2xl">😔</div>
            <div>
              <h5 class="h5 text-warning-600 dark:text-warning-400">
                Your Least Favorite{leastFavoriteCoffeeDetails().length > 1 ? 's' : ''}
              </h5>
              <p class="text-xs sm:text-sm opacity-75">
                {leastFavoriteCoffeeDetails().length > 1 ? 'These coffees tied for' : 'This coffee got'} your lowest rating
              </p>
            </div>
          </div>
          
          <div class="space-y-3">
            {#each leastFavoriteCoffeeDetails() as { coffee, rating }}
              <div class="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-3 border border-warning-200 dark:border-warning-800">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-warning-800 dark:text-warning-200">
                        Coffee {coffee.coffee_id}
                      </span>
                      <span class="text-lg" title={`Rated ${formatRating(rating)}`}>
                        {getStarDisplay(rating)}
                      </span>
                    </div>
                    <h6 class="font-medium text-sm sm:text-base mb-1 text-warning-900 dark:text-warning-100">
                      {coffee.coffee_name}
                    </h6>
                    <div class="text-xs sm:text-sm opacity-75 space-y-1">
                      {#if coffee.coffee_geography}
                        <div>📍 {coffee.coffee_geography}</div>
                      {/if}
                      {#if coffee.process}
                        <div>⚙️ {coffee.process}</div>
                      {/if}
                      {#if coffee.brew_method}
                        <div>☕ {coffee.brew_method}</div>
                      {/if}
                      {#if coffee.price}
                        <div>💰 {coffee.price}</div>
                      {/if}
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="text-lg font-bold text-warning-600 dark:text-warning-400">
                      {formatRating(rating)}
                    </div>
                    <div class="text-xs opacity-60">rating</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Summary statistics -->
    {#if Object.keys(userPreferences?.userRatings || {}).length > 1}
      <div class="card p-4 bg-surface-50-900-token">
        <h6 class="font-medium mb-3 text-center">📊 Your Rating Summary</h6>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div class="font-bold text-primary-500">
              {Object.keys(userPreferences?.userRatings || {}).length}
            </div>
            <div class="opacity-75">Coffees Rated</div>
          </div>
          <div>
            <div class="font-bold text-secondary-500">
              {(Object.values(userPreferences?.userRatings || {}).reduce((sum, rating) => sum + rating, 0) / Object.values(userPreferences?.userRatings || {}).length).toFixed(1)}
            </div>
            <div class="opacity-75">Avg Rating</div>
          </div>
          <div>
            <div class="font-bold text-success-500">
              {Math.max(...Object.values(userPreferences?.userRatings || {}))}
            </div>
            <div class="opacity-75">Highest</div>
          </div>
          <div>
            <div class="font-bold text-warning-500">
              {Math.min(...Object.values(userPreferences?.userRatings || {}))}
            </div>
            <div class="opacity-75">Lowest</div>
          </div>
        </div>
      </div>
    {/if}
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
  }
  
  /* Better star spacing */
  .text-lg {
    letter-spacing: 0.05em;
  }
  
  /* Enhanced focus styles for accessibility */
  a:focus-visible {
    outline: 2px solid rgb(var(--color-primary-500));
    outline-offset: 2px;
  }
</style> 