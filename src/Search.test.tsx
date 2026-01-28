
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Supabase
vi.mock('./lib/supabase', () => {
    const mockWorks = [
        {
            id: '1', title: 'Existing Movie', release_year: 2024, genres: ['Drama'], poster_path: '/path.jpg', popularity: 100, type: 'movie',
            availability: [
                { platform: { slug: 'netflix', name: 'Netflix' }, link: '', is_exclusive: false }
            ]
        }
    ];

    return {
        supabase: {
            from: vi.fn(() => {
                const createBuilder = (filteredData: any[]) => ({
                    select: vi.fn(() => createBuilder(filteredData)),
                    eq: vi.fn((col: string, val: any) => {
                        // Simple eq mock
                        if (col === 'availability.platform_id') return createBuilder(filteredData);
                        if (col === 'type') {
                            const newData = filteredData.filter(item => item.type === val);
                            return createBuilder(newData);
                        }
                        return createBuilder(filteredData);
                    }),
                    ilike: vi.fn((col: string, pattern: string) => {
                        // pattern is %query%
                        const query = pattern.replace(/%/g, '').toLowerCase();
                        const newData = filteredData.filter(item => item.title.toLowerCase().includes(query));
                        return createBuilder(newData);
                    }),
                    order: vi.fn(() => createBuilder(filteredData)),
                    limit: vi.fn().mockResolvedValue({ data: filteredData, error: null }),
                    then: (resolve: any) => resolve({ data: filteredData, error: null })
                });
                return createBuilder(mockWorks);
            })
        }
    };
});

describe('Search Functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch
        global.fetch = vi.fn();
        vi.stubEnv('VITE_TMDB_API_KEY', 'test-key');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('searches from database first', async () => {
        render(<App />);
        // Wait for initial load
        await waitFor(() => expect(screen.getByText('Existing Movie')).toBeInTheDocument());

        const input = screen.getByPlaceholderText('영상 제목 검색...');
        const searchBtn = screen.getByText('검색');

        fireEvent.change(input, { target: { value: 'Existing' } });
        fireEvent.click(searchBtn);

        await waitFor(() => {
            // Should verify DB call or result
            // Since it's in DB, it should show "Found 1 results in database." status or just the item
            expect(screen.getByText('Existing Movie')).toBeInTheDocument();
            expect(screen.getByText(/Found 1 results in database/)).toBeInTheDocument();
        });
    });

    it('falls back to TMDB if not in DB', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Existing Movie')).toBeInTheDocument());

        const input = screen.getByPlaceholderText('영상 제목 검색...');
        const searchBtn = screen.getByText('검색');

        // Mock TMDB responses
        const mockTmdbSearch = {
            results: [
                { id: 100, title: 'New Movie', media_type: 'movie', release_date: '2025-01-01', poster_path: '/poster.jpg', popularity: 50 }
            ]
        };
        const mockTmdbProviders = {
            results: {
                KR: {
                    flatrate: [{ provider_name: 'Wavve' }]
                }
            }
        };

        (global.fetch as any)
            .mockResolvedValueOnce({
                json: () => Promise.resolve(mockTmdbSearch)
            })
            .mockResolvedValueOnce({
                json: () => Promise.resolve(mockTmdbProviders)
            });

        fireEvent.change(input, { target: { value: 'New Movie' } });
        fireEvent.click(searchBtn);

        await waitFor(() => {
            expect(screen.getByText('New Movie')).toBeInTheDocument();
            expect(screen.getByText(/Found availability via TMDB/)).toBeInTheDocument();
            expect(screen.getByText('Wavve')).toBeInTheDocument();
        });
    });

    it('shows not serviced message if not found in KR on TMDB', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Existing Movie')).toBeInTheDocument());

        const input = screen.getByPlaceholderText('영상 제목 검색...');
        const searchBtn = screen.getByText('검색');

        // Mock TMDB responses
        const mockTmdbSearch = {
            results: [
                { id: 101, title: 'Unknown Movie', media_type: 'movie', release_date: '2025-01-01', poster_path: '/poster.jpg', popularity: 50 }
            ]
        };
        const mockTmdbProviders = {
            results: {
                KR: {} // No providers
            }
        };

        (global.fetch as any)
            .mockResolvedValueOnce({
                json: () => Promise.resolve(mockTmdbSearch)
            })
            .mockResolvedValueOnce({
                json: () => Promise.resolve(mockTmdbProviders)
            });

        fireEvent.change(input, { target: { value: 'Unknown Movie' } });
        fireEvent.click(searchBtn);

        await waitFor(() => {
            screen.debug(); // Debug output
            expect(screen.getByText(/한국에는 서비스 되지 않고있을 확률이 높습니다/)).toBeInTheDocument();
            // expect(screen.queryByText('Unknown Movie')).not.toBeInTheDocument(); 
            // Wait, if no results, we clear the list. 
            // The message shows, but the grid should be empty or showing the message?
            // "No search results" text might appear in the grid area if searchResults is [].
        });
    });
});
