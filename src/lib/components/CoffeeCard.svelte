<script lang="ts">
  import type { CoffeeData, CoffeeTasteStats, UserCoffeePreferences } from '$lib/services/dataService';
  import { Rating } from '@skeletonlabs/skeleton-svelte';
  
  export let coffee: CoffeeData;
  export let tasteStats: CoffeeTasteStats | null = null;
  export let userPreferences: UserCoffeePreferences | null = null;
  
  // Helper function to format ratings with proper decimal places
  function formatRating(rating: number): string {
    return rating.toFixed(1);
  }
  
  // Helper function to get color based on rating (out of 5)
  function getRatingColor(rating: number): string {
    if (rating >= 4.0) return 'text-success-500';
    if (rating >= 3.0) return 'text-warning-500';
    return 'text-error-500';
  }
  
  // Check if this coffee is the user's favorite
  $: isFavorite = userPreferences?.favoriteCoffees.includes(coffee.coffee_id) || false;
  
  // Check if this coffee is the user's least favorite
  $: isLeastFavorite = userPreferences?.leastFavoriteCoffees.includes(coffee.coffee_id) || false;
  
  // Get user's rating for this coffee if available
  $: userRating = userPreferences?.userRatings[coffee.coffee_id] || null;
</script>

<div class="card p-4 space-y-4 hover:card-hover transition-all duration-200 relative">
  <!-- User Preference Icons -->
  {#if isFavorite || isLeastFavorite}
    <div class="absolute top-2 right-2 flex gap-1">
      {#if isFavorite}
        <div class="badge preset-filled-success text-lg px-2 py-1" title="Your favorite!">
          ❤️
        </div>
      {/if}
      {#if isLeastFavorite}
        <div class="badge preset-filled-error text-lg px-2 py-1" title="Your least favorite">
          💔
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Coffee ID Badge -->
  <div class="flex items-center justify-between">
    <div class="badge preset-filled-primary text-lg font-bold px-3 py-1">
      Coffee {coffee.coffee_id}
    </div>
    {#if tasteStats}
      <div class="text-xs text-surface-600-300-token">
        {tasteStats.totalRatings} ratings
      </div>
    {/if}
  </div>
  
  <!-- Coffee Name -->
  <h3 class="h4 font-semibold text-on-surface-token">
    {coffee.coffee_name}
  </h3>
  <!-- Brew Method -->
      <div class="flex items-center gap-2">
        <span class="text-lg">☕</span>
        <span class="text-surface-600-300-token font-medium">Brew Method:</span>
        <span class="text-on-surface-token">{coffee.brew_method}</span>
  </div>
  <!-- User's Personal Rating (if available) -->
  {#if userRating !== null}
    <div class="bg-primary-50-900-token p-2 rounded border-l-4 border-primary-500">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-primary-700-200-token">Your Rating:</span>
        <Rating value={userRating} readOnly={true} />
        <span class="text-sm font-bold text-primary-700-200-token">
          {formatRating(userRating)}
        </span>
      </div>
    </div>
  {/if}
  
  <!-- Coffee Details Grid -->
  <div class="grid grid-cols-1 gap-2 text-sm">
    <!-- Geography (if available) -->
    {#if coffee.coffee_geography && coffee.coffee_geography.trim()}
      <div class="flex items-center gap-2">
        <span class="text-lg">🌍</span>
        <span class="text-surface-600-300-token font-medium">Origin:</span>
        <span class="text-on-surface-token">{coffee.coffee_geography}</span>
      </div>
    {/if}
    
    <!-- Process (if available) -->
    {#if coffee.process && coffee.process.trim()}
      <div class="flex items-center gap-2">
        <span class="text-lg">⚙️</span>
        <span class="text-surface-600-300-token font-medium">Process:</span>
        <span class="text-on-surface-token">{coffee.process}</span>
      </div>
    {/if}
    

    
    <!-- Price -->
    <div class="flex items-center gap-2">
      <span class="text-lg">💰</span>
      <span class="text-surface-600-300-token font-medium">Price:</span>
      <span class="text-on-surface-token font-semibold">{coffee.price} per cup</span>
    </div>
  </div>
  
  <!-- Taste Test Results -->
  {#if tasteStats}
    <div class="border-t border-surface-300-600-token pt-4">
      <h4 class="h5 font-semibold mb-3 text-on-surface-token">Taste Test Results</h4>
      
      <div class="grid grid-cols-2 gap-3">
        <!-- Aroma -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-sm">👃</span>
            <span class="text-xs text-surface-600-300-token font-medium">Aroma</span>
          </div>
          <div class="flex items-center gap-2">
            
            <span class="text-sm font-semibold {getRatingColor(tasteStats.averageAroma)}">
              {formatRating(tasteStats.averageAroma)}
            </span>
          </div>
        </div>
        
        <!-- Flavor -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-sm">👅</span>
            <span class="text-xs text-surface-600-300-token font-medium">Flavor</span>
          </div>
          <div class="flex items-center gap-2">
            
            <span class="text-sm font-semibold {getRatingColor(tasteStats.averageFlavor)}">
              {formatRating(tasteStats.averageFlavor)}
            </span>
          </div>
        </div>
        
        <!-- Aftertaste -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-sm">🔄</span>
            <span class="text-xs text-surface-600-300-token font-medium">Aftertaste</span>
          </div>
          <div class="flex items-center gap-2">
            
            <span class="text-sm font-semibold {getRatingColor(tasteStats.averageAftertaste)}">
              {formatRating(tasteStats.averageAftertaste)}
            </span>
          </div>
        </div>
        
        <!-- Overall Enjoyment -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-sm">⭐</span>
            <span class="text-xs text-surface-600-300-token font-medium">Overall</span>
          </div>
          <div class="flex items-center gap-2">
            
            <span class="text-sm font-semibold {getRatingColor(tasteStats.averageOverallEnjoyment)}">
              {formatRating(tasteStats.averageOverallEnjoyment)}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Body and Acidity -->
      <div class="mt-4 space-y-3">
        <!-- Body -->
        {#if tasteStats.mostCommonBody}
          <div class="flex items-center justify-between p-2 bg-surface-100-800-token rounded">
            <div class="flex items-center gap-2">
              <span class="text-sm">🏋️</span>
              <span class="text-sm text-surface-600-300-token font-medium">Body:</span>
              <span class="text-sm font-semibold text-on-surface-token">
                {tasteStats.mostCommonBody.option}
              </span>
            </div>
            <div class="badge preset-filled-secondary text-xs">
              according to {tasteStats.mostCommonBody.percentage.toFixed(0)}%
            </div>
          </div>
        {/if}
        
        <!-- Acidity -->
        {#if tasteStats.mostCommonAcidity}
          <div class="flex items-center justify-between p-2 bg-surface-100-800-token rounded">
            <div class="flex items-center gap-2">
              <span class="text-sm">🍋</span>
              <span class="text-sm text-surface-600-300-token font-medium">Acidity:</span>
              <span class="text-sm font-semibold text-on-surface-token">
                {tasteStats.mostCommonAcidity.option}
              </span>
            </div>
            <div class="badge preset-filled-secondary text-xs">
              according to {tasteStats.mostCommonAcidity.percentage.toFixed(0)}%
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div> 