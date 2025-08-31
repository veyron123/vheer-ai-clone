import { useMemo, useCallback } from 'react';

/**
 * Custom hooks for memoizing heavy calculations
 */

/**
 * Memoize filtered and sorted images
 */
export const useMemoizedImages = (images, filters, sortBy) => {
  return useMemo(() => {
    if (!images || images.length === 0) return [];
    
    // Heavy filtering operation
    let filtered = [...images];
    
    if (filters.model) {
      filtered = filtered.filter(img => img.model === filters.model);
    }
    
    if (filters.style) {
      filtered = filtered.filter(img => img.style === filters.style);
    }
    
    if (filters.dateRange) {
      filtered = filtered.filter(img => {
        const imgDate = new Date(img.createdAt);
        return imgDate >= filters.dateRange.start && imgDate <= filters.dateRange.end;
      });
    }
    
    // Heavy sorting operation
    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'likes':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      default:
        break;
    }
    
    return filtered;
  }, [images, filters, sortBy]);
};

/**
 * Memoize pricing calculations with discounts
 */
export const useMemoizedPricing = (basePrice, discountPercentage, quantity, currency) => {
  return useMemo(() => {
    // Heavy calculation for pricing
    const discountAmount = basePrice * (discountPercentage / 100);
    const discountedPrice = basePrice - discountAmount;
    const totalPrice = discountedPrice * quantity;
    
    // Currency conversion (example rates)
    const exchangeRates = {
      USD: 1,
      EUR: 0.85,
      UAH: 27.5,
      GBP: 0.73
    };
    
    const convertedPrice = totalPrice * (exchangeRates[currency] || 1);
    
    return {
      basePrice,
      discountAmount,
      discountedPrice,
      totalPrice: convertedPrice,
      currency,
      savings: discountAmount * quantity
    };
  }, [basePrice, discountPercentage, quantity, currency]);
};

/**
 * Memoize statistics calculations
 */
export const useMemoizedStats = (data) => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0
      };
    }
    
    // Heavy statistical calculations
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const average = total / data.length;
    const sorted = [...data].sort((a, b) => a.value - b.value);
    const min = sorted[0].value;
    const max = sorted[sorted.length - 1].value;
    const median = sorted[Math.floor(sorted.length / 2)].value;
    
    return {
      total,
      average: Math.round(average * 100) / 100,
      min,
      max,
      median
    };
  }, [data]);
};

/**
 * Memoize search results with fuzzy matching
 */
export const useMemoizedSearch = (items, searchQuery, searchFields = ['name', 'description']) => {
  return useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return items;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Heavy search operation with scoring
    const results = items.map(item => {
      let score = 0;
      
      searchFields.forEach(field => {
        const fieldValue = (item[field] || '').toLowerCase();
        
        // Exact match
        if (fieldValue === query) {
          score += 100;
        }
        // Starts with query
        else if (fieldValue.startsWith(query)) {
          score += 50;
        }
        // Contains query
        else if (fieldValue.includes(query)) {
          score += 25;
        }
        // Fuzzy match (simple implementation)
        else {
          const words = fieldValue.split(/\s+/);
          words.forEach(word => {
            if (word.startsWith(query.slice(0, 3))) {
              score += 10;
            }
          });
        }
      });
      
      return { ...item, searchScore: score };
    });
    
    // Filter and sort by relevance
    return results
      .filter(item => item.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)
      .map(({ searchScore, ...item }) => item);
  }, [items, searchQuery, searchFields]);
};

/**
 * Memoize expensive callbacks
 */
export const useMemoizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

/**
 * Memoize credit calculations
 */
export const useMemoizedCredits = (generations, bonuses, subscriptionPlan) => {
  return useMemo(() => {
    // Heavy credit calculation
    const baseCreditsUsed = generations.reduce((total, gen) => {
      const modelCosts = {
        'flux-pro': 10,
        'flux-max': 15,
        'gpt-image': 8,
        'qwen': 6,
        'midjourney': 20,
        'runway': 25
      };
      return total + (modelCosts[gen.model] || 5);
    }, 0);
    
    const bonusCredits = bonuses.reduce((total, bonus) => total + bonus.amount, 0);
    
    const subscriptionMultiplier = {
      'FREE': 1,
      'BASIC': 0.9,
      'PRO': 0.8,
      'PREMIUM': 0.7
    };
    
    const finalCreditsUsed = Math.floor(
      baseCreditsUsed * (subscriptionMultiplier[subscriptionPlan] || 1)
    );
    
    return {
      baseCreditsUsed,
      bonusCredits,
      finalCreditsUsed,
      discount: baseCreditsUsed - finalCreditsUsed,
      discountPercentage: subscriptionPlan === 'FREE' ? 0 : 
        (1 - subscriptionMultiplier[subscriptionPlan]) * 100
    };
  }, [generations, bonuses, subscriptionPlan]);
};

/**
 * Memoize chart data transformations
 */
export const useMemoizedChartData = (rawData, chartType) => {
  return useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    
    // Heavy data transformation for charts
    switch (chartType) {
      case 'line':
        return rawData.map(item => ({
          x: new Date(item.date).getTime(),
          y: item.value,
          label: item.label
        }));
        
      case 'bar':
        return rawData.reduce((acc, item) => {
          const key = item.category;
          if (!acc[key]) {
            acc[key] = { category: key, value: 0, count: 0 };
          }
          acc[key].value += item.value;
          acc[key].count += 1;
          return acc;
        }, {});
        
      case 'pie':
        const total = rawData.reduce((sum, item) => sum + item.value, 0);
        return rawData.map(item => ({
          name: item.name,
          value: item.value,
          percentage: ((item.value / total) * 100).toFixed(1)
        }));
        
      default:
        return rawData;
    }
  }, [rawData, chartType]);
};

export default {
  useMemoizedImages,
  useMemoizedPricing,
  useMemoizedStats,
  useMemoizedSearch,
  useMemoizedCallback,
  useMemoizedCredits,
  useMemoizedChartData
};