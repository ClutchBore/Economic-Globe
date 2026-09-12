import os
from pathlib import Path

from dotenv import load_dotenv

# Must precede the routes import: it pulls in data_store, which reads the KV
# credentials out of the environment at import time.
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import countries
from routes.analysis import router as analysis_router
from routes.ai import router as ai_router

app = FastAPI(title="Economic Globe API")

# The local Vite dev server, plus whatever FRONTEND_ORIGINS holds (comma-separated)
# so the deployed frontend can be added in Vercel without a code change. Not "*":
# Starlette refuses to echo a wildcard alongside allow_credentials.
_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_origins += [o.strip() for o in os.getenv("FRONTEND_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Economic Globe API is running"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


app.include_router(countries.router)
app.include_router(ai_router)
app.include_router(analysis_router)


# --- Routes go here as the hackathon progresses ---
# from routes import countries, ai, analysis
# app.include_router(ai.router)
