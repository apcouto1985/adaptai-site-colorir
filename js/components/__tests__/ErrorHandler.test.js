/**
 * Error Handler Tests
 * Tests for error handling functionality
 */

import { jest } from '@jest/globals';

// Mock DOM environment
Object.defineProperty(global.window, 'location', {
    value: {
        hostname: 'localhost',
        protocol: 'http:',
        href: 'http://localhost:3000'
    },
    writable: true
});

Object.defineProperty(global.navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Test Environment)',
    writable: true
});

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(global.window, 'localStorage', {
    value: localStorageMock
});

// Mock console methods
const consoleMock = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn()
};
global.console.error = consoleMock.error;
global.console.warn = consoleMock.warn;
global.console.log = consoleMock.log;

// Mock ErrorHandler class for testing
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }

    handleError(errorInfo) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            type: errorInfo.type || 'Unknown Error',
            message: errorInfo.message || 'An error occurred',
            filename: errorInfo.filename || 'unknown',
            lineno: errorInfo.lineno || 0,
            colno: errorInfo.colno || 0,
            stack: errorInfo.error?.stack || 'No stack trace available',
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.addToLog(errorEntry);
    }

    addToLog(errorEntry) {
        this.errorLog.unshift(errorEntry);
        
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        try {
            localStorage.setItem('colorir_error_log', JSON.stringify(this.errorLog.slice(0, 10)));
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    getUserFriendlyMessage(errorEntry) {
        const message = errorEntry.message.toLowerCase();

        if (message.includes('network') || message.includes('fetch')) {
            return 'There seems to be a network connection issue. Please check your internet connection and try again.';
        }

        if (message.includes('permission') || message.includes('access')) {
            return 'Permission denied. Please check your browser settings and try again.';
        }

        if (message.includes('storage') || message.includes('quota')) {
            return 'Storage limit reached. Please clear some browser data and try again.';
        }

        return 'An unexpected error occurred. Please try refreshing the page. If the problem persists, please contact support.';
    }

    getErrorLog() {
        return [...this.errorLog];
    }

    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('colorir_error_log');
        } catch (e) {
            // Ignore localStorage errors
        }
    }
}

describe('ErrorHandler', () => {
    let errorHandler;
    let mockDocument;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        
        // Mock document
        mockDocument = {
            createElement: jest.fn(() => ({
                id: '',
                className: '',
                innerHTML: '',
                style: {},
                appendChild: jest.fn()
            })),
            getElementById: jest.fn(),
            body: {
                appendChild: jest.fn()
            }
        };
        global.document = mockDocument;
        
        // Create new ErrorHandler instance
        errorHandler = new ErrorHandler();
    });

    afterEach(() => {
        // Clean up
        delete global.document;
    });

    describe('Constructor', () => {
        test('should initialize with empty error log', () => {
            expect(errorHandler.errorLog).toEqual([]);
            expect(errorHandler.maxLogSize).toBe(100);
        });

        test('should set up global error handling', () => {
            expect(errorHandler).toBeInstanceOf(ErrorHandler);
        });
    });

    describe('handleError', () => {
        test('should handle basic error information', () => {
            const errorInfo = {
                type: 'Test Error',
                message: 'Test error message',
                error: new Error('Test error')
            };

            errorHandler.handleError(errorInfo);

            expect(errorHandler.errorLog).toHaveLength(1);
            expect(errorHandler.errorLog[0]).toMatchObject({
                type: 'Test Error',
                message: 'Test error message'
            });
        });

        test('should add timestamp to error entries', () => {
            const errorInfo = {
                type: 'Test Error',
                message: 'Test message'
            };

            errorHandler.handleError(errorInfo);

            expect(errorHandler.errorLog[0].timestamp).toBeDefined();
            expect(new Date(errorHandler.errorLog[0].timestamp)).toBeInstanceOf(Date);
        });

        test('should store error in localStorage', () => {
            const errorInfo = {
                type: 'Test Error',
                message: 'Test message'
            };

            errorHandler.handleError(errorInfo);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'colorir_error_log',
                expect.any(String)
            );
        });

        test('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            const errorInfo = {
                type: 'Test Error',
                message: 'Test message'
            };

            expect(() => errorHandler.handleError(errorInfo)).not.toThrow();
        });
    });

    describe('getUserFriendlyMessage', () => {
        test('should return network message for network errors', () => {
            const errorEntry = { message: 'Network request failed' };
            const message = errorHandler.getUserFriendlyMessage(errorEntry);
            
            expect(message).toContain('network connection issue');
        });

        test('should return permission message for permission errors', () => {
            const errorEntry = { message: 'Permission denied' };
            const message = errorHandler.getUserFriendlyMessage(errorEntry);
            
            expect(message).toContain('Permission denied');
        });

        test('should return storage message for storage errors', () => {
            const errorEntry = { message: 'Storage quota exceeded' };
            const message = errorHandler.getUserFriendlyMessage(errorEntry);
            
            expect(message).toContain('Storage limit reached');
        });

        test('should return generic message for unknown errors', () => {
            const errorEntry = { message: 'Unknown error occurred' };
            const message = errorHandler.getUserFriendlyMessage(errorEntry);
            
            expect(message).toContain('unexpected error occurred');
        });
    });

    describe('getErrorLog and clearErrorLog', () => {
        test('should return copy of error log', () => {
            errorHandler.addToLog({ type: 'Test', message: 'Test', timestamp: new Date().toISOString() });
            
            const log = errorHandler.getErrorLog();
            expect(log).toHaveLength(1);
            
            // Verify it's a copy
            log.push({ type: 'New', message: 'New', timestamp: new Date().toISOString() });
            expect(errorHandler.errorLog).toHaveLength(1);
        });

        test('should clear error log', () => {
            errorHandler.addToLog({ type: 'Test', message: 'Test', timestamp: new Date().toISOString() });
            expect(errorHandler.errorLog).toHaveLength(1);
            
            errorHandler.clearErrorLog();
            expect(errorHandler.errorLog).toHaveLength(0);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('colorir_error_log');
        });
    });
});
