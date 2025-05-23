<script>
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  
  export let data = [];
  export let width = '100%';
  export let height = '400px';
  export let options = {};
  
  let chartElement;
  let chart;
  
  onMount(() => {
    // Only initialize echarts and wordcloud in the browser
    if (typeof window !== 'undefined') {
      // Dynamically import echarts-wordcloud only in browser context
      import('echarts-wordcloud').then(() => {
        chart = echarts.init(chartElement);
        
        const defaultOptions = {
          series: [{
            type: 'wordCloud',
            shape: 'circle',
            left: 'center',
            top: 'center',
            width: '70%',
            height: '80%',
            right: null,
            bottom: null,
            sizeRange: [12, 60],
            rotationRange: [-90, 90],
            rotationStep: 45,
            gridSize: 8,
            drawOutOfBound: false,
            textStyle: {
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              color: function () {
                return 'rgb(' + [
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160)
                ].join(',') + ')';
              }
            },
            emphasis: {
              focus: 'self',
              textStyle: {
                shadowBlur: 10,
                shadowColor: '#333'
              }
            },
            data: data
          }]
        };
        
        // Merge user options with defaults
        const mergedOptions = { ...defaultOptions, ...options };
        
        // If user provided series options, merge them with the default series
        if (options.series && options.series.length > 0) {
          mergedOptions.series[0] = { ...mergedOptions.series[0], ...options.series[0] };
        }
        
        chart.setOption(mergedOptions);
        
        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          chart.resize();
        });
        
        resizeObserver.observe(chartElement);
        
        return () => {
          resizeObserver.disconnect();
          chart.dispose();
        };
      });
    }
  });
</script>

<div bind:this={chartElement} style="width: {width}; height: {height};">
  {#if typeof window === 'undefined'}
    <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
      Word Cloud will render in browser
    </div>
  {/if}
</div> 