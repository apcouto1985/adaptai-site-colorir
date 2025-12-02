/**
 * Performance Utilities
 * Utilities for optimizing application performance
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge instead of trailing
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 250, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const context = this;
        
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(context, args);
    };
}

/**
 * Throttle function - ensures function is called at most once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 250) {
    let inThrottle;
    
    return function executedFunction(...args) {
        const context = this;
        
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * SVG Cache Manager
 * Caches parsed SVG documents to avoid repeated parsing
 */
export class SVGCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.accessOrder = [];
    }

    /**
     * Get cached SVG document
     * @param {string} key - Cache key (usually SVG path)
     * @returns {Document|null} Cached SVG document or null
     */
    get(key) {
        if (this.cache.has(key)) {
            // Update access order for LRU
            this.updateAccessOrder(key);
            return this.cache.get(key);
        }
        return null;
    }

    /**
     * Set SVG document in cache
     * @param {string} key - Cache key
     * @param {Document} value - SVG document to cache
     */
    set(key, value) {
        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.accessOrder.shift();
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, value);
        this.updateAccessOrder(key);
    }

    /**
     * Update access order for LRU eviction
     * @param {string} key - Cache key
     */
    updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    /**
     * Get cache size
     * @returns {number} Number of items in cache
     */
    size() {
        return this.cache.size;
    }

    /**
     * Remove specific item from cache
     * @param {string} key - Cache key to remove
     */
    remove(key) {
        this.cache.delete(key);
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }
}

/**
 * Request Animation Frame wrapper for smooth animations
 * @param {Function} callback - Function to execute on next frame
 * @returns {number} Request ID
 */
export function requestFrame(callback) {
    return window.requestAnimationFrame(callback);
}

/**
 * Cancel animation frame
 * @param {number} id - Request ID to cancel
 */
export function cancelFrame(id) {
    window.cancelAnimationFrame(id);
}

/**
 * Lazy load images with Intersection Observer
 * @param {HTMLElement} element - Element to observe
 * @param {Function} callback - Callback when element is visible
 * @param {Object} options - Intersection Observer options
 */
export function lazyLoad(element, callback, options = {}) {
    const defaultOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.01
    };

    const observerOptions = { ...defaultOptions, ...options };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    observer.observe(element);

    return observer;
}

/**
 * Measure performance of a function
 * @param {Function} func - Function to measure
 * @param {string} label - Label for performance measurement
 * @returns {Function} Wrapped function with performance measurement
 */
export function measurePerformance(func, label = 'Function') {
    return function(...args) {
        const startTime = performance.now();
        const result = func.apply(this, args);
        const endTime = performance.now();
        
        console.log(`${label} took ${(endTime - startTime).toFixed(2)}ms`);
        
        return result;
    };
}

/**
 * Memory-efficient batch processor
 * @param {Array} items - Items to process
 * @param {Function} processor - Function to process each item
 * @param {number} batchSize - Number of items per batch
 * @returns {Promise} Promise that resolves when all batches are processed
 */
export async function processBatch(items, processor, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => processor(item))
        );
        results.push(...batchResults);
        
        // Allow browser to breathe between batches
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
}

// Create global SVG cache instance
export const svgCache = new SVGCache();
