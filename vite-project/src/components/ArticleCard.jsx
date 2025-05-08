import React from "react"
import { Link } from "react-router-dom"
export default function ArticleCard({ article }) {
  return (
    <Link to={`/article/${article.id}`} className="block">
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.headline}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 flex flex-col justify-between flex-grow">
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2 break-words">
          {article.headline}
        </h2>
       
        <div className="text-xs text-gray-400">
          {article.source} &middot;{" "}
          {new Date(article.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
    </Link>
  )
}
