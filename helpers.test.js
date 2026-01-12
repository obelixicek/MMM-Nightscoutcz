import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDirectionIcon, fetchData } from './helpers.cjs';

describe('getDirectionIcon', () => {
    it('should return "angles-up" for DoubleUp', () => {
        expect(getDirectionIcon('DoubleUp')).toBe('angles-up');
    });

    it('should return "arrow-up" for SingleUp', () => {
        expect(getDirectionIcon('SingleUp')).toBe('arrow-up');
    });

    it('should return "arrow-up-right" for FortyFiveUp', () => {
        expect(getDirectionIcon('FortyFiveUp')).toBe('arrow-turn-up');
    });

    it('should return "arrow-right" for Flat', () => {
        expect(getDirectionIcon('Flat')).toBe('arrow-right');
    });

    it('should return "arrow-down-right" for FortyFiveDown', () => {
        expect(getDirectionIcon('FortyFiveDown')).toBe('arrow-turn-down');
    });

    it('should return "arrow-down" for SingleDown', () => {
        expect(getDirectionIcon('SingleDown')).toBe('arrow-down');
    });

    it('should return "angles-down" for DoubleDown', () => {
        expect(getDirectionIcon('DoubleDown')).toBe('angles-down');
    });

    it('should return "circle" for unknown direction', () => {
        expect(getDirectionIcon('Unknown')).toBe('circle');
    });

    it('should return "circle" for null', () => {
        expect(getDirectionIcon(null)).toBe('circle');
    });

    it('should return "circle" for undefined', () => {
        expect(getDirectionIcon(undefined)).toBe('circle');
    });
});

describe('fetchData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should fetch and transform data correctly', async () => {
        const mockApiResponse = [
            {
                sgv: 126,
                direction: 'Flat',
                dateString: '2026-01-12T10:30:00.000Z'
            },
            {
                sgv: 120,
                direction: 'FortyFiveDown',
                dateString: '2026-01-12T10:25:00.000Z'
            }
        ];

        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: async () => mockApiResponse,
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: false
        };

        const result = await fetchData(config);

        expect(fetch).toHaveBeenCalledWith(
            'https://testuser.nightscout.cz/API/V1/entries?count=3',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Accept': 'application/json'
                })
            })
        );

        expect(result).toHaveProperty('sg', 7); // 126/18 = 7
        expect(result).toHaveProperty('direction', 'Flat');
        expect(result).toHaveProperty('directionIcon', 'arrow-right');
        expect(result).toHaveProperty('date');
    });

    it('should throw error when API returns non-200 status', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: false,
                status: 401,
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: false
        };

        await expect(fetchData(config)).rejects.toThrow('HTTP error! status: 401');
    });

    it('should throw error when API returns non-array data', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: async () => ({ error: 'Invalid data' }),
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: false
        };

        await expect(fetchData(config)).rejects.toThrow('Wrong data format received from API');
    });

    it('should throw error when API returns empty array', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: async () => [],
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: false
        };

        await expect(fetchData(config)).rejects.toThrow('No data entries received from API');
    });

    it('should convert sgv correctly from mg/dL to mmol/L', async () => {
        const mockApiResponse = [{
            sgv: 180,  // 180/18 = 10 mmol/L
            direction: 'SingleUp',
            dateString: '2026-01-12T10:30:00.000Z'
        }];

        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: async () => mockApiResponse,
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: false
        };

        const result = await fetchData(config);
        expect(result.sg).toBe(10);
    });

    it('should handle different directions correctly', async () => {
        const mockApiResponse = [{
            sgv: 90,
            direction: 'DoubleDown',
            dateString: '2026-01-12T10:30:00.000Z'
        }];

        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: async () => mockApiResponse,
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: false
        };

        const result = await fetchData(config);
        expect(result.directionIcon).toBe('angles-down');
    });

    it('should show only time when showDate is false', async () => {
        const mockApiResponse = [{
            sgv: 120,
            direction: 'Flat',
            dateString: '2026-01-12T10:30:00.000Z'
        }];

        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: async () => mockApiResponse,
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: false
        };

        const result = await fetchData(config);
        // Time only should not contain year and should be in HH:MM format
        expect(result.date).not.toContain('2026');
        expect(result.date).toMatch(/^\d{1,2}:\d{2}$/); // Format like "11:30" or "9:30"
    });

    it('should show date and time when showDate is true', async () => {
        const mockApiResponse = [{
            sgv: 120,
            direction: 'Flat',
            dateString: '2026-01-12T10:30:00.000Z'
        }];

        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: async () => mockApiResponse,
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: true
        };

        const result = await fetchData(config);
        // Full date should contain year
        expect(result.date).toContain('2026');
    });

    it('should use correct API secret hash', async () => {
        const mockApiResponse = [{
            sgv: 120,
            direction: 'Flat',
            dateString: '2026-01-12T10:30:00.000Z'
        }];

        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: async () => mockApiResponse,
            })
        );

        const config = {
            username: 'testuser',
            secret: 'testsecret',
            locale: 'cs-CZ',
            showDate: false
        };

        await fetchData(config);

        // SHA1 hash of 'testsecret'
        const expectedHash = 'dcc4a6fbee930b0b34cf9fc2131b6b70c89e6b9b';
        
        const callArgs = fetch.mock.calls[0];
        expect(callArgs[0]).toBe('https://testuser.nightscout.cz/API/V1/entries?count=3');
        expect(callArgs[1]).toEqual({
            headers: {
                'API-SECRET': expectedHash,
                'Accept': 'application/json'
            }
        });
    });
});
