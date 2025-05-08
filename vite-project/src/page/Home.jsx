import React, { useEffect, useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import { fetchArticles } from '../lib/api';

function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const { articles, hasMore } = await fetchArticles(offset, 10);
        setArticles(prev => offset === 0 ? articles : [...prev, ...articles]);
        setHasMore(hasMore);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, [offset]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">
            🗞️ Trending News
          </h1>
          
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.filter(article => article.content && article.image_url).map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {hasMore && !loading && (
          <div className="text-center mt-10">
            <button
              onClick={() => setOffset(prev => prev + 6)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105"
            >
              Load More Articles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
