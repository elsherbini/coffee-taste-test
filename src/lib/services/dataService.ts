/**
 * Data service for fetching and processing coffee survey and taste test data
 * Updated to handle the actual CSV structure with UUID, Which Coffee, Aroma, Flavor, etc.
 */

import { browser } from '$app/environment';

// Configuration for Google Sheets published URL
const GOOGLE_SHEETS_CONFIG = {
  // Taste test data URL - TODO: Replace with your actual published Google Sheets URL
  // Get this from: File → Share → Publish to the web → CSV format
  tasteTestUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSv3n8ZAHU4alXKFZ3n00LCePq_lN2Qo28KwONiyu7Jo-WUKV6uBOBvlSNpbaBOOJkZeHzqfZBgswFx/pub?output=csv',
  
  // Preference survey data URL - converted from pubhtml to CSV format
  preferenceUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrlMfnRHT16l37W1V_IOAy2SJlJkq-fZIRo8JnIw052IRWeM2cG4xC1GF-rgLgbCXvgziy1bun_oC7/pub?output=csv',
  
  requestTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  enableDebug: true // Enable debug logging
};

// Debug utility function
function debugLog(message: string, data?: any) {
  if (GOOGLE_SHEETS_CONFIG.enableDebug) {
    console.log(`[DataService Debug] ${message}`, data || '');
  }
}

// URL diagnostic function to help debug Google Sheets URL issues
function validateAndFixGoogleSheetsUrl(url: string): { originalUrl: string; alternatives: string[]; isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const alternatives: string[] = [];
  
  // Check if URL is a valid Google Sheets published URL
  const isGoogleSheetsUrl = url.includes('docs.google.com/spreadsheets');
  const hasPublishedFormat = url.includes('/pub?');
  const hasCSVOutput = url.includes('output=csv');
  
  if (!isGoogleSheetsUrl) {
    issues.push('URL is not a Google Sheets URL');
  }
  
  if (!hasPublishedFormat) {
    issues.push('URL is not in published format (/pub?)');
  }
  
  if (!hasCSVOutput) {
    issues.push('URL does not specify CSV output format');
  }
  
  // Extract sheet ID if possible
  const sheetIdMatch = url.match(/\/d\/e\/([A-Za-z0-9_-]+)/);
  const sheetId = sheetIdMatch ? sheetIdMatch[1] : null;
  
  if (sheetId) {
    // Generate alternative URL formats
    alternatives.push(
      `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv`,
      `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=0&single=true&output=csv`,
      `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=0&output=csv`
    );
  }
  
  return {
    originalUrl: url,
    alternatives,
    isValid: isGoogleSheetsUrl && hasPublishedFormat && hasCSVOutput,
    issues
  };
}

// Error handling
class DataServiceError extends Error {
  constructor(message: string, public type: string, public originalError?: Error) {
    super(message);
    this.name = 'DataServiceError';
  }
}

const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR', 
  PARSE_ERROR: 'PARSE_ERROR',
  NO_DATA_ERROR: 'NO_DATA_ERROR'
} as const;

// Type definitions matching the actual CSV structure
interface SurveyResponse {
  uuid: string;  // Changed from userId to match CSV
  timestamp: string;
  [key: string]: any;
}

interface TasteTestResponse extends SurveyResponse {
  whichCoffee: string;  // Coffee identifier (A, B, C, etc.)
  aroma: number;
  flavor: number;
  acidity: string;      // Categorical: "Pleasant Acidity", "No acidity", "Too Acidic"
  body: string;         // Categorical: "Heavy", "Light", "Medium"
  aftertaste: number;
  tastingNotes: string; // Comma-separated values
  overallEnjoyment: number;
}

interface PreferenceResponse extends SurveyResponse {
  preference: string; // Coffee/Tea/Both from "Coffee Person" field
  // Additional fields from preference survey
  coffeesPerDay?: number;
  teasPerDay?: number;
  blackCoffee?: string; // Yes/No
  coffeeTypes?: string; // Comma-separated list
  roastPreference?: string; // Light/Medium/Dark
  whyDrinkCoffee?: string;
  otherCaffeinatedDrinks?: number;
  frequency?: string; // Daily, Once a week, etc.
  whyNotMoreCoffee?: string;
  decafCoffee?: string; // Yes/No
  coffeeAdditions?: string;
}

interface SurveyData {
  preferenceData: PreferenceResponse[];
  tasteTestData: TasteTestResponse[];
  uniqueCoffees: string[];
  hasError: boolean;
  errorMessage: string | null;
  dataQuality?: {
    totalResponses: number;
    completionRate: number;
  };
}

interface UserSurveyStatus {
  hasUserId: boolean;
  hasPreferenceResponse: boolean;
  hasTasteTestResponse: boolean;
  canViewPersonalizedResults: boolean;
  userId?: string;
}

interface PersonalizedData extends UserSurveyStatus {
  preferenceResponse: PreferenceResponse | null;
  tasteTestResponse: TasteTestResponse[];
  allData: SurveyData;
}

interface TransformedData {
  brewingMethod: { chartData: any[]; totalResponses: number; userPercentile: number | null };
  coffeePreference: { favoriteChartData: any[]; worstChartData: any[]; userFavoriteAgreement: number | null; userWorstAgreement: number | null };
  tasteTest: { coffeeStats: any; sortedCoffees: any[]; overallStats: any };
  tastingNotes: { topNotes: any[]; totalNotesCount: number; userNotesMatches: any[] };
  comparisonStatements: any[];
  metadata: { 
    totalPreferenceResponses: number; 
    totalTasteTestResponses: number; 
    uniqueCoffeesCount: number; 
    hasPersonalizedData: boolean 
  };
}

// Updated mock data to match actual CSV structure
const MOCK_SURVEY_DATA: SurveyData = {
  preferenceData: [
    { uuid: 'jq9hqap3f7g', preference: 'Coffee', timestamp: '6/2/2025 12:43:15' },
    { uuid: 'q7oa8cg3vws', preference: 'Tea', timestamp: '6/2/2025 12:43:16' }
  ],
  tasteTestData: [
    { 
      uuid: 'jq9hqap3f7g', 
      timestamp: '6/2/2025 12:43:15',
      whichCoffee: 'D',
      aroma: 2.5,
      flavor: 2,
      acidity: 'Pleasant Acidity',
      body: 'Heavy',
      aftertaste: 2,
      tastingNotes: 'Woody',
      overallEnjoyment: 2
    },
    { 
      uuid: 'q7oa8cg3vws', 
      timestamp: '6/2/2025 12:43:16',
      whichCoffee: 'E',
      aroma: 4,
      flavor: 4.5,
      acidity: 'No acidity',
      body: 'Light',
      aftertaste: 4.5,
      tastingNotes: 'Floral',
      overallEnjoyment: 4.5
    },
    { 
      uuid: 'q7oa8cg3vws', 
      timestamp: '6/2/2025 12:43:16',
      whichCoffee: 'F',
      aroma: 4.5,
      flavor: 4.5,
      acidity: 'Pleasant Acidity',
      body: 'Medium',
      aftertaste: 5,
      tastingNotes: 'Earthy,Berry,Floral',
      overallEnjoyment: 4.5
    }
  ],
  uniqueCoffees: ['A', 'D', 'E', 'F', 'G', 'H'],
  hasError: false,
  errorMessage: null
};

// Helper function to get or generate user ID (now using UUID format)
function getUserId(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  
  let userId = localStorage.getItem('coffee-survey-user-id');
  if (!userId) {
    // Generate UUID-like ID to match CSV format
    userId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('coffee-survey-user-id', userId);
  }
  return userId;
}

/**
 * Fetches CSV data from published Google Sheets URL with multiple strategies
 * @param url - Complete Google Sheets CSV URL
 * @param retryCount - Current retry attempt
 * @returns Raw CSV data string
 */
async function fetchGoogleSheetData(url: string, retryCount: number = 0): Promise<string> {
  debugLog(`Attempting to fetch from Google Sheets (attempt ${retryCount + 1}/${GOOGLE_SHEETS_CONFIG.maxRetries + 1})`, { url });
  
  // Validate and get alternative URLs
  const urlDiagnostic = validateAndFixGoogleSheetsUrl(url);
  debugLog('URL Diagnostic', urlDiagnostic);
  
  if (!urlDiagnostic.isValid) {
    debugLog('URL validation issues detected', urlDiagnostic.issues);
  }
  
  // Build list of URLs to try (original + alternatives)
  const urlsToTry = [url, ...urlDiagnostic.alternatives].filter((testUrl, index, array) => 
    array.indexOf(testUrl) === index // Remove duplicates
  );
  
  debugLog(`Will try ${urlsToTry.length} different URL formats`, urlsToTry);
  
  // Define strategy configurations with proper typing
  interface FetchStrategy {
    name: string;
    config: RequestInit;
  }
  
  const strategies: FetchStrategy[] = [
    {
      name: 'Standard Fetch',
      config: {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      }
    },
    {
      name: 'No-Cache Fetch',  
      config: {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    },
    {
      name: 'Minimal Headers',
      config: {
        method: 'GET'
      }
    },
    {
      name: 'CORS Mode',
      config: {
        method: 'GET',
        mode: 'cors' as RequestMode,
        headers: {
          'Accept': 'text/csv,text/plain,*/*'
        }
      }
    }
  ];
  
  // Try each URL with each strategy
  for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
    const currentUrl = urlsToTry[urlIndex];
    debugLog(`Trying URL ${urlIndex + 1}/${urlsToTry.length}`, currentUrl);
    
    for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
      if (retryCount > 0 && strategyIndex === 0 && urlIndex === 0) {
        // Skip the first strategy on retries since it already failed
        continue;
      }
      
      const strategy = strategies[strategyIndex];
      debugLog(`Using strategy: ${strategy.name}`);
      
      try {
        // Create fetch promise with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GOOGLE_SHEETS_CONFIG.requestTimeout);
        
        const response = await fetch(currentUrl, {
          ...strategy.config,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        debugLog(`Response received`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          url: response.url
        });
        
        if (!response.ok) {
          debugLog(`HTTP Error: ${response.status} ${response.statusText}`);
          
          // Try next strategy for certain error codes
          if (response.status === 400 || response.status === 403 || response.status === 405) {
            if (strategyIndex < strategies.length - 1) {
              debugLog(`Trying next strategy due to HTTP ${response.status}`);
              continue;
            } else if (urlIndex < urlsToTry.length - 1) {
              debugLog(`Trying next URL due to HTTP ${response.status}`);
              break; // Break to next URL
            }
          }
          
          throw new DataServiceError(
            `HTTP ${response.status}: ${response.statusText}`,
            ERROR_TYPES.NETWORK_ERROR
          );
        }
        
        const csvData = await response.text();
        debugLog(`CSV data received`, {
          length: csvData.length,
          firstChars: csvData.substring(0, 100),
          lineCount: csvData.split('\n').length
        });
        
        // Validate that we received actual data
        if (!csvData || csvData.trim().length === 0) {
          throw new DataServiceError(
            'Received empty response from Google Sheets',
            ERROR_TYPES.NO_DATA_ERROR
          );
        }
        
        // Basic CSV format validation
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) { // Need header + at least 1 data row
          throw new DataServiceError(
            `Insufficient data received: only ${lines.length} lines`,
            ERROR_TYPES.NO_DATA_ERROR
          );
        }
        
        debugLog(`Successfully fetched data using URL ${urlIndex + 1} with strategy: ${strategy.name}`);
        return csvData;
        
      } catch (error) {
        debugLog(`Strategy ${strategy.name} failed for URL ${urlIndex + 1}:`, error);
        
        // Handle AbortError (timeout)
        if ((error as Error).name === 'AbortError') {
          const timeoutError = new DataServiceError(
            `Request timed out after ${GOOGLE_SHEETS_CONFIG.requestTimeout}ms`,
            ERROR_TYPES.TIMEOUT_ERROR,
            error as Error
          );
          
          // Try next strategy on timeout
          if (strategyIndex < strategies.length - 1) {
            debugLog('Trying next strategy due to timeout');
            continue;
          } else if (urlIndex < urlsToTry.length - 1) {
            debugLog('Trying next URL due to timeout');
            break;
          }
          throw timeoutError;
        }
        
        // For other errors, try next strategy if available
        if (strategyIndex < strategies.length - 1) {
          debugLog('Trying next strategy due to error');
          continue;
        } else if (urlIndex < urlsToTry.length - 1) {
          debugLog('Trying next URL due to error');
          break;
        }
        
        // If this is the last strategy and last URL, determine if we should retry
        const shouldRetry = retryCount < GOOGLE_SHEETS_CONFIG.maxRetries;
        
        if (shouldRetry) {
          debugLog(`All URLs and strategies failed, retrying in ${GOOGLE_SHEETS_CONFIG.retryDelay * (retryCount + 1)}ms...`);
          await new Promise(resolve => setTimeout(resolve, GOOGLE_SHEETS_CONFIG.retryDelay * (retryCount + 1)));
          return fetchGoogleSheetData(url, retryCount + 1);
        }
        
        // All retries exhausted
        if (error instanceof DataServiceError) {
          throw error;
        }
        
        throw new DataServiceError(
          `Failed to fetch data after trying all URLs and strategies: ${(error as Error).message}`,
          ERROR_TYPES.NETWORK_ERROR,
          error as Error
        );
      }
    }
  }
  
  // This should never be reached, but just in case
  throw new DataServiceError(
    'All fetch URLs and strategies failed',
    ERROR_TYPES.NETWORK_ERROR
  );
}

/**
 * Parses preference survey CSV data to match the actual structure
 * @param csvData - Raw CSV string from preference survey
 * @returns Parsed preference survey data
 */
function parsePreferenceSurveyData(csvData: string): PreferenceResponse[] {
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse CSV with proper handling for quoted fields and commas
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };
    
    // Expected headers: Timestamp, UUID, Coffees Per Day, Teas Per Day, Black Coffee, Coffee Types, Roast Preference, etc.
    const headers = parseCSVLine(lines[0]);
    const data: PreferenceResponse[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 3) { // Minimum required fields
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        
        // Map to our expected format
        const preferenceRow: PreferenceResponse = {
          uuid: row['UUID'] || '',
          timestamp: row['Timestamp'] || '',
          preference: row['Coffee Person'] || '', // Maps to Coffee/Tea/Both
          // Additional fields specific to preference survey
          coffeesPerDay: parseInt(row['Coffees Per Day']) || 0,
          teasPerDay: parseInt(row['Teas Per Day']) || 0,
          blackCoffee: row['Black Coffee'] || '',
          coffeeTypes: row['Coffee Types'] || '',
          roastPreference: row['Roast Preference'] || '',
          whyDrinkCoffee: row['Why do you drink coffee?'] || '',
          otherCaffeinatedDrinks: parseInt(row['Other Caffeinated Drinks']) || 0,
          frequency: row['Frequency'] || '',
          whyNotMoreCoffee: row["Why don't you drink more coffee?"] || '',
          decafCoffee: row['Decaf Coffee'] || '',
          coffeeAdditions: row['Coffee Additions'] || ''
        };
        
        // Validate the row has minimum required data
        if (preferenceRow.uuid && preferenceRow.preference) {
          data.push(preferenceRow);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing preference survey CSV data:', error);
    throw new DataServiceError(
      'Failed to parse preference survey CSV data',
      ERROR_TYPES.PARSE_ERROR,
      error as Error
    );
  }
}

/**
 * Returns mock data for testing and fallback
 */
function getMockData(): SurveyData {
  return {
    ...MOCK_SURVEY_DATA,
    dataQuality: {
      totalResponses: MOCK_SURVEY_DATA.preferenceData.length + MOCK_SURVEY_DATA.tasteTestData.length,
      completionRate: 0.8
    }
  };
}

/**
 * Parses CSV data to match the actual structure
 * @param csvData - Raw CSV string
 * @returns Parsed taste test data
 */
function parseActualCSVData(csvData: string): TasteTestResponse[] {
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse CSV with proper handling for quoted fields and commas
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };
    
    // Expected headers: Timestamp, UUID, Which Coffee, Aroma, Flavor, Acidity, Body, Aftertaste, Tasting Notes, Overall Enjoyment
    const headers = parseCSVLine(lines[0]);
    const data: TasteTestResponse[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        
        // Map to our expected format
        const tasteTestRow: TasteTestResponse = {
          uuid: row['UUID'] || '',
          timestamp: row['Timestamp'] || '',
          whichCoffee: row['Which Coffee'] || '',
          aroma: parseFloat(row['Aroma']) || 0,
          flavor: parseFloat(row['Flavor']) || 0,
          acidity: row['Acidity'] || '',
          body: row['Body'] || '',
          aftertaste: parseFloat(row['Aftertaste']) || 0,
          tastingNotes: row['Tasting Notes'] || '',
          overallEnjoyment: parseFloat(row['Overall Enjoyment']) || 0
        };
        
        // Validate the row has minimum required data
        if (tasteTestRow.uuid && tasteTestRow.whichCoffee && tasteTestRow.overallEnjoyment >= 0.5) {
          data.push(tasteTestRow);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing CSV data:', error);
    throw new DataServiceError(
      'Failed to parse CSV data',
      ERROR_TYPES.PARSE_ERROR,
      error as Error
    );
  }
}

/**
 * Simulates fetching all survey data
 * @param enableFallback - Whether to return fallback data on error
 * @returns Object containing survey data
 */
export async function fetchAllSurveyData(enableFallback: boolean = true): Promise<SurveyData> {
  try {
    // Check if we have a valid Google Sheets URL configured
    if (GOOGLE_SHEETS_CONFIG.tasteTestUrl.includes('YOUR_SHEET_ID_HERE')) {
      console.warn('Google Sheets URL not configured, using mock data');
      return getMockData();
    }
    
    // Fetch taste test data from Google Sheets
    const tasteTestCsvData = await fetchGoogleSheetData(GOOGLE_SHEETS_CONFIG.tasteTestUrl);
    const tasteTestData = parseActualCSVData(tasteTestCsvData);
    
    // Fetch preference survey data from Google Sheets
    const preferenceCsvData = await fetchGoogleSheetData(GOOGLE_SHEETS_CONFIG.preferenceUrl);
    const preferenceData = parsePreferenceSurveyData(preferenceCsvData);
    
    // Extract unique coffees
    const uniqueCoffees = [...new Set(tasteTestData.map(response => response.whichCoffee))];
    
    const surveyData = {
      preferenceData: preferenceData,
      tasteTestData: tasteTestData,
      uniqueCoffees: uniqueCoffees,
      hasError: false,
      errorMessage: null,
      dataQuality: {
        totalResponses: preferenceData.length + tasteTestData.length,
        completionRate: (preferenceData.length > 0 && tasteTestData.length > 0) ? 1.0 : 0.5
      }
    };

    // Task 3.2: Console logging of survey results after fetching
    console.group('📊 Survey Results Fetched from Google Sheets');
    console.log('📋 Preference Survey Data:', {
      count: preferenceData.length,
      responses: preferenceData
    });
    console.log('☕ Taste Test Data:', {
      count: tasteTestData.length,
      responses: tasteTestData
    });
    console.log('🎯 Unique Coffees:', uniqueCoffees);
    console.log('📈 Data Quality:', surveyData.dataQuality);
    console.log('🔍 Complete Survey Data Structure:', surveyData);
    console.groupEnd();
    
    return surveyData;
  } catch (error) {
    console.error('Error fetching survey data:', error);
    
    if (enableFallback) {
      console.log('Using fallback mock data due to error');
      return getMockData();
    }
    
    throw error;
  }
}

/**
 * Checks user's survey completion status
 * @param surveyData - All survey data
 * @returns Object indicating which surveys the user has completed
 */
export function getUserSurveyStatus(surveyData: SurveyData): UserSurveyStatus {
  try {
    const userId = getUserId();
    if (!userId) {
      return {
        hasUserId: false,
        hasPreferenceResponse: false,
        hasTasteTestResponse: false,
        canViewPersonalizedResults: false
      };
    }

    // Check if user has preference response (looking for uuid field)
    const hasPreferenceResponse = surveyData.preferenceData.some(
      (response: PreferenceResponse) => response.uuid === userId
    );
    
    // Check if user has taste test response (looking for uuid field)
    const hasTasteTestResponse = surveyData.tasteTestData.some(
      (response: TasteTestResponse) => response.uuid === userId
    );

    return {
      hasUserId: true,
      hasPreferenceResponse,
      hasTasteTestResponse,
      canViewPersonalizedResults: hasPreferenceResponse && hasTasteTestResponse,
      userId: userId
    };
  } catch (error) {
    console.error('Error checking user survey status:', error);
    return {
      hasUserId: false,
      hasPreferenceResponse: false,
      hasTasteTestResponse: false,
      canViewPersonalizedResults: false
    };
  }
}

/**
 * Gets personalized survey data for the current user
 * @param surveyData - All survey data
 * @returns Personalized data object
 */
export function getPersonalizedSurveyData(surveyData: SurveyData): PersonalizedData {
  try {
    const userStatus = getUserSurveyStatus(surveyData);
    
    // Get user's preference response (using uuid field)
    const preferenceResponse = surveyData.preferenceData.find(
      (response: PreferenceResponse) => response.uuid === userStatus.userId
    ) || null;
    
    // Get user's taste test responses (using uuid field)
    const tasteTestResponse = surveyData.tasteTestData.filter(
      (response: TasteTestResponse) => response.uuid === userStatus.userId
    );

    return {
      ...userStatus,
      preferenceResponse,
      tasteTestResponse,
      allData: surveyData
    };
  } catch (error) {
    console.error('Error getting personalized survey data:', error);
    return {
      hasUserId: false,
      hasPreferenceResponse: false,
      hasTasteTestResponse: false,
      canViewPersonalizedResults: false,
      preferenceResponse: null,
      tasteTestResponse: [],
      allData: surveyData
    };
  }
}

/**
 * Transforms data for visualization with actual CSV structure support
 * @param surveyData - Complete survey data
 * @param personalizedData - User's personalized data
 * @returns Transformed data for visualizations
 */
export function transformAllDataForVisualization(surveyData: SurveyData, personalizedData: PersonalizedData): TransformedData {
  try {
    // Extract unique coffees from the actual data
    const uniqueCoffees = [...new Set(surveyData.tasteTestData.map(response => response.whichCoffee))];
    
    // Create coffee statistics
    const coffeeStats: any = {};
    uniqueCoffees.forEach(coffee => {
      const coffeeRatings = surveyData.tasteTestData
        .filter(response => response.whichCoffee === coffee)
        .map(response => response.overallEnjoyment);
      
      coffeeStats[coffee] = {
        name: `Coffee ${coffee}`,
        ratings: coffeeRatings,
        averageRating: coffeeRatings.length > 0 ? 
          coffeeRatings.reduce((sum, rating) => sum + rating, 0) / coffeeRatings.length : 0,
        totalRatings: coffeeRatings.length,
        userRating: personalizedData.tasteTestResponse
          .find(response => response.whichCoffee === coffee)?.overallEnjoyment || null
      };
    });

    // Sort coffees by average rating
    const sortedCoffees = Object.entries(coffeeStats)
      .map(([id, stats]: [string, any]) => ({ id, ...(stats as any) }))
      .sort((a: any, b: any) => b.averageRating - a.averageRating);

    return {
      brewingMethod: { chartData: [], totalResponses: 0, userPercentile: null },
      coffeePreference: { favoriteChartData: [], worstChartData: [], userFavoriteAgreement: null, userWorstAgreement: null },
      tasteTest: { 
        coffeeStats, 
        sortedCoffees, 
        overallStats: {
          totalResponses: surveyData.tasteTestData.length,
          averageRating: surveyData.tasteTestData.length > 0 ?
            surveyData.tasteTestData.reduce((sum, response) => sum + response.overallEnjoyment, 0) / surveyData.tasteTestData.length : 0
        }
      },
      tastingNotes: { topNotes: [], totalNotesCount: 0, userNotesMatches: [] },
      comparisonStatements: [],
      metadata: { 
        totalPreferenceResponses: surveyData.preferenceData?.length || 0, 
        totalTasteTestResponses: surveyData.tasteTestData?.length || 0, 
        uniqueCoffeesCount: uniqueCoffees.length, 
        hasPersonalizedData: personalizedData.canViewPersonalizedResults || false 
      }
    };
  } catch (error) {
    console.error('Error transforming data for visualization:', error);
    return {
      brewingMethod: { chartData: [], totalResponses: 0, userPercentile: null },
      coffeePreference: { favoriteChartData: [], worstChartData: [], userFavoriteAgreement: null, userWorstAgreement: null },
      tasteTest: { coffeeStats: {}, sortedCoffees: [], overallStats: {} },
      tastingNotes: { topNotes: [], totalNotesCount: 0, userNotesMatches: [] },
      comparisonStatements: [],
      metadata: { totalPreferenceResponses: 0, totalTasteTestResponses: 0, uniqueCoffeesCount: 0, hasPersonalizedData: false }
    };
  }
}

// Export a diagnostic function for testing Google Sheets URLs

// Coffee data interface to match the CSV structure from task 1.1
export interface CoffeeData {
  coffee_id: string;
  coffee_name: string;
  coffee_geography: string;
  process: string;
  brew_method: string;
  price: string; // per/cup
}

// Coffee quality estimation data interface for task 2.1
export interface CoffeeQualityData {
  coffee_id: string; // Which Coffee field
  mean_quality: number; // mean_Q
  lower_confidence: number; // p13
  upper_confidence: number;
  c_value: string; // C column (unknown purpose, stored as string)
}

// Participant harshness and discrimination CSV URL from task 3.1
const PARTICIPANT_HARSHNESS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSv3n8ZAHU4alXKFZ3n00LCePq_lN2Qo28KwONiyu7Jo-WUKV6uBOBvlSNpbaBOOJkZeHzqfZBgswFx/pub?gid=1783973184&single=true&output=csv';

export interface ParticipantHarshnessData {
  uuid: string; // UUID column - matches userID in local storage
  taster_id: string; // taster_id column
  mean_harshness: number; // mean_harshness
  p13_harshness: number; // p13_harshness (lower confidence interval)
  p87_harshness: number; // p87_harshness (upper confidence interval)
  mean_discrim: number; // mean_discrim (discrimination)
  p13_discrim: number; // p13_discrim (lower confidence interval)
  p87_discrim: number; // p87_discrim (upper confidence interval)
}

// Taste test statistics for each coffee
export interface CoffeeTasteStats {
  coffee_id: string;
  averageAroma: number;
  averageFlavor: number;
  averageAftertaste: number;
  averageOverallEnjoyment: number;
  totalRatings: number;
  mostCommonBody: {
    option: string;
    percentage: number;
    count: number;
  } | null;
  mostCommonAcidity: {
    option: string;
    percentage: number;
    count: number;
  } | null;
}

// User's personal preferences for coffee rankings
export interface UserCoffeePreferences {
  userId: string | null;
  favoriteCoffees: string[]; // Coffee IDs that user rated highest
  leastFavoriteCoffees: string[]; // Coffee IDs that user rated lowest
  userRatings: Record<string, number>; // Map of coffee_id to user's rating
}

/**
 * Determines which coffees the current user liked most and least
 * @param tasteTestData - Array of taste test responses
 * @returns User's coffee preferences with favorite and least favorite coffees
 */
export function getUserCoffeePreferences(tasteTestData: TasteTestResponse[]): UserCoffeePreferences {
  try {
    const userId = getUserId();
    
    if (!userId) {
      return {
        userId: null,
        favoriteCoffees: [],
        leastFavoriteCoffees: [],
        userRatings: {}
      };
    }

    // Get user's taste test responses
    const userResponses = tasteTestData.filter(response => response.uuid === userId);
    
    if (userResponses.length === 0) {
      return {
        userId,
        favoriteCoffees: [],
        leastFavoriteCoffees: [],
        userRatings: {}
      };
    }

    // Create map of coffee_id to user's overall enjoyment rating
    const userRatings: Record<string, number> = {};
    userResponses.forEach(response => {
      userRatings[response.whichCoffee] = response.overallEnjoyment;
    });

    // Find highest and lowest ratings
    const ratings = Object.values(userRatings);
    const maxRating = Math.max(...ratings);
    const minRating = Math.min(...ratings);

    // Find all coffees with highest rating (handles ties)
    const favoriteCoffees = Object.entries(userRatings)
      .filter(([_, rating]) => rating === maxRating)
      .map(([coffeeId, _]) => coffeeId);

    // Find all coffees with lowest rating (handles ties)
    const leastFavoriteCoffees = Object.entries(userRatings)
      .filter(([_, rating]) => rating === minRating)
      .map(([coffeeId, _]) => coffeeId);

    // If there's only one coffee rated, don't mark it as both favorite and least favorite
    if (ratings.length === 1) {
      return {
        userId,
        favoriteCoffees: [],
        leastFavoriteCoffees: [],
        userRatings
      };
    }

    // If all ratings are the same, don't mark any as favorite or least favorite
    if (maxRating === minRating) {
      return {
        userId,
        favoriteCoffees: [],
        leastFavoriteCoffees: [],
        userRatings
      };
    }

    debugLog(`User ${userId} preferences:`, {
      favoriteCoffees,
      leastFavoriteCoffees,
      maxRating,
      minRating,
      totalRated: ratings.length
    });

    return {
      userId,
      favoriteCoffees,
      leastFavoriteCoffees,
      userRatings
    };
  } catch (error) {
    console.error('Error determining user coffee preferences:', error);
    return {
      userId: null,
      favoriteCoffees: [],
      leastFavoriteCoffees: [],
      userRatings: {}
    };
  }
}

/**
 * Calculates taste test statistics for each coffee
 * @param tasteTestData - Array of taste test responses
 * @returns Array of coffee taste statistics
 */
export function calculateCoffeeTasteStats(tasteTestData: TasteTestResponse[]): CoffeeTasteStats[] {
  try {
    // Group responses by coffee
    const coffeeGroups = tasteTestData.reduce((groups, response) => {
      const coffeeId = response.whichCoffee;
      if (!groups[coffeeId]) {
        groups[coffeeId] = [];
      }
      groups[coffeeId].push(response);
      return groups;
    }, {} as Record<string, TasteTestResponse[]>);

    // Calculate statistics for each coffee
    const stats: CoffeeTasteStats[] = [];
    
    Object.entries(coffeeGroups).forEach(([coffeeId, responses]) => {
      if (responses.length > 0) {
        const averageAroma = responses.reduce((sum, r) => sum + r.aroma, 0) / responses.length;
        const averageFlavor = responses.reduce((sum, r) => sum + r.flavor, 0) / responses.length;
        const averageAftertaste = responses.reduce((sum, r) => sum + r.aftertaste, 0) / responses.length;
        const averageOverallEnjoyment = responses.reduce((sum, r) => sum + r.overallEnjoyment, 0) / responses.length;

        // Calculate most common body
        const bodyCounts = responses.reduce((counts, response) => {
          const body = response.body?.trim();
          if (body) {
            counts[body] = (counts[body] || 0) + 1;
          }
          return counts;
        }, {} as Record<string, number>);

        const mostCommonBody = Object.keys(bodyCounts).length > 0 
          ? Object.entries(bodyCounts).reduce((prev, [option, count]) => 
              count > prev.count ? { option, count, percentage: (count / responses.length) * 100 } : prev,
              { option: '', count: 0, percentage: 0 }
            )
          : null;

        // Calculate most common acidity
        const acidityCounts = responses.reduce((counts, response) => {
          const acidity = response.acidity?.trim();
          if (acidity) {
            counts[acidity] = (counts[acidity] || 0) + 1;
          }
          return counts;
        }, {} as Record<string, number>);

        const mostCommonAcidity = Object.keys(acidityCounts).length > 0
          ? Object.entries(acidityCounts).reduce((prev, [option, count]) => 
              count > prev.count ? { option, count, percentage: (count / responses.length) * 100 } : prev,
              { option: '', count: 0, percentage: 0 }
            )
          : null;

        stats.push({
          coffee_id: coffeeId,
          averageAroma,
          averageFlavor,
          averageAftertaste,
          averageOverallEnjoyment,
          totalRatings: responses.length,
          mostCommonBody: mostCommonBody?.option ? mostCommonBody : null,
          mostCommonAcidity: mostCommonAcidity?.option ? mostCommonAcidity : null
        });
      }
    });

    // Sort by coffee_id for consistent ordering
    stats.sort((a, b) => a.coffee_id.localeCompare(b.coffee_id));

    debugLog(`Calculated taste stats for ${stats.length} coffees`);
    return stats;
  } catch (error) {
    console.error('Error calculating coffee taste stats:', error);
    return [];
  }
}

// Local storage key for coffee data
const COFFEE_DATA_STORAGE_KEY = 'coffee_taste_test_coffee_data';
const COFFEE_DATA_EXPIRY_KEY = 'coffee_taste_test_coffee_data_expiry';

// Coffee data CSV URL from task 1.1
const COFFEE_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSv3n8ZAHU4alXKFZ3n00LCePq_lN2Qo28KwONiyu7Jo-WUKV6uBOBvlSNpbaBOOJkZeHzqfZBgswFx/pub?gid=81480195&single=true&output=csv';

// Coffee quality estimation CSV URL from task 2.1
const COFFEE_QUALITY_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSv3n8ZAHU4alXKFZ3n00LCePq_lN2Qo28KwONiyu7Jo-WUKV6uBOBvlSNpbaBOOJkZeHzqfZBgswFx/pub?gid=546056256&single=true&output=csv';

/**
 * Parses coffee data CSV into CoffeeData array
 * @param csvData - Raw CSV string
 * @returns Array of coffee data objects
 */
function parseCoffeeDataCSV(csvData: string): CoffeeData[] {
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Coffee data CSV has insufficient data');
    }

    // Skip header row and parse each line
    const coffeeData: CoffeeData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line, handling potential commas in quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const columns = parseCSVLine(line);
      if (columns.length >= 5) {
        coffeeData.push({
          coffee_id: columns[0] || '',
          coffee_name: columns[1] || '',
          coffee_geography: columns[2] || '',
          process: columns[3] || '',
          brew_method: columns[4] || '',
          price: columns[5] || ''
        });
      }
    }

    debugLog(`Parsed ${coffeeData.length} coffee entries from CSV`);
    return coffeeData;
  } catch (error) {
    console.error('Error parsing coffee data CSV:', error);
    throw new DataServiceError(
      'Failed to parse coffee data CSV',
      ERROR_TYPES.PARSE_ERROR,
      error as Error
    );
  }
}

/**
 * Checks if stored coffee data is still valid (not expired)
 * @returns boolean indicating if data exists and is valid
 */
function isCoffeeDataValid(): boolean {
  if (!browser) return false;
  
  try {
    const storedData = localStorage.getItem(COFFEE_DATA_STORAGE_KEY);
    const expiryTime = localStorage.getItem(COFFEE_DATA_EXPIRY_KEY);
    
    if (!storedData || !expiryTime) {
      return false;
    }
    
    const now = Date.now();
    const expiry = parseInt(expiryTime, 10);
    
    return now < expiry;
  } catch (error) {
    console.error('Error checking coffee data validity:', error);
    return false;
  }
}

/**
 * Stores coffee data in local storage with expiry
 * @param coffeeData - Array of coffee data to store
 */
function storeCoffeeData(coffeeData: CoffeeData[]): void {
  if (!browser) return;
  
  try {
    const now = Date.now();
    const expiry = now + (24 * 60 * 60 * 1000); // 24 hours from now
    
    localStorage.setItem(COFFEE_DATA_STORAGE_KEY, JSON.stringify(coffeeData));
    localStorage.setItem(COFFEE_DATA_EXPIRY_KEY, expiry.toString());
    
    debugLog(`Stored ${coffeeData.length} coffee entries in local storage`);
  } catch (error) {
    console.error('Error storing coffee data:', error);
  }
}

/**
 * Retrieves coffee data from local storage
 * @returns Array of coffee data or null if not found/invalid
 */
function getStoredCoffeeData(): CoffeeData[] | null {
  if (!browser || !isCoffeeDataValid()) {
    return null;
  }
  
  try {
    const storedData = localStorage.getItem(COFFEE_DATA_STORAGE_KEY);
    if (!storedData) {
      return null;
    }
    
    const coffeeData = JSON.parse(storedData) as CoffeeData[];
    debugLog(`Retrieved ${coffeeData.length} coffee entries from local storage`);
    return coffeeData;
  } catch (error) {
    console.error('Error retrieving stored coffee data:', error);
    return null;
  }
}

/**
 * Fetches coffee data, using local storage cache when available
 * @returns Promise<CoffeeData[]> - Array of coffee data
 */
export async function fetchCoffeeData(): Promise<CoffeeData[]> {
  debugLog('Fetching coffee data...');
  
  // First try to get from local storage
  const storedData = getStoredCoffeeData();
  if (storedData && storedData.length > 0) {
    debugLog('Using cached coffee data from local storage');
    return storedData;
  }
  
  // If not in storage or expired, fetch from URL
  try {
    debugLog('Fetching fresh coffee data from CSV URL');
    const csvData = await fetchGoogleSheetData(COFFEE_DATA_URL);
    const coffeeData = parseCoffeeDataCSV(csvData);
    
    // Store in local storage for future use
    storeCoffeeData(coffeeData);
    
    return coffeeData;
  } catch (error) {
    console.error('Error fetching coffee data:', error);
    throw new DataServiceError(
      'Failed to fetch coffee data',
      ERROR_TYPES.NETWORK_ERROR,
      error as Error
    );
  }
}

/**
 * Parses coffee quality estimation CSV into CoffeeQualityData array
 * @param csvData - Raw CSV string
 * @returns Array of coffee quality data objects
 */
function parseCoffeeQualityCSV(csvData: string): CoffeeQualityData[] {
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Coffee quality CSV has insufficient data');
    }

    // Skip header row and parse each line
    const qualityData: CoffeeQualityData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line, handling potential commas in quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const columns = parseCSVLine(line);
      // Expected columns: C, mean_Q, p13, p87, Which Coffee
      if (columns.length >= 5) {
        const cValue = columns[0] || '';
        const meanQ = parseFloat(columns[1]) || 0;
        const p13 = parseFloat(columns[2]) || 0;
        const p87 = parseFloat(columns[3]) || 0;
        const whichCoffee = columns[4] || '';

        if (whichCoffee) {
          qualityData.push({
            coffee_id: whichCoffee,
            mean_quality: meanQ,
            lower_confidence: p13,
            upper_confidence: p87,
            c_value: cValue
          });
        }
      }
    }

    debugLog(`Parsed ${qualityData.length} coffee quality entries from CSV`);
    return qualityData;
  } catch (error) {
    console.error('Error parsing coffee quality CSV:', error);
    throw new DataServiceError(
      'Failed to parse coffee quality CSV',
      ERROR_TYPES.PARSE_ERROR,
      error as Error
    );
  }
}

/**
 * Fetches coffee quality estimation data directly from CSV
 * @returns Promise<CoffeeQualityData[]> - Array of coffee quality data
 */
export async function fetchCoffeeQualityData(): Promise<CoffeeQualityData[]> {
  debugLog('Fetching coffee quality estimation data...');
  
  try {
    const csvData = await fetchGoogleSheetData(COFFEE_QUALITY_URL);
    const qualityData = parseCoffeeQualityCSV(csvData);
    
    return qualityData;
  } catch (error) {
    console.error('Error fetching coffee quality data:', error);
    throw new DataServiceError(
      'Failed to fetch coffee quality estimation data',
      ERROR_TYPES.NETWORK_ERROR,
      error as Error
    );
  }
}

export async function debugGoogleSheetsUrl(url: string): Promise<any> {
  console.group('🔍 Google Sheets URL Diagnostics');
  
  try {
    // First, validate the URL format
    const urlDiagnostic = validateAndFixGoogleSheetsUrl(url);
    console.log('📋 URL Analysis:', urlDiagnostic);
    
    // Test basic connectivity
    console.log('🌐 Testing basic connectivity...');
    try {
      const basicTest = await fetch(url, { method: 'HEAD' });
      console.log('✅ Basic connectivity:', {
        status: basicTest.status,
        headers: Object.fromEntries(basicTest.headers)
      });
    } catch (headError) {
      console.log('❌ Basic connectivity failed:', headError);
    }
    
    // Try different fetch strategies
    console.log('🔧 Testing different fetch strategies...');
    
    interface FetchResult {
      strategy: string;
      success: boolean;
      status?: number;
      statusText?: string;
      headers?: Record<string, string>;
      dataLength?: number;
      firstChars?: string;
      looksLikeCSV?: boolean;
      lineCount?: number;
      error?: string;
      errorType?: string;
    }
    
    const results = {
      url,
      urlDiagnostic,
      fetchResults: [] as FetchResult[]
    };
    
    const strategies: Array<{ name: string; config: RequestInit }> = [
      { name: 'Basic GET', config: { method: 'GET' } },
      { name: 'With CSV headers', config: { method: 'GET', headers: { 'Accept': 'text/csv' } } },
      { name: 'No cache', config: { method: 'GET', headers: { 'Cache-Control': 'no-cache' } } }
    ];
    
    for (const strategy of strategies) {
      try {
        console.log(`Testing: ${strategy.name}`);
        const response = await fetch(url, strategy.config);
        const text = await response.text();
        
        const result: FetchResult = {
          strategy: strategy.name,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          dataLength: text.length,
          firstChars: text.substring(0, 200),
          looksLikeCSV: text.includes(',') && text.includes('\n'),
          lineCount: text.split('\n').length
        };
        
        results.fetchResults.push(result);
        console.log(`${response.ok ? '✅' : '❌'} ${strategy.name}:`, result);
        
        if (response.ok && text.length > 0) {
          console.log('🎉 Found working strategy!');
          break;
        }
      } catch (error) {
        const errorResult: FetchResult = {
          strategy: strategy.name,
          success: false,
          error: (error as Error).message,
          errorType: (error as Error).name
        };
        results.fetchResults.push(errorResult);
        console.log(`❌ ${strategy.name} failed:`, errorResult);
      }
    }
    
    // Test alternative URLs if original fails
    if (urlDiagnostic.alternatives.length > 0 && !results.fetchResults.some(r => r.success)) {
      console.log('🔄 Testing alternative URL formats...');
      for (const altUrl of urlDiagnostic.alternatives.slice(0, 2)) { // Test first 2 alternatives
        try {
          const response = await fetch(altUrl, { method: 'GET' });
          const text = await response.text();
          console.log(`${response.ok ? '✅' : '❌'} Alternative URL:`, {
            url: altUrl,
            status: response.status,
            dataLength: text.length,
            looksLikeCSV: text.includes(',') && text.includes('\n')
          });
          
          if (response.ok && text.length > 0) {
            console.log('🎉 Found working alternative URL!');
            break;
          }
        } catch (error) {
          console.log('❌ Alternative URL failed:', { url: altUrl, error: (error as Error).message });
        }
      }
    }
    
    console.log('📊 Final Results:', results);
    console.groupEnd();
    return results;
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    console.groupEnd();
    throw error;
  }
}

/**
 * Parses participant harshness and discrimination CSV into ParticipantHarshnessData array
 * @param csvData - Raw CSV string
 * @returns Array of participant harshness data objects
 */
function parseParticipantHarshnessCSV(csvData: string): ParticipantHarshnessData[] {
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Participant harshness CSV has insufficient data');
    }

    // Skip header row and parse each line
    const harshnessData: ParticipantHarshnessData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line, handling potential commas in quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const columns = parseCSVLine(line);
      // Expected columns: UUID,taster_id,mean_harshness,p13_harshness,p87_harshness,mean_discrim,p13_discrim,p87_discrim
      if (columns.length >= 8) {
        const uuid = columns[0] || '';
        const tasterId = columns[1] || '';
        const meanHarshness = parseFloat(columns[2]) || 0;
        const p13Harshness = parseFloat(columns[3]) || 0;
        const p87Harshness = parseFloat(columns[4]) || 0;
        const meanDiscrim = parseFloat(columns[5]) || 0;
        const p13Discrim = parseFloat(columns[6]) || 0;
        const p87Discrim = parseFloat(columns[7]) || 0;

        if (uuid) {
          harshnessData.push({
            uuid,
            taster_id: tasterId,
            mean_harshness: meanHarshness,
            p13_harshness: p13Harshness,
            p87_harshness: p87Harshness,
            mean_discrim: meanDiscrim,
            p13_discrim: p13Discrim,
            p87_discrim: p87Discrim
          });
        }
      }
    }

    debugLog(`Parsed ${harshnessData.length} participant harshness entries from CSV`);
    return harshnessData;
  } catch (error) {
    console.error('Error parsing participant harshness CSV:', error);
    throw new DataServiceError(
      'Failed to parse participant harshness CSV',
      ERROR_TYPES.PARSE_ERROR,
      error as Error
    );
  }
}

/**
 * Fetches participant harshness and discrimination data directly from CSV
 * @returns Promise<ParticipantHarshnessData[]> - Array of participant harshness data
 */
export async function fetchParticipantHarshnessData(): Promise<ParticipantHarshnessData[]> {
  debugLog('Fetching participant harshness and discrimination data...');
  
  try {
    const csvData = await fetchGoogleSheetData(PARTICIPANT_HARSHNESS_URL);
    const harshnessData = parseParticipantHarshnessCSV(csvData);
    
    return harshnessData;
  } catch (error) {
    console.error('Error fetching participant harshness data:', error);
    throw new DataServiceError(
      'Failed to fetch participant harshness and discrimination data',
      ERROR_TYPES.NETWORK_ERROR,
      error as Error
    );
  }
} 