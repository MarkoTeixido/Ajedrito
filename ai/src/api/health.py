from fastapi import APIRouter
from src.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """Verifica que el servicio esté operativo."""
    return HealthResponse(status="ok")
