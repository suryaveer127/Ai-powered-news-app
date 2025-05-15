import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [summary, setSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/article/${id}`);
        const data = await res.json();
        if (res.ok) setArticle(data);
        else setError(data.error || "Failed to fetch article");
      } catch (err) {
        setError("Error fetching article");
      }
    };

    fetchArticle();
  }, [id]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/article/${id}/summary`);
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setShowSummary(true);
      } else {
        setError(data.error || "Failed to fetch summary");
      }
    } catch (err) {
      setError("Error fetching summary");
    }
  };

  const fetchAudio = async () => {
    try {
      setError("");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/article/${id}/summary/audio`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load audio");
      }

      if (data.audio_url) {
        setAudioUrl(data.audio_url);
        if (audioRef.current) {
          audioRef.current.src = data.audio_url;
          audioRef.current.load();
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(e => {
            console.error("Auto-play failed:", e);
            setIsPlaying(false);
          });
        }
      }
    } catch (err) {
      setError(err.message || "Error fetching audio");
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error("Error playing audio: ", error);
      });
    }
  };

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      const playAudio = async () => {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Error playing audio: ", error);
        }
      };
      playAudio();
    }
  }, [audioUrl]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!article) return <div className="text-white p-4">Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 text-white">
        <div className="max-w-3xl mx-auto bg-white/30 text-gray-900 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-6">
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
                <p className="whitespace-pre-wrap break-words text-slate-700">{summary}</p>
              </div>

              <div className="flex flex-wrap gap-4 mb-4">
                <button
                  onClick={() => setShowSummary(false)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow flex items-center gap-2"
                >
                  Close Summary
                </button>

                {!audioUrl && (
                  <button
  onClick={fetchAudio}
  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow flex items-center gap-2 text-lg"
>
  <FaVolumeUp className="text-xl" /> Get Audio
</button>
                )}

                {audioUrl && (
                  <button
  onClick={toggleAudio}
  className="border-2 border-gray-600 text-gray-600 font-bold p-1 text-xl rounded-full hover:text-blue-300 hover:border-blue-300 cursor-pointer"
>
  {isPlaying ? <FaPause className="text-xl" /> : <FaPlay className="text-xl" />}
 
</button>
                )}
              </div>

              {audioUrl && (
                <audio ref={audioRef} className="w-full" hidden>
                  <source src={audioUrl} type="audio/mpeg" />
                  <source src={audioUrl} type="audio/ogg" />
                  Your browser does not support the audio element.
                </audio>
              )}
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
    </>
  );
}
