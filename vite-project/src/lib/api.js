const API_BASE_URL = import.meta.env.VITE_API_URL ;

export const fetchArticles = async (offset = 0, limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/articles?offset=${offset}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate response against Supabase schema
    if (!data || !Array.isArray(data.articles)) {
      console.error('Invalid API response:', data);
      throw new Error('API returned unexpected format');
    }
    
    // Transform data to match frontend expectations
    const normalizedArticles = data.articles.map(article => ({
      id: article.id,
      headline: article.headline,  // Using 'headline' from Supabase
      content: article.content,
      url: article.url,
      image_url: article.image_url,
      description: article.description,
      source: article.source,
      category: article.category || 'general', // Default if missing
      published_At: article.published_at,
      isKidFriendly: article.is_kid_friendly,
      entities: article.entities || [],
      summary: article.summary || "",          // <- New
      audio_url: article.audio_url || null ,
      created_at: article.created_at || null,
    }));
    
    return {
      articles: normalizedArticles,
      hasMore: data.has_more || false
    };
    
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw error;
  }
};