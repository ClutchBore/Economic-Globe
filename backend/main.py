from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import countries
from routes.ai import router as ai_router

app = FastAPI(title="Economic Globe API")

# Allow the local Vite dev server to call this API.
# Add your deployed frontend's URL here too once you're on Vercel.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


# --- Routes go here as the hackathon progresses ---
# from routes import countries, ai, analysis
# app.include_router(ai.router)
# app.include_router(analysis.router)
