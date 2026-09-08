"""
Punto de entrada de Ajedrito AI Service.
Correr con: uvicorn src.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.health import router as health_router

app = FastAPI(
    title="Ajedrito AI Service",
    description="Servicio de predicción de jugadas con modelo propio (scikit-learn)",
    version="0.1.0",
)

# CORS — permite peticiones desde el backend Node.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)


@app.get("/", include_in_schema=False)
async def root():
    return {"service": "ajedrito-ai", "version": "0.1.0"}
