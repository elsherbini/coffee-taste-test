<script>
  import WordCloud from '$lib/components/WordCloud.svelte';
  
  // Example data for the word cloud
  const words = [
    { name: 'Coffee', value: 200 },
    { name: 'Espresso', value: 150 },
    { name: 'Latte', value: 120 },
    { name: 'Cappuccino', value: 110 },
    { name: 'Arabica', value: 100 },
    { name: 'Robusta', value: 90 },
    { name: 'Mocha', value: 80 },
    { name: 'Americano', value: 75 },
    { name: 'Barista', value: 70 },
    { name: 'Beans', value: 65 },
    { name: 'Bitter', value: 60 },
    { name: 'Sweet', value: 55 },
    { name: 'Aroma', value: 50 },
    { name: 'Caffeine', value: 45 },
    { name: 'Roast', value: 40 }
  ];
</script>

<div class="container mx-auto p-8">
  <h1 class="text-2xl font-bold mb-6">Coffee Word Cloud Example</h1>
  <div class="card p-4 variant-filled-surface">
    <WordCloud data={words} height="400px" />
  </div>
</div> 