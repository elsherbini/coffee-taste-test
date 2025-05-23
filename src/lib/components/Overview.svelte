<script lang="ts">
  import { Rating } from '@skeletonlabs/skeleton-svelte';
  
  export let data: {
    averages: Record<string, Record<string, number>>;
    rankings: Record<string, Record<string, number>>;
    coffeeStats: Record<string, any>;
  };
  
  // Metrics to display
  const metrics = [
    { id: 'quality', label: 'Quality' },
    { id: 'bitterness', label: 'Bitterness' },
    { id: 'sweetness', label: 'Sweetness' },
    { id: 'acidity', label: 'Acidity' }
  ];
  
  // Get coffee types
  $: coffeeTypes = Object.keys(data.coffeeStats);
  
  // Helper function to get color based on rank
  function getRankColor(rank: number): string {
    const colors = ['variant-filled-primary', 'variant-filled-secondary', 'variant-filled-tertiary', 'variant-filled-success', 'variant-filled-warning'];
    return colors[Math.min(rank - 1, colors.length - 1)];
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  {#each metrics as metric}
    <div class="card p-4">
      <h2 class="h3 mb-3">{metric.label} Rankings</h2>
      
      <div class="space-y-4">
        {#each coffeeTypes.sort((a, b) => (data.rankings[metric.id][a] || 999) - (data.rankings[metric.id][b] || 999)) as coffee, i}
          <div class="flex items-center space-x-2">
            <div class="badge {getRankColor(data.rankings[metric.id][coffee])}">{data.rankings[metric.id][coffee]}</div>
            <span class="flex-1 font-semibold">{coffee}</span>
            <div class="flex items-center">
              <Rating 
                value={data.averages[metric.id][coffee] || 0} 
                readOnly={true} 
              />
              <span class="ml-2 text-sm">({(data.averages[metric.id][coffee] || 0).toFixed(1)})</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<div class="mt-6">
  <div class="card p-4">
    <h2 class="h3 mb-3">Summary</h2>
    <p class="mb-4">This overview shows the average scores and rankings for each coffee across different metrics. Higher scores indicate better ratings.</p>
    
    <div class="overflow-x-auto">
      <table class="table table-compact">
        <thead>
          <tr>
            <th>Coffee</th>
            {#each metrics as metric}
              <th>{metric.label}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each coffeeTypes as coffee}
            <tr>
              <td class="font-semibold">{coffee}</td>
              {#each metrics as metric}
                <td>
                  <div class="flex items-center">
                    <span>{(data.averages[metric.id][coffee] || 0).toFixed(1)}</span>
                    <span class="ml-2 text-xs badge {getRankColor(data.rankings[metric.id][coffee])}">{data.rankings[metric.id][coffee]}</span>
                  </div>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div> 