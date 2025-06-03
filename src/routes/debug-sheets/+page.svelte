<script lang="ts">
  import { onMount } from 'svelte';
  import { debugGoogleSheetsUrl } from '$lib/services/dataService';

  // URLs from your dataService.ts
  const tasteTestUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSv3n8ZAHU4alXKFZ3n00LCePq_lN2Qo28KwONiyu7Jo-WUKV6uBOBvlSNpbaBOOJkZeHzqfZBgswFx/pub?output=csv';
  const preferenceUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrlMfnRHT16l37W1V_IOAy2SJlJkq-fZIRo8JnIw052IRWeM2cG4xC1GF-rgLgbCXvgziy1bun_oC7/pub?output=csv';

  let isTestingTasteTest = false;
  let isTestingPreference = false;
  let tasteTestResults: any = null;
  let preferenceResults: any = null;
  let customUrl = '';
  let customResults: any = null;
  let isTestingCustom = false;

  async function testTasteTestUrl() {
    isTestingTasteTest = true;
    tasteTestResults = null;
    try {
      console.log('🧪 Testing Taste Test URL...');
      tasteTestResults = await debugGoogleSheetsUrl(tasteTestUrl);
    } catch (error) {
      console.error('Test failed:', error);
      tasteTestResults = { error: (error as Error).message };
    } finally {
      isTestingTasteTest = false;
    }
  }

  async function testPreferenceUrl() {
    isTestingPreference = true;
    preferenceResults = null;
    try {
      console.log('🧪 Testing Preference URL...');
      preferenceResults = await debugGoogleSheetsUrl(preferenceUrl);
    } catch (error) {
      console.error('Test failed:', error);
      preferenceResults = { error: (error as Error).message };
    } finally {
      isTestingPreference = false;
    }
  }

  async function testCustomUrl() {
    if (!customUrl.trim()) {
      alert('Please enter a URL to test');
      return;
    }
    
    isTestingCustom = true;
    customResults = null;
    try {
      console.log('🧪 Testing Custom URL...');
      customResults = await debugGoogleSheetsUrl(customUrl);
    } catch (error) {
      console.error('Test failed:', error);
      customResults = { error: (error as Error).message };
    } finally {
      isTestingCustom = false;
    }
  }

  function getStatusColor(results: any): string {
    if (!results) return 'bg-gray-100';
    if (results.error) return 'bg-red-100 text-red-800';
    const hasSuccess = results.fetchResults?.some((r: any) => r.success);
    return hasSuccess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }

  function getStatusText(results: any): string {
    if (!results) return 'Not tested';
    if (results.error) return 'Error occurred';
    const hasSuccess = results.fetchResults?.some((r: any) => r.success);
    return hasSuccess ? 'Working' : 'Failed';
  }

  onMount(() => {
    console.log('🔧 Google Sheets Debug Page loaded');
    console.log('📋 URLs to test:', { tasteTestUrl, preferenceUrl });
  });
</script>

<div class="container mx-auto p-4 space-y-6 max-w-4xl">
  <div class="text-center">
    <h1 class="text-3xl font-bold mb-2">Google Sheets Debug Tool</h1>
    <p class="text-gray-600">Test and debug your Google Sheets CSV URLs</p>
  </div>

  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <p class="font-semibold">Instructions:</p>
    <ul class="list-disc list-inside mt-2 space-y-1 text-sm">
      <li>Open your browser's Developer Console (F12) to see detailed logs</li>
      <li>Test each URL below to diagnose connectivity issues</li>
      <li>Check the results cards for detailed information</li>
    </ul>
  </div>

  <!-- Taste Test URL Testing -->
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h2 class="text-xl font-semibold">Taste Test Data URL</h2>
    </div>
    
    <div class="p-4 space-y-4">
      <div class="bg-gray-100 p-3 rounded font-mono text-xs break-all">
        {tasteTestUrl}
      </div>
      
      <div class="flex items-center gap-4">
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onclick={testTasteTestUrl}
          disabled={isTestingTasteTest}
        >
          {isTestingTasteTest ? 'Testing...' : 'Test URL'}
        </button>
        
        {#if isTestingTasteTest}
          <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        {/if}
        
        <div class="px-3 py-1 rounded text-sm {getStatusColor(tasteTestResults)}">
          {getStatusText(tasteTestResults)}
        </div>
      </div>

      {#if tasteTestResults}
        <div class="bg-gray-50 p-4 rounded">
          <h3 class="font-semibold mb-2">Results:</h3>
          <pre class="text-xs overflow-auto max-h-64 bg-white p-3 rounded border">
{JSON.stringify(tasteTestResults, null, 2)}
          </pre>
        </div>
      {/if}
    </div>
  </div>

  <!-- Preference Survey URL Testing -->
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h2 class="text-xl font-semibold">Preference Survey Data URL</h2>
    </div>
    
    <div class="p-4 space-y-4">
      <div class="bg-gray-100 p-3 rounded font-mono text-xs break-all">
        {preferenceUrl}
      </div>
      
      <div class="flex items-center gap-4">
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onclick={testPreferenceUrl}
          disabled={isTestingPreference}
        >
          {isTestingPreference ? 'Testing...' : 'Test URL'}
        </button>
        
        {#if isTestingPreference}
          <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        {/if}
        
        <div class="px-3 py-1 rounded text-sm {getStatusColor(preferenceResults)}">
          {getStatusText(preferenceResults)}
        </div>
      </div>

      {#if preferenceResults}
        <div class="bg-gray-50 p-4 rounded">
          <h3 class="font-semibold mb-2">Results:</h3>
          <pre class="text-xs overflow-auto max-h-64 bg-white p-3 rounded border">
{JSON.stringify(preferenceResults, null, 2)}
          </pre>
        </div>
      {/if}
    </div>
  </div>

  <!-- Custom URL Testing -->
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h2 class="text-xl font-semibold">Test Custom URL</h2>
    </div>
    
    <div class="p-4 space-y-4">
      <input
        type="url"
        placeholder="Enter Google Sheets CSV URL to test..."
        bind:value={customUrl}
        class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />
      
      <div class="flex items-center gap-4">
        <button 
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          onclick={testCustomUrl}
          disabled={isTestingCustom || !customUrl.trim()}
        >
          {isTestingCustom ? 'Testing...' : 'Test Custom URL'}
        </button>
        
        {#if isTestingCustom}
          <div class="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        {/if}
        
        {#if customResults}
          <div class="px-3 py-1 rounded text-sm {getStatusColor(customResults)}">
            {getStatusText(customResults)}
          </div>
        {/if}
      </div>

      {#if customResults}
        <div class="bg-gray-50 p-4 rounded">
          <h3 class="font-semibold mb-2">Results:</h3>
          <pre class="text-xs overflow-auto max-h-64 bg-white p-3 rounded border">
{JSON.stringify(customResults, null, 2)}
          </pre>
        </div>
      {/if}
    </div>
  </div>

  <!-- Quick Fixes Section -->
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h2 class="text-xl font-semibold">Common Solutions</h2>
    </div>
    
    <div class="p-4 space-y-3">
      <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
        <strong>HTTP 400 Error:</strong> Usually indicates the URL format is incorrect or the sheet isn't published properly.
      </div>
      
      <div class="bg-blue-50 border border-blue-200 rounded p-3">
        <strong>CORS Errors:</strong> Try using a proxy or ensure the sheet is publicly accessible.
      </div>
      
      <div class="bg-green-50 border border-green-200 rounded p-3">
        <strong>How to fix:</strong>
        <ol class="list-decimal list-inside mt-2 space-y-1">
          <li>Go to your Google Sheet</li>
          <li>File → Share → Publish to the web</li>
          <li>Select "Entire Document" or specific sheet</li>
          <li>Choose "Comma-separated values (.csv)" format</li>
          <li>Click "Publish" and copy the URL</li>
          <li>Make sure the URL ends with <code class="bg-gray-200 px-1 rounded">&output=csv</code></li>
        </ol>
      </div>
    </div>
  </div>

  <!-- Browser Test -->
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h2 class="text-xl font-semibold">Quick Browser Test</h2>
    </div>
    
    <div class="p-4 space-y-3">
      <p>Click these links to test if the URLs work in your browser:</p>
      <div class="flex flex-wrap gap-2">
        <button 
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          onclick={() => window.open(tasteTestUrl, '_blank')}
        >
          Open Taste Test URL
        </button>
        <button 
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          onclick={() => window.open(preferenceUrl, '_blank')}
        >
          Open Preference URL
        </button>
      </div>
    </div>
  </div>
</div> 