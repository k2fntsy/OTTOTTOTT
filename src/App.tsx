import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './index.css';

export interface Work {
  id: string;
  title: string;
  release_year: number;
  genres: string[];
  poster_path: string;
  popularity: number;
  type: string;
  rank?: number;
  availability: {
    platform: { slug: string; name: string };
    link: string;
    is_exclusive: boolean;
    last_updated: string;
  }[];
}

function App() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Filter States
  // Filter States
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['movie', 'tv']);

  // Platform list for filter
  const platforms = [
    { slug: 'all', name: 'All' },
    { slug: 'netflix', name: 'Netflix' },
    { slug: 'watcha', name: 'Watcha' },
    { slug: 'tving', name: 'Tving' },
    { slug: 'wavve', name: 'Wavve' },
    { slug: 'disney', name: 'Disney+' },
    { slug: 'google', name: 'Google Play' },
    { slug: 'apple', name: 'Apple TV+' },
    { slug: 'amazon', name: 'Prime' },
  ];

  useEffect(() => {
    fetchWorks();
  }, [selectedPlatforms]); // Refetch when filter changes

  async function fetchWorks() {
    setLoading(true);

    let queryMovies = supabase.from('works').select(`
      *,
      availability!inner (
        link,
        is_exclusive,
        last_updated,
        platform:platforms!inner (slug, name)
      )
    `).eq('type', 'movie');

    let queryTvs = supabase.from('works').select(`
      *,
      availability!inner (
        link,
        is_exclusive,
        last_updated,
        platform:platforms!inner (slug, name)
      )
    `).eq('type', 'tv');

    // We fetch global TOP 100 Movies + TOP 100 TVs regardless of platform selection
    // to maintain consistent global rankings (1-200).
    // Platform filtering will be handled client-side in filteredWorks.

    const limit = 100;

    const [movies, tvs] = await Promise.all([
      queryMovies.order('popularity', { ascending: false }).limit(limit),
      queryTvs.order('popularity', { ascending: false }).limit(limit)
    ]);

    if (movies.error) console.error('Error fetching movies:', movies.error);
    if (tvs.error) console.error('Error fetching tvs:', tvs.error);

    let combined = [...(movies.data || []), ...(tvs.data || [])];

    combined.sort((a, b) => b.popularity - a.popularity);

    // Assign Rank 1 to N
    combined = combined.map((w, idx) => ({ ...w, rank: idx + 1 }));

    setWorks(combined);

    // Find latest date from loaded data
    let maxDate = 0;
    combined.forEach(w => {
      w.availability?.forEach((a: any) => {
        const t = new Date(a.last_updated).getTime();
        if (t > maxDate) maxDate = t;
      });
    });
    if (maxDate > 0) setLastUpdated(new Date(maxDate).toISOString().split('T')[0]);

    setLoading(false);
  }

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Work[] | null>(null); // null means no search active
  const [searchStatus, setSearchStatus] = useState<string>(''); // For messages like "Checking TMDB..."

  const getPlatformIcon = (slug: string) => {
    // Simple color mapping for badges
    const colors: Record<string, string> = {
      netflix: '#E50914',
      watcha: '#FF0558',
      wavve: '#1351f9',
      tving: '#FF153C',
      disney: '#113CCF',
      google: '#34A853',
      apple: '#000000',
      amazon: '#00A8E1',
    };
    return colors[slug] || '#666';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults(null);
      setSearchStatus('');
      return;
    }

    setLoading(true);
    setSearchStatus('Searching TMDB for Korean availability...');

    // Direct to TMDB
    await searchTmdb(searchTerm);
    setLoading(false);
  };

  const searchTmdb = async (query: string) => {
    // Fallback for testing (checking process to avoid browser crash)
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) {
      setSearchStatus('Error: API Key missing');
      return;
    }

    try {
      // Search for multi (movie/tv)
      const searchRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=ko-KR&query=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();

      if (!searchData.results || searchData.results.length === 0) {
        setSearchResults([]);
        setSearchStatus('');
        return;
      }

      // Filter for movie/tv and check providers
      const validResults: Work[] = [];

      for (const item of searchData.results) {
        if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;

        // Check providers (Flatrate, Buy, Rent)
        const provRes = await fetch(`https://api.themoviedb.org/3/${item.media_type}/${item.id}/watch/providers?api_key=${apiKey}`);
        const provData = await provRes.json();
        const kr = provData.results?.KR || {};
        const krProviders = [...(kr.flatrate || []), ...(kr.buy || []), ...(kr.rent || [])];

        if (krProviders.length > 0) {
          // Construct Work object
          const work: Work = {
            id: `tmdb-${item.id}`,
            title: item.title || item.name,
            release_year: new Date(item.release_date || item.first_air_date).getFullYear(),
            genres: [], // Skip for now
            poster_path: item.poster_path,
            popularity: item.popularity,
            type: item.media_type,
            availability: krProviders.map((p: any) => {
              const pName = p.provider_name.toLowerCase();
              let slug = 'tmdb-found';
              if (pName.includes('netflix')) slug = 'netflix';
              else if (pName.includes('google')) slug = 'google';
              else if (pName.includes('tving')) slug = 'tving';
              else if (pName.includes('wavve')) slug = 'wavve';
              else if (pName.includes('disney')) slug = 'disney';
              else if (pName.includes('apple')) slug = 'apple';
              else if (pName.includes('watcha')) slug = 'watcha';
              else if (pName.includes('amazon')) slug = 'amazon';

              return {
                platform: { slug, name: p.provider_name },
                link: '',
                is_exclusive: false,
                last_updated: new Date().toISOString()
              };
            })
          };
          validResults.push(work);
        }
      }

      if (validResults.length > 0) {
        setSearchResults(validResults);
        setSearchStatus(`TMDB 검색 결과 (제공 중: ${validResults.length}건)`);
      } else {
        setSearchResults([]);
        setSearchStatus('');
      }

    } catch (err) {
      console.error(err);
      setSearchStatus('Error searching TMDB.');
    }
  };

  const handlePlatformClick = (slug: string) => {
    // Reset search on navigation
    setSearchTerm('');
    setSearchResults(null);
    setSearchStatus('');

    if (slug === 'all') {
      setSelectedPlatforms([]);
      return;
    }

    // Single select mode
    setSelectedPlatforms([slug]);
  };

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const renderWorkCard = (work: Work) => {
    return (
      <div key={work.id} className="work-card">
        <div className="poster-wrapper">
          {work.rank && <div className="rank-badge">{work.rank}</div>}
          {work.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${work.poster_path}`}
              alt={work.title}
              loading="lazy"
            />
          ) : (
            <div className="no-poster">No Image</div>
          )}
        </div>

        <div className="work-info">
          <div className="meta">
            <span className="year">{work.release_year}</span>
            <span className="genres">{work.genres?.slice(0, 2).join(', ')}</span>
            <span className="type-badge">{work.type === 'movie' ? 'Movie' : 'TV'}</span>
          </div>
          <h3>{work.title}</h3>

          <div className="platforms-list">
            {work.availability?.map((av: any, idx) => {
              const realLink = av.link;

              return (
                <span
                  key={idx}
                  className="platform-badge"
                  style={{
                    backgroundColor: getPlatformIcon(av.platform.slug),
                    cursor: realLink ? 'pointer' : 'default'
                  }}
                  onClick={() => realLink && realLink !== 'undefined' && window.open(realLink, '_blank')}
                >
                  {av.platform.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Filter Logic
  const filteredWorks = works.filter(work => {
    // 1. Filter by Platform
    let passesPlatform = false;

    if (selectedPlatforms.length === 0) {
      // "All" View -> Always pass platform check
      passesPlatform = true;
    }
    // Normal Filtering
    else {
      const hasPlatform = work.availability.some(av => selectedPlatforms.includes(av.platform.slug));
      if (hasPlatform) passesPlatform = true;
    }

    if (!passesPlatform) return false;

    // 2. Filter by Type
    const hasType = selectedTypes.includes(work.type);
    if (!hasType) return false;


    return true;
  });

  // if (loading) return <div className="loading">Loading contents...</div>; 

  return (
    <div className="container">
      <header className="app-header">
        <h1>요즘 뭐 봄, 어디서 봄</h1>
        <p className="subtitle">
          한국 OTT 인기 작품 1~ 200 위 순위표
          <span className="info-icon" title="">i</span>
        </p>
        <p className="info-text" style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.2rem' }}>
          OTT 통합 화제성 및 트랜드 순위 : TMDB 한국 통계 기준 | 순위 갱신: {lastUpdated || '확인 중...'} | 매일 아침 06시 자동 갱신
        </p>

        <div className="filters">
          {/* Type Toggles */}
          <div className="type-toggles" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              className={`filter-btn ${selectedTypes.includes('movie') ? 'active' : ''}`}
              onClick={() => handleTypeToggle('movie')}
            >
              Movie
            </button>
            <button
              className={`filter-btn ${selectedTypes.includes('tv') ? 'active' : ''}`}
              onClick={() => handleTypeToggle('tv')}
            >
              TV
            </button>
          </div>

          <div className="filter-buttons">
            {platforms.map(p => (
              <button
                key={p.slug}
                className={`filter-btn ${(p.slug === 'all' && selectedPlatforms.length === 0) ||
                  selectedPlatforms.includes(p.slug) ? 'active' : ''
                  }`}
                onClick={() => handlePlatformClick(p.slug)}
              >
                {p.name}
              </button>
            ))}
          </div>

        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="search-bar" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="영상 제목 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff' }}
          />
          <button type="submit" className="filter-btn active">검색</button>
        </form>
        {searchStatus && <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#aaa' }}>{searchStatus}</p>}
      </header>

      <div className="works-content" style={{ position: 'relative', minHeight: '300px' }}>
        {loading && (
          <div className="loading-overlay" style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex', justifyContent: 'center', paddingTop: '100px',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div style={{
              width: '40px', height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #E50914',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}
        <div className="works-grid" style={{
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out',
          pointerEvents: loading ? 'none' : 'auto'
        }}>
          {(searchResults !== null ? searchResults : filteredWorks).length === 0 && !loading ? (
            <div className="no-results" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#aaa', fontSize: '1.1rem' }}>
              {searchResults !== null ? '한국에는 서비스 되지 않을 가능성이 높습니다.' : '조건에 맞는 작품이 없습니다.'}
            </div>
          ) : (searchResults !== null ? searchResults : filteredWorks).map(work => renderWorkCard(work))}
        </div>
      </div>
      <style>{`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
