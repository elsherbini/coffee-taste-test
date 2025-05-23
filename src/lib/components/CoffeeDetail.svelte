<script lang="ts">
  import { onMount } from 'svelte';
  import { Rating } from '@skeletonlabs/skeleton-svelte';
  import * as echarts from 'echarts';
  import WordCloud from '$lib/components/WordCloud.svelte';
  
  export let coffee: string;
  export let stats: {
    bitterness: { sum: number; count: number };
    sweetness: { sum: number; count: number };
    acidity: { sum: number; count: number };
    quality: { sum: number; count: number };
    body: Record<string, number>;
    aftertaste: Record<string, number>;
    tastingNotes: Record<string, number>;
  };
  export let averages: {
    rankings: Record<string, Record<string, number>>;
    averages: Record<string, Record<string, number>>;
  };
  
  // References for charts
  let bodyChart: HTMLElement;
  let aftertasteChart: HTMLElement;
  
  // Metric labels with type definition
  const metrics = [
    { id: 'quality' as const, label: 'Quality' },
    { id: 'bitterness' as const, label: 'Bitterness' },
    { id: 'sweetness' as const, label: 'Sweetness' },
    { id: 'acidity' as const, label: 'Acidity' }
  ];
  
  type MetricKey = typeof metrics[number]['id'];
  
  // Helper function to get color based on rank
  function getRankColor(rank: number): string {
    const colors = ['variant-filled-primary', 'variant-filled-secondary', 'variant-filled-tertiary', 'variant-filled-success', 'variant-filled-warning'];
    return colors[Math.min(rank - 1, colors.length - 1)];
  }
  
  // Prepare wordcloud data
  $: wordcloudData = Object.entries(stats.tastingNotes).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);
  
  // Initialize pie charts for body and aftertaste
  function initAttributeCharts() {
    if (!bodyChart || !aftertasteChart) return;
    
    const bodyChartInstance = echarts.init(bodyChart);
    const aftertasteChartInstance = echarts.init(aftertasteChart);
    
    // Prepare data for body pie chart
    const bodyData = Object.entries(stats.body).map(([name, value]) => ({ 
      name, value 
    }));
    
    // Prepare data for aftertaste pie chart
    const aftertasteData = Object.entries(stats.aftertaste).map(([name, value]) => ({ 
      name, value 
    }));
    
    // Body chart options
    const bodyOptions = {
      title: {
        text: 'Body',
        left: 'center'
      },
      tooltip: {
        trigger: 'item' as const,
        formatter: '{b}: {c} ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: '70%',
        data: bodyData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c}'
        }
      }]
    };
    
    // Aftertaste chart options
    const aftertasteOptions = {
      title: {
        text: 'Aftertaste',
        left: 'center'
      },
      tooltip: {
        trigger: 'item' as const,
        formatter: '{b}: {c} ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: '70%',
        data: aftertasteData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c}'
        }
      }]
    };
    
    bodyChartInstance.setOption(bodyOptions);
    aftertasteChartInstance.setOption(aftertasteOptions);
    
    // Handle resize for responsiveness
    const resizeCharts = () => {
      bodyChartInstance.resize();
      aftertasteChartInstance.resize();
    };
    
    window.addEventListener('resize', resizeCharts);
    
    return () => {
      window.removeEventListener('resize', resizeCharts);
      bodyChartInstance.dispose();
      aftertasteChartInstance.dispose();
    };
  }
  
  onMount(() => {
    const attributeChartsCleanup = initAttributeCharts();
    
    return () => {
      if (attributeChartsCleanup) attributeChartsCleanup();
    };
  });

  // Custom wordcloud options
  const wordcloudOptions = {
    series: [{
      shape: 'circle',
      sizeRange: [12, 35],
      rotationRange: [-45, 45],
      rotationStep: 15,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: function () {
          return 'rgb(' + [
            Math.round(Math.random() * 200 + 55),
            Math.round(Math.random() * 100 + 155),
            Math.round(Math.random() * 100 + 155)
          ].join(',') + ')';
        }
      }
    }]
  };
</script>

<div class="space-y-6">
  <div class="card p-4">
    <h2 class="h3 mb-4">{coffee} Ratings</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each metrics as metric}
        <div class="card p-3 variant-glass">
          <h3 class="h4">{metric.label}</h3>
          <div class="flex items-center mt-2">
            <Rating 
              value={stats[metric.id].count > 0 ? stats[metric.id].sum / stats[metric.id].count : 0} 
              readOnly={true} 
            />
            <span class="ml-2">
              ({(stats[metric.id].count > 0 ? stats[metric.id].sum / stats[metric.id].count : 0).toFixed(1)})
            </span>
            <span class="ml-auto badge {getRankColor(averages.rankings[metric.id][coffee])}">
              Rank #{averages.rankings[metric.id][coffee]}
            </span>
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Body and Aftertaste pie charts -->
    <div class="card p-4">
      <div bind:this={bodyChart} class="h-64"></div>
    </div>
    
    <div class="card p-4">
      <div bind:this={aftertasteChart} class="h-64"></div>
    </div>
  </div>
  
  <div class="card p-4">
    <h2 class="h3 mb-4">Tasting Notes</h2>
    <WordCloud data={wordcloudData} height="300px" options={wordcloudOptions} />
  </div>
</div>

<style>
  /* Add any custom styles here */
</style> 