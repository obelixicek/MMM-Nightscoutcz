import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock MagicMirror environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Mock Module registration
const modules = {};
global.Module = {
    register: function(name, moduleDefinition) {
        modules[name] = moduleDefinition;
    }
};

// Mock Log
global.Log = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
};

// Load the module
await import('./MMM-Nightscoutcz.js');

describe('MMM-Nightscoutcz Frontend', () => {
    let moduleInstance;

    beforeEach(() => {
        // Suppress console output during tests
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Create fresh instance for each test
        const ModuleDef = modules['MMM-Nightscoutcz'];
        moduleInstance = Object.create(ModuleDef);
        moduleInstance.name = 'MMM-Nightscoutcz';
        moduleInstance.config = {
            username: 'testuser',
            secret: 'testsecret',
            updateInterval: 60000,
            locale: 'cs-CZ',
            showDate: false,
            animationSpeed: 1000
        };
        
        // Mock MagicMirror methods
        moduleInstance.sendSocketNotification = vi.fn();
        moduleInstance.updateDom = vi.fn();
        
        // Initialize
        if (ModuleDef.start) {
            ModuleDef.start.call(moduleInstance);
        }
    });

    describe('getDom', () => {
        it('should show loading message when not loaded', () => {
            moduleInstance.loaded = false;
            moduleInstance.error = null;
            
            const dom = moduleInstance.getDom();
            
            expect(dom.className).toBe('nightscout-wrapper');
            expect(dom.innerHTML).toContain('Loading data');
        });

        it('should show error message when error exists', () => {
            moduleInstance.loaded = true;
            moduleInstance.error = 'Test error message';
            
            const dom = moduleInstance.getDom();
            
            expect(dom.innerHTML).toContain('Test error message');
            expect(dom.innerHTML).toContain('error');
        });

        it('should show "No data" when loaded but no glucose data', () => {
            moduleInstance.loaded = true;
            moduleInstance.error = null;
            moduleInstance.glucoseData = null;
            
            const dom = moduleInstance.getDom();
            
            expect(dom.innerHTML).toContain('No data');
        });

        it('should render glucose data correctly', () => {
            moduleInstance.loaded = true;
            moduleInstance.error = null;
            moduleInstance.glucoseData = {
                sg: 7,
                direction: 'Flat',
                directionIcon: 'arrow-right',
                date: '20:30'
            };
            
            const dom = moduleInstance.getDom();
            
            expect(dom.querySelector('.sg-value').textContent).toContain('7');
            expect(dom.querySelector('.sg-value').textContent).toContain('mmol/L');
            expect(dom.querySelector('.direction-icon i').className).toBe('fa-solid fa-arrow-right');
            expect(dom.querySelector('.time').textContent).toBe('20:30');
        });

        it('should show invalid data message for incomplete data', () => {
            moduleInstance.loaded = true;
            moduleInstance.error = null;
            moduleInstance.glucoseData = {
                sg: 7,
                // missing directionIcon and date
            };
            
            const dom = moduleInstance.getDom();
            
            expect(dom.innerHTML).toContain('Invalid data');
        });

        it('should handle different directions', () => {
            const directions = [
                { direction: 'DoubleUp', icon: 'angles-up' },
                { direction: 'SingleUp', icon: 'arrow-up' },
                { direction: 'FortyFiveUp', icon: 'arrow-up-right' },
                { direction: 'Flat', icon: 'arrow-right' },
                { direction: 'FortyFiveDown', icon: 'arrow-down-right' },
                { direction: 'SingleDown', icon: 'arrow-down' },
                { direction: 'DoubleDown', icon: 'angles-down' }
            ];

            directions.forEach(({ direction, icon }) => {
                moduleInstance.loaded = true;
                moduleInstance.error = null;
                moduleInstance.glucoseData = {
                    sg: 7,
                    direction: direction,
                    directionIcon: icon,
                    date: '20:30'
                };
                
                const dom = moduleInstance.getDom();
                expect(dom.querySelector('.direction-icon i').className).toBe(`fa-solid fa-${icon}`);
            });
        });

        it('should handle render errors gracefully', () => {
            moduleInstance.loaded = true;
            moduleInstance.error = null;
            // Vytvoření objektu, který projde validací, ale způsobí chybu při renderování
            moduleInstance.glucoseData = {
                sg: 7,
                direction: 'Flat',
                directionIcon: 'arrow-right',
                date: '20:30'
            };
            
            // Mock querySelector aby vyhodil chybu
            const originalCreateElement = document.createElement.bind(document);
            document.createElement = vi.fn(() => {
                const el = originalCreateElement('div');
                // Override appendChild to throw error
                el.appendChild = () => {
                    throw new Error('Test render error');
                };
                Object.defineProperty(el, 'className', {
                    set: () => {},
                    get: () => 'nightscout-wrapper'
                });
                Object.defineProperty(el, 'innerHTML', {
                    set: function(value) {
                        this._innerHTML = value;
                    },
                    get: function() {
                        return this._innerHTML || '';
                    }
                });
                el.querySelector = () => null;
                return el;
            });
            
            const dom = moduleInstance.getDom();
            
            expect(dom.innerHTML).toContain('Render error');
            
            // Restore
            document.createElement = originalCreateElement;
        });
    });

    describe('socketNotificationReceived', () => {
        beforeEach(() => {
            // Reset mock before each test in this suite
            moduleInstance.updateDom = vi.fn();
        });

        it('should update glucose data on DATA notification', () => {
            const testData = {
                sg: 8,
                direction: 'SingleUp',
                directionIcon: 'arrow-up',
                date: '21:00'
            };

            moduleInstance.socketNotificationReceived('DATA', testData);

            expect(moduleInstance.glucoseData).toEqual(testData);
            expect(moduleInstance.loaded).toBe(true);
            expect(moduleInstance.error).toBe(null);
            expect(moduleInstance.updateDom).toHaveBeenCalledWith(moduleInstance.config.animationSpeed);
        });

        it('should set error on ERROR notification', () => {
            moduleInstance.socketNotificationReceived('ERROR', 'API Error');

            expect(moduleInstance.error).toBe('API Error');
            expect(moduleInstance.loaded).toBe(true);
            expect(moduleInstance.updateDom).toHaveBeenCalledWith(moduleInstance.config.animationSpeed);
        });
    });

    describe('getStyles', () => {
        it('should return correct style files', () => {
            const styles = moduleInstance.getStyles();
            
            expect(styles).toContain('MMM-Nightscoutcz.css');
            expect(styles).toContain('font-awesome.css');
        });
    });
});
