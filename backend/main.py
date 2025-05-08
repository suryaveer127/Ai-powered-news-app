from fastapi import FastAPI, Query
from dotenv import load_dotenv
import os
import ssl
import asyncpg
import logging
from typing import Optional
from azure_audio_service import generate_audio_from_text
from fastapi.middleware.cors import CORSMiddleware
import uuid
from summarizer import summarize_long_article
import sys
print(sys.executable)
# Load environment variables from .env file
load_dotenv()

# Use DATABASE_URL for consistency
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.bzvinlggnrivnycbfkjv:jaishreeram@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")

# Create an SSL context for secure connection since Supabase requires SSL
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Add TTS configuration
TTS_API_KEY = os.getenv("TTS_API_KEY")
TTS_API_URL = os.getenv("TTS_API_URL", "https://api.elevenlabs.io/v1/text-to-speech")

async def connect_to_db():
    """Establish a connection to the database using asyncpg"""
    try:
        if not DATABASE_URL:
            raise ValueError("Database URL not configured")
        pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            ssl=ssl_context,
            command_timeout=30,
            min_size=1,
            max_size=2,
            timeout=30,
            max_inactive_connection_lifetime=10,
            statement_cache_size=0,  # For PgBouncer compatibility
        )
        # Test connection
        async with pool.acquire() as conn:
            await conn.fetchval('SELECT 1')
        logging.info("Database connection established successfully")
        return pool
    except (asyncpg.PostgresError, ValueError, AttributeError) as e:
        raise ConnectionError(f"Failed to connect to database: {str(e)}")

app = FastAPI()
# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:5173",  # Default Vite frontend port
    "http://127.0.0.1",
    "http://127.0.0.1:5173",
    # Add your production frontend URLs here when deployed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
    expose_headers=["*"]  
)

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify database connectivity.
    """
    pool = None
    try:
        pool = await connect_to_db()
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            if result == 1:
                return {"status": "ok", "db": "connected"}
            else:
                return {"status": "error", "db": "unexpected result"}
    except Exception as e:
        return {"status": "error", "db": str(e)}
    finally:
        if pool:
            await pool.close()




# Route to fetch news articles by category
@app.get("/category/{category}")
async def get_news_by_category(category: str):
    pool = None
    try:
        # Connect to the database
        pool = await connect_to_db()
        
        # Fetch news articles for the specified category
        async with pool.acquire() as conn:
            query = """
                SELECT * FROM articles 
                WHERE category = $1
            """
            articles = await conn.fetch(query, category)
        
        return {"articles": articles}
    
    except Exception as e:
        logging.error(f"Error fetching articles: {str(e)}")
        return {"error": str(e)}
    finally:
        # Close the connection pool
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")

@app.get("/article/{id}")
async def get_article_by_id(id: uuid.UUID):
    pool = None
    try:
        # Connect to the database
        pool = await connect_to_db()
        
        # Fetch the article for the specified ID
        async with pool.acquire() as conn:
            query = "SELECT id, headline, content, image_url,  source, created_at FROM articles WHERE id = $1"
            article = await conn.fetchrow(query, id)
            if not article:
                return {"error": "Article not found"}
            return dict(article)
    
    except Exception as e:
        logging.error(f"Error fetching article: {str(e)}")
        return {"error": str(e)}
    finally:
        # Close the connection pool
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")


# Route to fetch article summary and generate TTS audio URL
@app.get("/article/{id}/summary")
async def get_article_summary(id: uuid.UUID , include_audio: Optional[bool] = Query(False, description="Whether to include TTS audio URL")):
    pool = None
    try:
        pool = await connect_to_db()
        
        async with pool.acquire() as conn:
            # First get the article summary
            summary_query = """
                SELECT s.summary, a.id as article_id 
                FROM summaries s
                JOIN articles a ON s.article_id = a.id
                WHERE a.id = $1
            """
            summary_result = await conn.fetchrow(summary_query, id)
            
            if not summary_result:
                # If summary not found, generate it using summarizer
                article_query = "SELECT content FROM articles WHERE id = $1"
                article_row = await conn.fetchrow(article_query, id)
                if not article_row:
                    return {"error": "Article not found"}
                article_content = article_row['content']
                # Use the summarizer from summarizer.py
                summary = summarize_long_article(article_content)
                # Store the generated summary
                insert_summary_query = """
                    INSERT INTO summaries (article_id, summary)
                    VALUES ($1, $2)
                    ON CONFLICT (article_id) DO UPDATE SET summary = EXCLUDED.summary
                """
                # Make sure there is a UNIQUE constraint or PRIMARY KEY on article_id in the summaries table.
                # If not, you must add one in your database:
                # ALTER TABLE summaries ADD CONSTRAINT summaries_article_id_key UNIQUE(article_id);
                await conn.execute(insert_summary_query, id, summary)
                article_id = id
            else:
                summary = summary_result['summary']
                article_id = summary_result['article_id']
            
            response_data = {"summary": summary}
            
            # If audio is requested, generate and store the audio URL
            if include_audio:
                # Check if we already have an audio URL for this article
                audio_query = """
                    SELECT audio_url FROM audio_requests 
                    WHERE article_id = $1 
                    ORDER BY requested_at DESC 
                    LIMIT 1
                """
                existing_audio = await conn.fetchval(audio_query, article_id)
                
                if existing_audio:
                    response_data["audio_url"] = existing_audio
                else:
                    # Generate new audio URL using Azure TTS service
                    try:
                        audio_url_path = generate_audio_from_text(summary)
                        file_name = os.path.basename(audio_url_path)
                        # Instead of storing audio bytes, upload the file to a public file server or storage bucket,
                        # then store the public URL in the audio_requests table.
                        # For now, assume you have uploaded the file and have a public_url:
                        # (You must implement the upload logic as per your storage solution)
                        public_url = f"https://your-domain.com/audio-files/{file_name}"
                        insert_audio_query = """
                            INSERT INTO audio_requests (article_id, type, audio_url, requested_at)
                            VALUES ($1, 'summary', $2, NOW())
                            RETURNING id
                        """
                        audio_request_id = await conn.fetchval(insert_audio_query, article_id, public_url)
                        response_data["audio_url"] = public_url
                    except Exception as tts_exc:
                        logging.error(f"Azure TTS error: {str(tts_exc)}")
                        response_data["error"] = "Failed to generate audio"
            
            return response_data
            
    except Exception as e:
        logging.error(f"Error fetching summary: {str(e)}")
        return {"error": str(e)}
    finally:
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")

# Route to fetch more articles for homepage with pagination
@app.get("/articles")
async def get_articles(offset: int = Query(0, ge=0), limit: int = Query(10, gt=0, le=50)):
    """
    Fetch paginated articles for homepage with has_more indicator.
    """
    pool = None
    try:
        pool = await connect_to_db()
        async with pool.acquire() as conn:
            # Fetch articles with pagination
            articles_query = """
                SELECT id, headline, content, image_url, source, created_at
                FROM articles
                ORDER BY published_at DESC
                OFFSET $1 LIMIT $2
            """
            articles = await conn.fetch(articles_query, offset, limit)
            # Check if there are more articles
            count_query = "SELECT COUNT(*) FROM articles"
            total_count = await conn.fetchval(count_query)
            has_more = (offset + limit) < total_count
            return {
                "articles": [dict(a) for a in articles],
                "has_more": has_more
            }
    except Exception as e:
        logging.error(f"Error fetching paginated articles: {str(e)}")
        return {"error": str(e)}
    finally:
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")




@app.get("/{year}/{month}/{date}")
async def get_news_by_date(year: int, month: int, date: int):
    pool = None
    try:
        logging.info(f"Fetching articles for year={year}, month={month}, date={date}")
        pool = await connect_to_db()
        async with pool.acquire() as conn:
            query = """
                SELECT * FROM articles 
                WHERE EXTRACT(YEAR FROM published_at) = $1
                  AND EXTRACT(MONTH FROM published_at) = $2
                  AND EXTRACT(DAY FROM published_at) = $3
                ORDER BY published_at DESC
                LIMIT 20
            """
            articles = await conn.fetch(query, year, month, date)
            logging.info(f"Articles fetched: {len(articles)}")
        # Convert bytes fields to strings to avoid UnicodeDecodeError
        articles_list = []
        for a in articles:
            d = dict(a)
            for k, v in d.items():
                if isinstance(v, bytes):
                    try:
                        d[k] = v.decode("utf-8")
                    except Exception:
                        d[k] = v.decode("latin1", errors="ignore")
            articles_list.append(d)
        return {"articles": articles_list}
    except Exception as e:
        logging.error(f"Error fetching articles by date: {str(e)}")
        return {"error": str(e)}
    finally:
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")            
            

