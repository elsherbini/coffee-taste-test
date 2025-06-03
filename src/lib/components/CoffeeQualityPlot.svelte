<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  import type { CoffeeQualityData } from '$lib/services/dataService';
  
  export let qualityData: CoffeeQualityData[] = [];
  export let loading: boolean = false;
  export let error: string | null = null;
  
  // Chart reference
  let chartContainer: HTMLElement;
  let chartInstance: echarts.ECharts | null = null;
  
  // Initialize the chart
  function initChart() {
    if (!chartContainer || qualityData.length === 0) return;
    
    // Dispose of existing chart instance
    if (chartInstance) {
      chartInstance.dispose();
    }
    
    chartInstance = echarts.init(chartContainer);
    
    // Sort data by mean quality for better visualization
    const sortedData = [...qualityData].sort((a, b) => b.mean_quality - a.mean_quality);
    
    // Prepare data for the chart
    const coffeeNames = sortedData.map(item => `Coffee ${item.coffee_id}`);
    const meanQualities = sortedData.map(item => item.mean_quality);
    const confidenceIntervals = sortedData.map(item => [
      item.lower_confidence,
      item.upper_confidence
    ]);
    
    // Create error bar data (lines from p13 to p87)
    const errorBarData = sortedData.map((item, index) => [
      item.lower_confidence,
      index,
      item.upper_confidence,
      index
    ]);
    
    const options: any = {
      title: {
        text: 'Estimated Coffee Quality',
        subtext: 'Quality estimates with confidence intervals',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#666'
        }
      },
      grid: {
        left: '15%',
        right: '10%',
        top: '15%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Quality Score',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 'bold'
        },
        axisLabel: {
          fontSize: 12
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#e0e0e0'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: coffeeNames,
        axisLabel: {
          fontSize: 12,
          fontWeight: 'bold'
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#d0d0d0'
          }
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          if (params.seriesName === 'Mean Quality') {
            const dataIndex = params.dataIndex;
            const item = sortedData[dataIndex];
            return `
              <strong>${params.name}</strong><br/>
              Mean Quality: <strong>${item.mean_quality.toFixed(2)}</strong><br/>
              Confidence Interval: ${item.lower_confidence.toFixed(2)} - ${item.upper_confidence.toFixed(2)}<br/>
              Range: ±${((item.upper_confidence - item.lower_confidence) / 2).toFixed(2)}
            `;
          }
          return params.name;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#777',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12
        }
      },
      series: [
        {
          name: 'Confidence Interval',
          type: 'custom',
          renderItem: function(params: any, api: any) {
            const yValue = api.coord([0, params.dataIndex])[1];
            const x1 = api.coord([confidenceIntervals[params.dataIndex][0], 0])[0];
            const x2 = api.coord([confidenceIntervals[params.dataIndex][1], 0])[0];
            
            const height = 2;
            const capHeight = 6;
            
            return {
              type: 'group',
              children: [
                // Main line (confidence interval)
                {
                  type: 'line',
                  shape: {
                    x1: x1,
                    y1: yValue,
                    x2: x2,
                    y2: yValue
                  },
                  style: {
                    stroke: '#666',
                    lineWidth: height
                  }
                },
                // Left cap
                {
                  type: 'line',
                  shape: {
                    x1: x1,
                    y1: yValue - capHeight/2,
                    x2: x1,
                    y2: yValue + capHeight/2
                  },
                  style: {
                    stroke: '#666',
                    lineWidth: 2
                  }
                },
                // Right cap
                {
                  type: 'line',
                  shape: {
                    x1: x2,
                    y1: yValue - capHeight/2,
                    x2: x2,
                    y2: yValue + capHeight/2
                  },
                  style: {
                    stroke: '#666',
                    lineWidth: 2
                  }
                }
              ]
            };
          },
          data: sortedData.map((_, index) => index),
          z: 1
        },
        {
          name: 'Mean Quality',
          type: 'scatter',
          data: meanQualities,
          symbolSize: 8,
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#1e40af',
            borderWidth: 2
          },
          emphasis: {
            itemStyle: {
              color: '#1d4ed8',
              borderColor: '#1e3a8a',
              borderWidth: 3
            },
            scale: 1.2
          },
          z: 2
        }
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };
    
    chartInstance.setOption(options);
    
    // Handle resize for responsiveness
    const resizeHandler = () => {
      if (chartInstance) {
        chartInstance.resize();
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    
    return () => {
      window.removeEventListener('resize', resizeHandler);
      if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
      }
    };
  }
  
  // Reactive statement to update chart when data changes
  $: if (chartContainer && qualityData.length > 0) {
    initChart();
  }
  
  onMount(() => {
    return () => {
      if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
      }
    };
  });
</script>

<div class="card p-6 space-y-4">
  <div class="text-center">
    <h3 class="h4 text-xl font-semibold">Coffee Quality Estimation</h3>
    <p class="text-sm opacity-75 mt-2">
      Estimated quality scores with confidence intervals for each coffee
    </p>
  </div>
  
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-8 h-8 border-4 border-surface-300 border-t-primary-500 rounded-full animate-spin"></div>
        <p class="text-sm opacity-75">Loading quality estimation data...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center py-12">
      <div class="text-center space-y-2">
        <div class="text-4xl">⚠️</div>
        <h4 class="font-semibold text-error-600 dark:text-error-400">Error Loading Data</h4>
        <p class="text-sm opacity-75">{error}</p>
      </div>
    </div>
  {:else if qualityData.length === 0}
    <div class="flex items-center justify-center py-12">
      <div class="text-center space-y-2">
        <div class="text-4xl">📊</div>
        <h4 class="font-semibold">No Quality Data Available</h4>
        <p class="text-sm opacity-75">Quality estimation data will appear here when available.</p>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      <!-- Chart Container -->
      <div 
        bind:this={chartContainer} 
        class="h-96 w-full"
        style="min-height: 400px;"
      ></div>
      
      <!-- Legend and Info -->
      <div class="flex flex-wrap items-center justify-center gap-6 text-sm border-t border-surface-300-600-token pt-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-700"></div>
          <span>Mean Quality Score</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-0.5 bg-gray-600"></div>
          <span>Confidence Interval (p13 - p87)</span>
        </div>
        <div class="text-xs opacity-75">
          Higher scores indicate better estimated quality
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style> 