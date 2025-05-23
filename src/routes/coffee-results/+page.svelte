<script lang="ts">
  import { onMount } from 'svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import Overview from '$lib/components/Overview.svelte';
  import CoffeeDetail from '$lib/components/CoffeeDetail.svelte';
  
  // Store for coffee data
  let coffeeData: any[] = [];
  let processedData: any = null;
  let isLoading = true;
  let error: string | null = null;
  let coffeeTypes: string[] = [];
  let activeTab = 'overview';
  
  // Parse the CSV data from Google Sheets
  async function fetchData() {
    try {
      // Use the provided published Google Sheets URL but modify it to get CSV
      const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSv3n8ZAHU4alXKFZ3n00LCePq_lN2Qo28KwONiyu7Jo-WUKV6uBOBvlSNpbaBOOJkZeHzqfZBgswFx/pub?output=csv';
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      
      if (rows.length > 1) {
        const headers = rows[0];
        coffeeData = rows.slice(1).map(row => {
          const entry: Record<string, any> = {};
          headers.forEach((header, index) => {
            entry[header] = row[index];
          });
          return entry;
        });
        
        // Process the data
        processedData = processResults(coffeeData);
        coffeeTypes = Object.keys(processedData.coffeeStats);
      }
      
      isLoading = false;
    } catch (err) {
      console.error('Error fetching data:', err);
      error = 'Failed to load coffee tasting results. Please try again later.';
      isLoading = false;
    }
  }
  
  // Parse CSV string into array of rows
  function parseCSV(text: string): string[][] {
    const rows = text.split('\n');
    return rows.map(row => {
      // Handle commas within quoted fields
      const result = [];
      let inQuotes = false;
      let currentField = '';
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      
      // Add the last field
      result.push(currentField);
      return result;
    });
  }
  
  // Process and filter the data
  function processResults(data: any[]) {
    // Convert string values to numbers
    const numericFields = ['bitterness', 'sweetness', 'acidity', 'quality'];
    
    const convertedData = data.map(entry => {
      const converted: Record<string, any> = { ...entry };
      numericFields.forEach(field => {
        converted[field] = parseFloat(entry[field]) || 0;
      });
      // Add timestamp field for filtering latest entries
      converted.timestamp = new Date(entry.Timestamp).getTime();
      return converted;
    });
    
    // Filter to keep only the most recent response for each person/coffee combo
    const latestResponses: Record<string, any> = {};
    
    convertedData.forEach(entry => {
      const key = `${entry.userId}-${entry.coffee}`;
      if (!latestResponses[key] || entry.timestamp > latestResponses[key].timestamp) {
        latestResponses[key] = entry;
      }
    });
    
    const filteredData = Object.values(latestResponses);
    
    // Group by coffee type
    const coffeeStats: Record<string, any> = {};
    const coffeeResponses: Record<string, any[]> = {};
    
    filteredData.forEach(entry => {
      const coffee = entry.coffee;
      
      // Initialize coffee stats if not exist
      if (!coffeeStats[coffee]) {
        coffeeStats[coffee] = {
          bitterness: { sum: 0, count: 0 },
          sweetness: { sum: 0, count: 0 },
          acidity: { sum: 0, count: 0 },
          quality: { sum: 0, count: 0 },
          body: {},
          aftertaste: {},
          tastingNotes: {}
        };
        coffeeResponses[coffee] = [];
      }
      
      // Add numeric data
      ['bitterness', 'sweetness', 'acidity', 'quality'].forEach(field => {
        if (!isNaN(entry[field])) {
          coffeeStats[coffee][field].sum += entry[field];
          coffeeStats[coffee][field].count += 1;
        }
      });
      
      // Count body and aftertaste ratings
      ['body', 'aftertaste'].forEach(field => {
        const value = entry[field];
        if (value) {
          coffeeStats[coffee][field][value] = (coffeeStats[coffee][field][value] || 0) + 1;
        }
      });
      
      // Count tasting notes
      if (entry.tastingNotes) {
        const notes = entry.tastingNotes.split(',').map((note: string) => note.trim());
        notes.forEach((note: string) => {
          if (note) {
            coffeeStats[coffee].tastingNotes[note] = (coffeeStats[coffee].tastingNotes[note] || 0) + 1;
          }
        });
      }
      
      // Add to coffee responses
      coffeeResponses[coffee].push(entry);
    });
    
    // Calculate averages and rankings
    const averages: Record<string, Record<string, number>> = {};
    const rankings: Record<string, Record<string, number>> = {};
    
    ['bitterness', 'sweetness', 'acidity', 'quality'].forEach(field => {
      averages[field] = {};
      
      // Calculate average for each coffee
      Object.keys(coffeeStats).forEach(coffee => {
        const stats = coffeeStats[coffee][field];
        averages[field][coffee] = stats.count > 0 ? stats.sum / stats.count : 0;
      });
      
      // Calculate rankings
      const sorted = Object.entries(averages[field])
        .sort((a, b) => b[1] - a[1]) // Sort descending
        .map(([coffee], index) => ([coffee, index + 1]));
      
      rankings[field] = Object.fromEntries(sorted);
    });
    
    return {
      coffeeStats,
      coffeeResponses,
      averages,
      rankings
    };
  }
  
  onMount(() => {
    fetchData();
  });
  
  // Handle tab change
  function handleTabChange(e: CustomEvent) {
    activeTab = e.detail;
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="h2 mb-4">Coffee Tasting Results</h1>
  
  {#if isLoading}
    <div class="flex items-center justify-center h-32">
      <div class="spinner" />
    </div>
  {:else if error}
    <div class="alert variant-filled-error">
      <p>{error}</p>
    </div>
  {:else if processedData}
    <Tabs value={activeTab} on:change={handleTabChange}>
      <svelte:fragment slot="list">
        <div class="tab" data-value="overview">Overview</div>
        {#each coffeeTypes as coffee}
          <div class="tab" data-value={coffee}>{coffee}</div>
        {/each}
      </svelte:fragment>
      <svelte:fragment slot="content">
        {#if activeTab === 'overview'}
          <Overview data={processedData} />
        {:else}
          <CoffeeDetail 
            coffee={activeTab} 
            stats={processedData.coffeeStats[activeTab]} 
            averages={processedData} 
          />
        {/if}
      </svelte:fragment>
    </Tabs>
  {/if}
</div>

<style>
  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #3b82f6;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style> 