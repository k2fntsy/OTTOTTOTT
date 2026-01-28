import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase
// Mock Supabase
vi.mock('./lib/supabase', () => {
    const mockWorks = [
        {
            id: '1', title: 'Show A', release_year: 2024, genres: ['Drama'], poster_path: '/path.jpg', popularity: 100, type: 'movie',
            availability: [
                { platform: { slug: 'netflix', name: 'Netflix' }, link: '', is_exclusive: false },
                { platform: { slug: 'watcha', name: 'Watcha' }, link: '', is_exclusive: false }
            ]
        },
        {
            id: '2', title: 'Show B', release_year: 2023, genres: ['Comedy'], poster_path: '/path2.jpg', popularity: 90, type: 'movie',
            availability: [{ platform: { slug: 'netflix', name: 'Netflix' }, link: '', is_exclusive: true }]
        },
        {
            id: '3', title: 'Show C', release_year: 2022, genres: ['Action'], poster_path: '/path3.jpg', popularity: 80, type: 'tv',
            availability: [{ platform: { slug: 'tving', name: 'Tving' }, link: '', is_exclusive: true }]
        },
        {
            id: '4', title: 'Show D (Other Only)', release_year: 2021, genres: ['Docu'], poster_path: '/path4.jpg', popularity: 70, type: 'movie',
            availability: [{ platform: { slug: 'other', name: 'Other' }, link: '', is_exclusive: true }]
        },
        {
            id: '5', title: 'Show E (Other + Netflix)', release_year: 2020, genres: ['Docu'], poster_path: '/path5.jpg', popularity: 60, type: 'movie',
            availability: [
                { platform: { slug: 'other', name: 'Other' }, link: '', is_exclusive: false },
                { platform: { slug: 'netflix', name: 'Netflix' }, link: '', is_exclusive: false }
            ]
        },
        {
            id: '6', title: 'Show F (Other Metadata)', release_year: 2019, genres: ['Indie'], poster_path: '/path6.jpg', popularity: 50, type: 'movie',
            availability: [
                { platform: { slug: 'other', name: 'Other' }, link: 'http://url|Google Play', is_exclusive: true }
            ]
        }
    ];

    return {
        supabase: {
            from: vi.fn(() => {
                const createBuilder = (filteredData: any[]) => ({
                    select: vi.fn(() => createBuilder(filteredData)),
                    eq: vi.fn((col: string, val: any) => {
                        const newData = filteredData.filter(item => item[col] === val);
                        return createBuilder(newData);
                    }),
                    order: vi.fn(() => createBuilder(filteredData)),
                    limit: vi.fn().mockResolvedValue({ data: filteredData, error: null })
                });
                return createBuilder(mockWorks);
            })
        }
    };
});
describe('App Filter Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all items by default', async () => {
        render(<App />);
        await waitFor(() => {
            expect(screen.getByText('Show A')).toBeInTheDocument();
            expect(screen.getByText('Show B')).toBeInTheDocument();
            expect(screen.getByText('Show C')).toBeInTheDocument();
        });
    });

    it('filters by platform', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Show A')).toBeInTheDocument());

        const netflixBtn = screen.getByRole('button', { name: 'Netflix' });
        fireEvent.click(netflixBtn);

        await waitFor(() => {
            expect(screen.getByText('Show A')).toBeInTheDocument();
            expect(screen.getByText('Show B')).toBeInTheDocument();
            expect(screen.queryByText('Show C')).not.toBeInTheDocument();
        });
    });

    it('filters by exclusive only', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Show A')).toBeInTheDocument());

        const exclusiveCheckbox = screen.getByLabelText('독점작만 보기');
        fireEvent.click(exclusiveCheckbox);

        await waitFor(() => {
            expect(screen.queryByText('Show A')).not.toBeInTheDocument();
            expect(screen.getByText('Show B')).toBeInTheDocument();
            expect(screen.getByText('Show C')).toBeInTheDocument();
        });
    });

    it('switches between platforms (Single Select)', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Show A')).toBeInTheDocument());

        const netflixBtn = screen.getByRole('button', { name: 'Netflix' });
        const tvingBtn = screen.getByRole('button', { name: 'Tving' });

        // Select Netflix
        fireEvent.click(netflixBtn);

        await waitFor(() => {
            expect(screen.getByText('Show A')).toBeInTheDocument(); // Netflix
            expect(screen.getByText('Show B')).toBeInTheDocument(); // Netflix
            expect(screen.queryByText('Show C')).not.toBeInTheDocument(); // Tving
        });

        // Select Tving (should override Netflix)
        fireEvent.click(tvingBtn);

        await waitFor(() => {
            expect(screen.queryByText('Show A')).not.toBeInTheDocument(); // Netflix
            expect(screen.getByText('Show C')).toBeInTheDocument(); // Tving
        });
    });

    it('filters by platform AND exclusive', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Show A')).toBeInTheDocument());

        const netflixBtn = screen.getByRole('button', { name: 'Netflix' });
        const exclusiveCheckbox = screen.getByLabelText('독점작만 보기');

        // Select Netflix
        fireEvent.click(netflixBtn);

        // Select Exclusive
        fireEvent.click(exclusiveCheckbox);

        await waitFor(() => {
            // Show A: Netflix (Match) but Not Exclusive (length 2) -> Hide
            expect(screen.queryByText('Show A')).not.toBeInTheDocument();
            // Show B: Netflix (Match) and Exclusive -> Show
            expect(screen.getByText('Show B')).toBeInTheDocument();
        });
    });

    it('filters by type (Movie/TV toggle)', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Show A')).toBeInTheDocument());

        const movieBtn = screen.getByRole('button', { name: 'Movie' });
        const tvBtn = screen.getByRole('button', { name: 'TV' });

        // Both active by default, so all should be visible
        expect(screen.getByText('Show A')).toBeInTheDocument(); // Movie
        expect(screen.getByText('Show C')).toBeInTheDocument(); // TV

        // Toggle OFF Movie
        fireEvent.click(movieBtn);

        await waitFor(() => {
            expect(screen.queryByText('Show A')).not.toBeInTheDocument(); // Movie Hidden
            expect(screen.getByText('Show C')).toBeInTheDocument(); // TV Visible
        });

        // Toggle OFF TV
        fireEvent.click(tvBtn);

        await waitFor(() => {
            expect(screen.queryByText('Show C')).not.toBeInTheDocument(); // TV Hidden
        });

        // Toggle ON Movie
        fireEvent.click(movieBtn);

        await waitFor(() => {
            expect(screen.getByText('Show A')).toBeInTheDocument(); // Movie Visible
        });
    });
    it('filters by strict Other logic', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Show A')).toBeInTheDocument());

        const otherBtn = screen.getByRole('button', { name: 'Other' });
        fireEvent.click(otherBtn);

        await waitFor(() => {
            expect(screen.queryByText('Show A')).not.toBeInTheDocument(); // Netflix/Watcha
            expect(screen.queryByText('Show B')).not.toBeInTheDocument(); // Netflix
            expect(screen.queryByText('Show C')).not.toBeInTheDocument(); // Tving

            // Show D is ONLY on Other -> Should be visible
            expect(screen.getByText('Show D (Other Only)')).toBeInTheDocument();

            // Show E is on Other AND Netflix -> Should be HIDDEN (Strict logic)
            expect(screen.queryByText('Show E (Other + Netflix)')).not.toBeInTheDocument();
        });
    });

    it('displays provider name for Other platform', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Show A')).toBeInTheDocument());

        const otherBtn = screen.getByRole('button', { name: 'Other' });
        fireEvent.click(otherBtn);

        await waitFor(() => {
            // Show F should be visible
            expect(screen.getByText('Show F (Other Metadata)')).toBeInTheDocument();

            // Check for the badge text "Other (Google Play)"
            // Use regex for safer matching across text nodes
            expect(screen.getByText(/Other.*Google Play/)).toBeInTheDocument();
        });
    });
});
