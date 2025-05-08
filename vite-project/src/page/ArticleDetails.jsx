// import { useParams } from "react-router-dom";
// import { useState, useEffect } from "react";

// export default function ArticlePage() {
//   const { id } = useParams();
//   const [article, setArticle] = useState(null);
//   const [summary, setSummary] = useState("");
//   const [audioUrl, setAudioUrl] = useState("");

//   useEffect(() => {
//     fetch(`http://localhost:8000/article/${id}`)
//       .then(res => res.json())
//       .then(data => setArticle(data));
//   }, [id]);

//   const fetchSummary = async () => {
//     const res = await fetch(`http://localhost:8000/article/${id}/summary?include_audio=true`);
//     const data = await res.json();
//     setSummary(data.summary);
//     setAudioUrl(data.audio_url);
//   };

//   if (!article) return <div>Loading...</div>;

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
//       <p className="text-gray-700 mb-6">{article.content}</p>

//       <button onClick={fetchSummary} className="px-4 py-2 bg-blue-600 text-white rounded mb-4">
//         Get Summary
//       </button>

//       {summary && (
//         <div className="bg-gray-100 p-4 rounded mb-4">
//           <h2 className="font-semibold mb-2">Summary:</h2>
//           <p>{summary}</p>
//         </div>
//       )}

//       {audioUrl && (
//         <audio controls className="mt-4">
//           <source src={audioUrl} type="audio/mpeg" />
//           Your browser does not support the audio element.
//         </audio>
//       )}
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/article/${id}`);
        const data = await response.json();

        if (response.ok) {
          setArticle(data);
        } else {
          setError(data.error || "Failed to fetch article");
        }
      } catch (err) {
        setError("Error fetching article");
        console.error(err);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/article/${id}/summary`);
      const data = await response.json();

      if (response.ok) {
        setSummary(data.summary);
        setShowSummary(true);
      } else {
        setError(data.error || "Failed to fetch summary");
      }
    } catch (err) {
      setError("Error fetching summary");
      console.error(err);
    }
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!article) return <div className="p-4 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-4 text-white">
      <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-lg shadow-lg p-6">
        <button
          onClick={() => navigate("/")}
          className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-2">{article.headline}</h1>
        <div className="text-sm text-gray-500 mb-4">
          {article.source} ·{" "}
          {new Date(article.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>

        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.headline}
            className="mb-4 w-full h-64 object-cover rounded"
          />
        )}

        {showSummary ? (
          <>
            <div className="bg-slate-100 p-4 rounded mb-4">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Summary:</h2>
              <p className="whitespace-pre-wrap break-words text-slate-700">
                {summary}
              </p>
            </div>
            <button
              onClick={() => setShowSummary(false)}
              className="mb-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow"
            >
              Close Summary
            </button>
          </>
        ) : (
          <button
            onClick={fetchSummary}
            className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
          >
            Get Summary
          </button>
        )}

        {!showSummary && (
          <p className="text-gray-800 leading-relaxed mb-6">{article.content}</p>
        )}

        
      </div>
    </div>
  );
}
