<script lang="ts">
  import type { ParticipantHarshnessData } from '$lib/services/dataService';
  
  interface Props {
    harshnessData?: ParticipantHarshnessData[];
    userId?: string | null;
    loading?: boolean;
    error?: string | null;
  }
  
  let { 
    harshnessData = [], 
    userId = null, 
    loading = false, 
    error = null 
  }: Props = $props();
  
  // User's harshness and discrimination data
  let userHarshnessInfo = $state<ParticipantHarshnessData | null>(null);
  let harshnessPercentile = $state<number | null>(null);
  let discriminationPercentile = $state<number | null>(null);
  
  // Calculate percentiles and find user data
  $effect(() => {
    if (!userId || harshnessData.length === 0) {
      userHarshnessInfo = null;
      harshnessPercentile = null;
      discriminationPercentile = null;
      return;
    }
    
    // Find user's data
    const userData = harshnessData.find(data => data.uuid === userId);
    if (!userData) {
      userHarshnessInfo = null;
      harshnessPercentile = null;
      discriminationPercentile = null;
      return;
    }
    
    userHarshnessInfo = userData;
    
    // Calculate harshness percentile (lower score = more harsh, so invert)
    const harshnessScores = harshnessData.map(d => d.mean_harshness).sort((a, b) => a - b);
    const harshnessRank = harshnessScores.filter(score => score < userData.mean_harshness).length;
    harshnessPercentile = Math.round((harshnessRank / harshnessScores.length) * 100);
    
    // Calculate discrimination percentile (higher score = more discriminating)
    const discriminationScores = harshnessData.map(d => d.mean_discrim).sort((a, b) => a - b);
    const discriminationRank = discriminationScores.filter(score => score < userData.mean_discrim).length;
    discriminationPercentile = Math.round((discriminationRank / discriminationScores.length) * 100);
  });
  
  // Generate harshness message based on percentile
  function getHarshnessMessage(percentile: number): { title: string; message: string; emoji: string; color: string } {
    if (percentile <= 10) {
      return {
        title: "The Coffee Snob Supreme! 🏆",
        message: "You're in the top 10% of harsh coffee critics! You don't just taste coffee, you interrogate it. Every bean must meet your exacting standards, and you're not afraid to call out mediocrity when you taste it.",
        emoji: "🔍",
        color: "text-error-600 dark:text-error-400"
      };
    } else if (percentile <= 25) {
      return {
        title: "The Discerning Critic 🎯",
        message: "You're a pretty tough coffee critic! You know what you like and you're not easily impressed. Your palate has standards, and you're not afraid to speak your mind about subpar brews.",
        emoji: "🎭",
        color: "text-warning-600 dark:text-warning-400"
      };
    } else if (percentile <= 75) {
      return {
        title: "The Balanced Reviewer ⚖️",
        message: "You're a fair and balanced coffee judge! You appreciate good coffee but you're not unnecessarily harsh. You give credit where it's due and constructive feedback where it's needed.",
        emoji: "😊",
        color: "text-secondary-600 dark:text-secondary-400"
      };
    } else if (percentile <= 90) {
      return {
        title: "The Coffee Optimist ☀️",
        message: "You're pretty forgiving when it comes to coffee! You tend to find the good in most brews and appreciate the effort that goes into every cup. Your positive attitude makes you a joy to share coffee with!",
        emoji: "😄",
        color: "text-success-600 dark:text-success-400"
      };
    } else {
      return {
        title: "The Coffee Sunshine ✨",
        message: "You're the most forgiving coffee reviewer around! You see the best in every brew and rarely meet a coffee you don't like. Your enthusiasm is infectious and you make coffee time brighter for everyone!",
        emoji: "🌟",
        color: "text-primary-600 dark:text-primary-400"
      };
    }
  }
  
  // Generate discrimination message based on percentile
  function getDiscriminationMessage(percentile: number): { title: string; message: string; emoji: string; color: string } {
    if (percentile >= 90) {
      return {
        title: "The Super Palate! 🦸‍♀️",
        message: "Your taste buds are legendary! You can detect subtle differences that others miss entirely. You could probably tell the difference between coffees grown on different sides of the same hill!",
        emoji: "🔬",
        color: "text-primary-600 dark:text-primary-400"
      };
    } else if (percentile >= 75) {
      return {
        title: "The Flavor Detective 🕵️",
        message: "You have an impressive ability to distinguish between different coffees! Your palate is well-trained and you can pick up on nuances that many people miss. Baristas probably love having you as a customer!",
        emoji: "🎯",
        color: "text-secondary-600 dark:text-secondary-400"
      };
    } else if (percentile >= 25) {
      return {
        title: "The Solid Sipper 👌",
        message: "You have a good sense for different coffee flavors! While you might not catch every subtle note, you can definitely tell good coffee from bad and appreciate variety in your daily brew.",
        emoji: "☕",
        color: "text-tertiary-600 dark:text-tertiary-400"
      };
    } else if (percentile >= 10) {
      return {
        title: "The Casual Coffee Fan 😎",
        message: "You keep it simple when it comes to coffee flavors! You know what you like and you're not too concerned about the subtle differences. Sometimes the best approach is just to enjoy your cup without overthinking it!",
        emoji: "🤷‍♀️",
        color: "text-surface-600 dark:text-surface-300"
      };
    } else {
      return {
        title: "The Coffee Zen Master 🧘",
        message: "You're all about the coffee experience rather than the details! For you, coffee is coffee, and what matters most is the moment of enjoyment. You've achieved coffee enlightenment through simplicity!",
        emoji: "☮️",
        color: "text-surface-600 dark:text-surface-300"
      };
    }
  }
  
  let harshnessInsight = $derived(harshnessPercentile !== null ? getHarshnessMessage(harshnessPercentile) : null);
  let discriminationInsight = $derived(discriminationPercentile !== null ? getDiscriminationMessage(discriminationPercentile) : null);
</script>

<div class="space-y-6">
  <div class="text-center">
    <h3 class="h3 mb-4 text-xl sm:text-2xl">Your Coffee Personality</h3>
    <p class="text-base sm:text-lg opacity-75 mb-6 leading-relaxed max-w-3xl mx-auto">
      Based on your taste test responses, here's what your coffee tasting style says about you!
    </p>
  </div>
  
  {#if loading}
    <div class="card p-6 text-center">
      <div class="flex items-center justify-center space-x-3 mb-4">
        <div class="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-lg">Analyzing your coffee personality...</span>
      </div>
    </div>
    
  {:else if error}
    <div class="card p-6 border-2 border-warning-500">
      <div class="text-center">
        <div class="text-4xl mb-4">🤔</div>
        <h4 class="h4 mb-2 text-warning-600 dark:text-warning-400">
          Personality Analysis Unavailable
        </h4>
        <p class="text-sm opacity-75">
          We couldn't load your coffee personality insights right now. This feature requires completing both surveys to work properly.
        </p>
      </div>
    </div>
    
  {:else if !userId}
    <div class="card p-6 border-2 border-surface-300-600-token">
      <div class="text-center">
        <div class="text-4xl mb-4">🆔</div>
        <h4 class="h4 mb-2">
          Complete Surveys for Personality Insights
        </h4>
        <p class="text-sm opacity-75 mb-4">
          Take both the preference survey and taste test to discover your unique coffee personality profile!
        </p>
      </div>
    </div>
    
  {:else if !userHarshnessInfo}
    <div class="card p-6 border-2 border-surface-300-600-token">
      <div class="text-center">
        <div class="text-4xl mb-4">📊</div>
        <h4 class="h4 mb-2">
          Personality Data Processing
        </h4>
        <p class="text-sm opacity-75">
          Your coffee personality analysis is being processed. Check back soon for insights about your tasting style!
        </p>
      </div>
    </div>
    
  {:else}
    <!-- Harshness Insights -->
    {#if harshnessInsight}
      <div class="card p-6">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          <div class="text-4xl sm:text-5xl flex-shrink-0 text-center sm:text-left">
            {harshnessInsight.emoji}
          </div>
          <div class="flex-1 text-center sm:text-left">
            <h4 class="h4 mb-3 {harshnessInsight.color}">
              {harshnessInsight.title}
            </h4>
            <p class="text-sm sm:text-base leading-relaxed mb-4">
              {harshnessInsight.message}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 text-xs sm:text-sm opacity-75">
              <div class="bg-surface-100-800-token px-3 py-2 rounded-lg">
                <strong>Your Harshness Score:</strong> {userHarshnessInfo.mean_harshness.toFixed(2)}
              </div>
              <div class="bg-surface-100-800-token px-3 py-2 rounded-lg">
                <strong>Percentile:</strong> {harshnessPercentile}% (more forgiving than {harshnessPercentile}% of participants)
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Discrimination Insights -->
    {#if discriminationInsight}
      <div class="card p-6">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          <div class="text-4xl sm:text-5xl flex-shrink-0 text-center sm:text-left">
            {discriminationInsight.emoji}
          </div>
          <div class="flex-1 text-center sm:text-left">
            <h4 class="h4 mb-3 {discriminationInsight.color}">
              {discriminationInsight.title}
            </h4>
            <p class="text-sm sm:text-base leading-relaxed mb-4">
              {discriminationInsight.message}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 text-xs sm:text-sm opacity-75">
              <div class="bg-surface-100-800-token px-3 py-2 rounded-lg">
                <strong>Your Discrimination Score:</strong> {userHarshnessInfo.mean_discrim.toFixed(2)}
              </div>
              <div class="bg-surface-100-800-token px-3 py-2 rounded-lg">
                <strong>Percentile:</strong> {discriminationPercentile}% (more discriminating than {discriminationPercentile}% of participants)
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Fun Fact Card -->
    {#if harshnessPercentile !== null && discriminationPercentile !== null}
      <div class="card p-6 preset-tonal-primary-500">
        <div class="text-center">
          <div class="text-3xl mb-3">🎭</div>
          <h4 class="h4 mb-3">Your Coffee Tasting Profile</h4>
          <p class="text-sm leading-relaxed">
            {#if harshnessPercentile <= 25 && discriminationPercentile >= 75}
              You're a <strong>Coffee Connoisseur</strong> - you're both discerning and discriminating! You have high standards and the palate to back them up.
            {:else if harshnessPercentile >= 75 && discriminationPercentile >= 75}
              You're a <strong>Coffee Enthusiast</strong> - you love trying different coffees and can appreciate subtle differences without being too critical.
            {:else if harshnessPercentile <= 25 && discriminationPercentile <= 25}
              You're a <strong>Coffee Purist</strong> - you have strong opinions but keep things simple. You know what you like!
            {:else if harshnessPercentile >= 75 && discriminationPercentile <= 25}
              You're a <strong>Coffee Friend</strong> - you're easygoing and just happy to share a good cup with others.
            {:else}
              You're a <strong>Coffee Balanced</strong> - you strike a nice middle ground between being discerning and being enjoyable to coffee with.
            {/if}
          </p>
        </div>
      </div>
    {/if}
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