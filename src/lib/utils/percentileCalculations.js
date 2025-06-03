/**
 * Percentile calculation utilities for coffee survey data
 * Provides comparative statistics and percentile-based insights
 */

/**
 * Calculates the percentile rank of a value within a dataset
 * @param {number} value - The value to find the percentile for
 * @param {Array<number>} dataset - Array of numeric values
 * @param {boolean} exclusive - Whether to use exclusive percentile calculation
 * @returns {number|null} Percentile rank (0-100) or null if invalid input
 */
export function calculatePercentileRank(value, dataset, exclusive = false) {
  if (!Array.isArray(dataset) || dataset.length === 0) {
    return null;
  }
  
  // Filter out non-numeric values and sort
  const validData = dataset
    .filter(val => typeof val === 'number' && !isNaN(val))
    .sort((a, b) => a - b);
  
  if (validData.length === 0) {
    return null;
  }
  
  if (exclusive) {
    // Exclusive percentile: percentage of values strictly less than the target
    const countBelow = validData.filter(val => val < value).length;
    return (countBelow / validData.length) * 100;
  } else {
    // Inclusive percentile: percentage of values less than or equal to the target
    const countBelowOrEqual = validData.filter(val => val <= value).length;
    return (countBelowOrEqual / validData.length) * 100;
  }
}

/**
 * Calculates the value at a specific percentile
 * @param {Array<number>} dataset - Array of numeric values
 * @param {number} percentile - Percentile to find (0-100)
 * @param {string} method - Interpolation method ('linear', 'nearest', 'lower', 'higher')
 * @returns {number|null} Value at the specified percentile
 */
export function calculatePercentileValue(dataset, percentile, method = 'linear') {
  if (!Array.isArray(dataset) || dataset.length === 0 || percentile < 0 || percentile > 100) {
    return null;
  }
  
  // Filter out non-numeric values and sort
  const validData = dataset
    .filter(val => typeof val === 'number' && !isNaN(val))
    .sort((a, b) => a - b);
  
  if (validData.length === 0) {
    return null;
  }
  
  if (validData.length === 1) {
    return validData[0];
  }
  
  const index = (percentile / 100) * (validData.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  
  switch (method) {
    case 'nearest':
      return validData[Math.round(index)];
    case 'lower':
      return validData[lowerIndex];
    case 'higher':
      return validData[upperIndex];
    case 'linear':
    default:
      if (lowerIndex === upperIndex) {
        return validData[lowerIndex];
      }
      const weight = index - lowerIndex;
      return validData[lowerIndex] * (1 - weight) + validData[upperIndex] * weight;
  }
}

/**
 * Calculates categorical percentile for non-numeric data (like coffee preferences)
 * @param {string} userChoice - The user's categorical choice
 * @param {Array<string>} dataset - Array of all categorical responses
 * @returns {Object} Object with agreement percentage and rank information
 */
export function calculateCategoricalPercentile(userChoice, dataset) {
  if (!userChoice || !Array.isArray(dataset) || dataset.length === 0) {
    return { agreementPercentage: null, rank: null, totalChoices: 0 };
  }
  
  // Count occurrences of each choice
  /** @type {Record<string, number>} */
  const choiceCounts = {};
  dataset.forEach(choice => {
    if (choice) {
      const normalizedChoice = choice.trim();
      choiceCounts[normalizedChoice] = (choiceCounts[normalizedChoice] || 0) + 1;
    }
  });
  
  const userChoiceCount = choiceCounts[userChoice] || 0;
  const agreementPercentage = (userChoiceCount / dataset.length) * 100;
  
  // Calculate rank (1 = most popular choice)
  const sortedChoices = Object.entries(choiceCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([choice, count]) => ({ choice, count }));
  
  const rank = sortedChoices.findIndex(item => item.choice === userChoice) + 1;
  
  return {
    agreementPercentage: Math.round(agreementPercentage * 100) / 100,
    rank: rank || null,
    totalChoices: Object.keys(choiceCounts).length,
    choiceDistribution: sortedChoices
  };
}

/**
 * Generates comparative statements based on percentile calculations
 * @param {number|null} percentile - User's percentile rank (0-100)
 * @param {string} metric - The metric being compared (e.g., "coffee rating", "brewing preference")
 * @param {string} value - The user's specific value
 * @param {Object} options - Additional options for statement generation
 * @param {boolean} [options.includeValue=true] - Whether to include the value in the statement
 * @param {number} [options.precision=0] - Number of decimal places for percentile
 * @param {'higher'|'lower'|'similar'} [options.comparisonType='higher'] - Type of comparison
 * @returns {string} Human-readable comparison statement
 */
export function generatePercentileStatement(percentile, metric, value, options = {}) {
  if (percentile === null || percentile === undefined) {
    return `Unable to compare your ${metric}.`;
  }
  
  const { 
    includeValue = true, 
    precision = 0,
    comparisonType = 'higher' // 'higher', 'lower', 'similar'
  } = options;
  
  const roundedPercentile = Math.round(percentile * Math.pow(10, precision)) / Math.pow(10, precision);
  const valueText = includeValue ? ` (${value})` : '';
  
  // Generate different statement types based on percentile
  if (comparisonType === 'higher') {
    if (roundedPercentile >= 95) {
      return `Your ${metric}${valueText} ranks in the top 5% of all participants - truly exceptional!`;
    } else if (roundedPercentile >= 90) {
      return `Your ${metric}${valueText} is higher than ${roundedPercentile}% of participants - you're in the top 10%!`;
    } else if (roundedPercentile >= 75) {
      return `Your ${metric}${valueText} is higher than ${roundedPercentile}% of participants - well above average.`;
    } else if (roundedPercentile >= 50) {
      return `Your ${metric}${valueText} is higher than ${roundedPercentile}% of participants - above average.`;
    } else if (roundedPercentile >= 25) {
      return `Your ${metric}${valueText} is higher than ${roundedPercentile}% of participants - below average.`;
    } else if (roundedPercentile >= 10) {
      return `Your ${metric}${valueText} is higher than only ${roundedPercentile}% of participants - you're quite conservative.`;
    } else {
      return `Your ${metric}${valueText} is in the bottom 10% - you're very selective!`;
    }
  } else if (comparisonType === 'similar') {
    return `${roundedPercentile}% of participants share your ${metric}${valueText}.`;
  } else { // 'lower'
    const reversePercentile = 100 - roundedPercentile;
    if (reversePercentile >= 95) {
      return `Your ${metric}${valueText} is more critical than 95% of participants - very discerning taste!`;
    } else if (reversePercentile >= 75) {
      return `Your ${metric}${valueText} is more critical than ${reversePercentile}% of participants.`;
    } else {
      return `Your ${metric}${valueText} aligns with ${roundedPercentile}% of participants.`;
    }
  }
}

/**
 * Calculates agreement percentage for categorical data
 * @param {string} userChoice - User's choice
 * @param {Array<string>} allChoices - All responses for this category
 * @returns {number|null} Percentage of people who made the same choice
 */
export function calculateAgreementPercentage(userChoice, allChoices) {
  if (!userChoice || !Array.isArray(allChoices) || allChoices.length === 0) {
    return null;
  }
  
  const matchingChoices = allChoices.filter(choice => 
    choice && choice.trim().toLowerCase() === userChoice.trim().toLowerCase()
  ).length;
  
  return Math.round((matchingChoices / allChoices.length) * 100 * 100) / 100;
}

/**
 * Calculates percentile for coffee ratings specifically
 * @param {number} userRating - User's rating for a specific coffee
 * @param {Array<number>} allRatings - All ratings for that coffee
 * @returns {Object} Detailed percentile information for coffee ratings
 */
export function calculateCoffeeRatingPercentile(userRating, allRatings) {
  if (!userRating || !Array.isArray(allRatings) || allRatings.length === 0) {
    return {
      percentile: null,
      comparison: null,
      averageRating: null,
      ratingDistribution: {}
    };
  }
  
  const validRatings = allRatings.filter(rating => 
    typeof rating === 'number' && rating >= 0.5 && rating <= 5
  );
  
  if (validRatings.length === 0) {
    return {
      percentile: null,
      comparison: null,
      averageRating: null,
      ratingDistribution: {}
    };
  }
  
  const percentile = calculatePercentileRank(userRating, validRatings);
  const averageRating = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
  
  // Create distribution for 0.5-5.0 scale
  /** @type {Record<number, number>} */
  const ratingDistribution = {};
  for (let i = 0.5; i <= 5; i += 0.5) {
    ratingDistribution[i] = validRatings.filter(rating => rating === i).length;
  }
  
  let comparison;
  if (userRating > averageRating + 0.5) {
    comparison = 'much_higher';
  } else if (userRating > averageRating + 0.2) {
    comparison = 'higher';
  } else if (userRating < averageRating - 0.5) {
    comparison = 'much_lower';
  } else if (userRating < averageRating - 0.2) {
    comparison = 'lower';
  } else {
    comparison = 'similar';
  }
  
  return {
    percentile: percentile !== null ? Math.round(percentile * 100) / 100 : null,
    comparison,
    averageRating: Math.round(averageRating * 100) / 100,
    ratingDistribution,
    totalRatings: validRatings.length
  };
}

/**
 * Calculates overall survey performance percentile
 * @param {Array<number>} userRatings - All of user's coffee ratings
 * @param {Array<Array<number>>} allParticipantRatings - Arrays of ratings from all participants
 * @returns {Object} Overall performance comparison
 */
export function calculateOverallPerformancePercentile(userRatings, allParticipantRatings) {
  if (!Array.isArray(userRatings) || !Array.isArray(allParticipantRatings)) {
    return {
      averageRatingPercentile: null,
      generosityPercentile: null,
      consistencyPercentile: null
    };
  }
  
  const userAverage = userRatings.reduce((sum, rating) => sum + rating, 0) / userRatings.length;
  const userStdDev = calculateStandardDeviation(userRatings);
  
  // Calculate average ratings for all participants
  const allAverages = allParticipantRatings
    .map(ratings => ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
    .filter(avg => !isNaN(avg));
  
  // Calculate standard deviations for all participants (measure of consistency)
  const allStdDevs = allParticipantRatings
    .map(ratings => calculateStandardDeviation(ratings))
    .filter(stdDev => !isNaN(stdDev));
  
  return {
    averageRatingPercentile: calculatePercentileRank(userAverage, allAverages),
    generosityPercentile: calculatePercentileRank(userAverage, allAverages),
    consistencyPercentile: calculatePercentileRank(-userStdDev, allStdDevs.map(s => -s)) // Lower std dev = higher consistency
  };
}

/**
 * Helper function to calculate standard deviation
 * @param {Array<number>} values - Array of numeric values
 * @returns {number} Standard deviation
 */
function calculateStandardDeviation(values) {
  if (!Array.isArray(values) || values.length <= 1) {
    return 0;
  }
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Creates comparative insights for tasting notes
 * @param {Array<string>} userNotes - User's tasting notes
 * @param {Array<Array<string>>} allNotes - All participants' tasting notes
 * @returns {Object} Tasting notes comparison data
 */
export function calculateTastingNotesComparison(userNotes, allNotes) {
  if (!Array.isArray(userNotes) || !Array.isArray(allNotes)) {
    return {
      commonNotes: [],
      uniqueNotes: [],
      popularityPercentiles: {}
    };
  }
  
  // Flatten and normalize all notes
  const allNotesFlat = allNotes
    .flat()
    .map(note => note ? note.trim().toLowerCase() : '')
    .filter(note => note);
  
  /** @type {Record<string, number>} */
  const notesCounts = {};
  allNotesFlat.forEach(note => {
    notesCounts[note] = (notesCounts[note] || 0) + 1;
  });
  
  const normalizedUserNotes = userNotes
    .map(note => note ? note.trim().toLowerCase() : '')
    .filter(note => note);
  
  /** @type {Array<{note: string, percentage: number}>} */
  const commonNotes = [];
  /** @type {Array<{note: string, percentage: number}>} */
  const uniqueNotes = [];
  /** @type {Record<string, number>} */
  const popularityPercentiles = {};
  
  normalizedUserNotes.forEach(userNote => {
    const count = notesCounts[userNote] || 0;
    const percentage = (count / allNotes.length) * 100;
    
    popularityPercentiles[userNote] = percentage;
    
    if (percentage >= 20) { // Consider "common" if 20%+ use this note
      commonNotes.push({ note: userNote, percentage: Math.round(percentage) });
    } else if (percentage < 5) { // Consider "unique" if <5% use this note
      uniqueNotes.push({ note: userNote, percentage: Math.round(percentage) });
    }
  });
  
  return {
    commonNotes: commonNotes.sort((a, b) => b.percentage - a.percentage),
    uniqueNotes: uniqueNotes.sort((a, b) => a.percentage - b.percentage),
    popularityPercentiles
  };
}

/**
 * Generates a comprehensive comparison report
 * @param {Object} userData - User's survey data
 * @param {Object} aggregateData - Aggregate data from all participants
 * @returns {Object} Comprehensive comparison report
 */
export function generateComprehensiveComparison(userData, aggregateData) {
  const report = {
    brewingMethod: null,
    coffeePreferences: null,
    tasteTestPerformance: null,
    tastingNotes: null,
    overallProfile: null
  };
  
  try {
    // Brewing method comparison
    if (userData?.favoriteBrewingMethod && aggregateData?.brewingMethods) {
      report.brewingMethod = calculateCategoricalPercentile(
        userData.favoriteBrewingMethod,
        aggregateData.brewingMethods
      );
    }
    
    // Coffee preferences comparison
    if (userData?.favoriteCoffee && aggregateData?.favoriteChoices) {
      report.coffeePreferences = {
        favorite: calculateCategoricalPercentile(userData.favoriteCoffee, aggregateData.favoriteChoices),
        worst: userData?.worstCoffee ? calculateCategoricalPercentile(userData.worstCoffee, aggregateData.worstChoices || []) : null
      };
    }
    
    // Taste test performance
    if (userData?.ratings && aggregateData?.allRatings) {
      const userRatingsArray = Object.values(userData.ratings);
      report.tasteTestPerformance = calculateOverallPerformancePercentile(
        userRatingsArray,
        aggregateData.allRatings
      );
    }
    
    // Tasting notes comparison
    if (userData?.tastingNotes && aggregateData?.allTastingNotes) {
      report.tastingNotes = calculateTastingNotesComparison(
        userData.tastingNotes,
        aggregateData.allTastingNotes
      );
    }
    
    // Overall profile categorization
    report.overallProfile = categorizeUserProfile(report);
    
  } catch (error) {
    console.error('Error generating comprehensive comparison:', error);
  }
  
  return report;
}

/**
 * Categorizes user profile based on percentile data
 * @param {Object} comparisonData - Comparison data from generateComprehensiveComparison
 * @returns {Object} User profile categorization
 */
function categorizeUserProfile(comparisonData) {
  const categories = [];
  
  // Analyze brewing method popularity
  if (comparisonData.brewingMethod?.agreementPercentage) {
    if (comparisonData.brewingMethod.agreementPercentage >= 40) {
      categories.push('mainstream_brewer');
    } else if (comparisonData.brewingMethod.agreementPercentage <= 10) {
      categories.push('unique_brewer');
    }
  }
  
  // Analyze rating generosity
  if (comparisonData.tasteTestPerformance?.generosityPercentile) {
    if (comparisonData.tasteTestPerformance.generosityPercentile >= 75) {
      categories.push('generous_rater');
    } else if (comparisonData.tasteTestPerformance.generosityPercentile <= 25) {
      categories.push('critical_rater');
    }
  }
  
  // Analyze consistency
  if (comparisonData.tasteTestPerformance?.consistencyPercentile) {
    if (comparisonData.tasteTestPerformance.consistencyPercentile >= 75) {
      categories.push('consistent_taster');
    } else if (comparisonData.tasteTestPerformance.consistencyPercentile <= 25) {
      categories.push('varied_taster');
    }
  }
  
  // Analyze tasting notes uniqueness
  if (comparisonData.tastingNotes?.uniqueNotes?.length > 2) {
    categories.push('descriptive_taster');
  } else if (comparisonData.tastingNotes?.commonNotes?.length > 3) {
    categories.push('conventional_taster');
  }
  
  return {
    categories,
    primaryCategory: categories[0] || 'balanced_taster',
    description: generateProfileDescription(categories)
  };
}

/**
 * Generates a description based on user profile categories
 * @param {Array<string>} categories - Array of profile categories
 * @returns {string} Human-readable profile description
 */
function generateProfileDescription(categories) {
  /** @type {Record<string, string>} */
  const descriptions = {
    mainstream_brewer: 'You prefer popular brewing methods',
    unique_brewer: 'You have unique brewing preferences',
    generous_rater: 'You tend to rate coffees generously',
    critical_rater: 'You have discerning taste in coffee',
    consistent_taster: 'You have consistent tasting preferences',
    varied_taster: 'You appreciate diverse coffee experiences',
    descriptive_taster: 'You notice unique flavors and notes',
    conventional_taster: 'You identify classic coffee characteristics',
    balanced_taster: 'You have well-balanced coffee preferences'
  };
  
  if (categories.length === 0) {
    return descriptions.balanced_taster;
  }
  
  return categories.map(cat => descriptions[cat] || descriptions.balanced_taster).join(', ');
} 