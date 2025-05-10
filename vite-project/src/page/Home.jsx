import React, { useEffect, useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import { fetchArticles, fetchArticlesByDate } from '../lib/api';
import Navbar from '../components/Navbar';

function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sortByDate, setSortByDate] = useState(null);  // Track date selection

  // Function to load articles based on date or offset
  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;

      // Fetch articles based on selected date or default (offset-based)
      if (sortByDate) {
        const year = sortByDate.getUTCFullYear();
        const month = String(sortByDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(sortByDate.getUTCDate()).padStart(2, '0');
        data = await fetchArticlesByDate(year, month, day);
      } else {
        data = await fetchArticles(offset, 10);
      }

      const { articles, hasMore } = data;
      setArticles(prev => (offset === 0 ? articles : [...prev, ...articles]));
      setHasMore(hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [offset, sortByDate]); // Fetch articles when offset or sortByDate changes

  const handleSortByDate = (date) => {
    setSortByDate(date);  // Set date when user picks a new date
    setOffset(0); // Reset offset when new date is picked
    setArticles([]); // Clear articles on date change
  };

  // Reset to today's articles when clicking logo/app name
  const handleResetToToday = () => {
    setSortByDate(null);  // Reset date filter to today
    setOffset(0); // Reset offset to load from the start
    setArticles([]); // Clear articles
  };

  

  return (
    <div className="min-h-screen">
      <Navbar onDateChange={handleSortByDate} selectedDate={sortByDate} />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-10">
          <h1
            className="text-4xl font-extrabold tracking-tight font-jakarta text-gray-900 cursor-pointer"
            onClick={handleResetToToday} // Reset to today when clicked
          >
            🗞️ Trending News
          </h1>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}


        <div className="flex flex-col  mb-10">
          {articles.map(article => (
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
              onClick={() => setOffset(prev => prev + 6)} // Load next set of articles
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
