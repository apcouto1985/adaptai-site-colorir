/**
 * Performance Utilities Tests
 * Tests for performance optimization utilities
 */

import { jest } from '@jest/globals';
import { 
    debounce, 
    throttle, 
    SVGCache,
    processBatch,
    measurePerformance
} from '../performanceUtils.js';

describe('Performance Utilities', () => {
    describe('debounce', () => {
        jest.useFakeTimers();

        test('should delay function execution', () => {
            const func = jest.fn();
            const debouncedFunc = debounce(func, 100);

            debouncedFunc();
            expect(func).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);
            expect(func).toHaveBeenCalledTimes(1);
        });

        test('should only execute once for multiple rapid calls', () => {
            const func = jest.fn();
            const debouncedFunc = debounce(func, 100);

            debouncedFunc();
            debouncedFunc();
            debouncedFunc();

            jest.advanceTimersByTime(100);
            expect(func).toHaveBeenCalledTimes(1);
        });

        test('should execute immediately when immediate flag is true', () => {
            const func = jest.fn();
            const debouncedFunc = debounce(func, 100, true);

            debouncedFunc();
            expect(func).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(100);
            expect(func).toHaveBeenCalledTimes(1);
        });

        test('should pass arguments correctly', () => {
            const func = jest.fn();
            const debouncedFunc = debounce(func, 100);

            debouncedFunc('arg1', 'arg2');
            jest.advanceTimersByTime(100);

            expect(func).toHaveBeenCalledWith('arg1', 'arg2');
        });
    });

    describe('throttle', () => {
        jest.useFakeTimers();

        test('should limit function execution rate', () => {
            const func = jest.fn();
            const throttledFunc = throttle(func, 100);

            throttledFunc();
            throttledFunc();
            throttledFunc();

            expect(func).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(100);
            throttledFunc();

            expect(func).toHaveBeenCalledTimes(2);
        });

        test('should execute immediately on first call', () => {
            const func = jest.fn();
            const throttledFunc = throttle(func, 100);

            throttledFunc();
            expect(func).toHaveBeenCalledTimes(1);
        });

        test('should pass arguments correctly', () => {
            const func = jest.fn();
            const throttledFunc = throttle(func, 100);

            throttledFunc('test', 123);
            expect(func).toHaveBeenCalledWith('test', 123);
        });
    });

    describe('SVGCache', () => {
        let cache;

        beforeEach(() => {
            cache = new SVGCache(3);
        });

        test('should store and retrieve values', () => {
            const mockSVG = { type: 'svg', id: 'test' };
            cache.set('key1', mockSVG);

            expect(cache.get('key1')).toEqual(mockSVG);
        });

        test('should return null for non-existent keys', () => {
            expect(cache.get('nonexistent')).toBeNull();
        });

        test('should respect max size limit', () => {
            cache.set('key1', { id: 1 });
            cache.set('key2', { id: 2 });
            cache.set('key3', { id: 3 });
            cache.set('key4', { id: 4 }); // Should evict key1

            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key4')).toBe(true);
            expect(cache.size()).toBe(3);
        });

        test('should implement LRU eviction', () => {
            cache.set('key1', { id: 1 });
            cache.set('key2', { id: 2 });
            cache.set('key3', { id: 3 });

            // Access key1 to make it recently used
            cache.get('key1');

            // Add key4, should evict key2 (least recently used)
            cache.set('key4', { id: 4 });

            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false);
            expect(cache.has('key4')).toBe(true);
        });

        test('should clear all entries', () => {
            cache.set('key1', { id: 1 });
            cache.set('key2', { id: 2 });

            cache.clear();

            expect(cache.size()).toBe(0);
            expect(cache.has('key1')).toBe(false);
        });

        test('should remove specific entries', () => {
            cache.set('key1', { id: 1 });
            cache.set('key2', { id: 2 });

            cache.remove('key1');

            expect(cache.has('key1')).toBe(false);
            expect(cache.has('key2')).toBe(true);
            expect(cache.size()).toBe(1);
        });
    });

    describe('processBatch', () => {
        test('should handle empty array', async () => {
            const processor = jest.fn();
            const results = await processBatch([], processor, 5);

            expect(results).toEqual([]);
            expect(processor).not.toHaveBeenCalled();
        });
    });

    describe('measurePerformance', () => {
        test('should measure function execution time', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const func = (x) => x * 2;
            const measuredFunc = measurePerformance(func, 'TestFunction');

            const result = measuredFunc(5);

            expect(result).toBe(10);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('TestFunction took')
            );

            consoleSpy.mockRestore();
        });

        test('should preserve function context', () => {
            const obj = {
                value: 10,
                getValue() {
                    return this.value;
                }
            };

            const measuredFunc = measurePerformance(obj.getValue, 'GetValue');
            const result = measuredFunc.call(obj);

            expect(result).toBe(10);
        });
    });
});
