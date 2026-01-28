import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
    console.error("❌ TMDB_API_KEY is missing in .env");
    process.exit(1);
}

const tmdb = axios.create({
    baseURL: BASE_URL,
    params: {
        api_key: TMDB_API_KEY,
        language: 'ko-KR',
        region: 'KR',
    },
});

export interface TMDBWork {
    id: number;
    title?: string;
    name?: string; // For TV shows
    original_title?: string;
    original_name?: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    genre_ids: number[];
    release_date?: string;
    first_air_date?: string;
    origin_country?: string[];
    popularity: number;
}

export const fetchPopular = async (type: 'movie' | 'tv', page = 1) => {
    const { data } = await tmdb.get(`/${type}/popular`, { params: { page } });
    return data.results as TMDBWork[];
};

export const discoverKRPopular = async (type: 'movie' | 'tv', page = 1) => {
    // Uses discover with watch_region=KR to find what's actually popular in Korea
    const { data } = await tmdb.get(`/discover/${type}`, {
        params: {
            page,
            watch_region: 'KR',
            sort_by: 'popularity.desc'
        }
    });
    return data.results as TMDBWork[];
};

export const fetchGenres = async (type: 'movie' | 'tv') => {
    const { data } = await tmdb.get(`/genre/${type}/list`);
    return data.genres as { id: number; name: string }[];
};

export const fetchWatchProviders = async (type: 'movie' | 'tv', id: number) => {
    const { data } = await tmdb.get(`/${type}/${id}/watch/providers`);
    // KR region
    return data.results?.KR || null;
};

export const fetchDetails = async (type: 'movie' | 'tv', id: number) => {
    const { data } = await tmdb.get(`/${type}/${id}`);
    return data;
}
