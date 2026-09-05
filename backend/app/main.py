"""
Vaulta — FastAPI entrypoint.
Wires together middleware, exception handlers, and versioned routers.
Run locally with: uvicorn app.main:app --reload
"""

import logging
import traceback

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from app.core.config import settings
from app.core.database import Base, engine

logger = logging.getLogger("uvicorn.error")

# Each router is imported directly — no more silent try/except ImportError.
# That pattern made sense early on when routers didn't exist yet, but now
# that the app is fully built, swallowing ImportError silently means a
# real bug (a missing dependency, a typo, anything) makes routes vanish
# with zero explanation, which is exactly what happened in production:
# every router failed to register and the only clue was a blanket 404.
# If any of these imports fail now, the app crashes loudly on startup
# with a full traceback in the deploy log instead of silently degrading.
from app.routes import auth as auth_routes
from app.routes import users as users_routes
from app.routes import files as files_routes
from app.routes import folders as folders_routes
from app.routes import shares as shares_routes
from app.routes import public_links as public_links_routes
from app.routes import search as search_routes
from app.routes import stars as stars_routes
from app.routes import trash as trash_routes


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="Cloud-based media file storage & sharing service — API",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # ---------------- CORS ----------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---------------- Exception handlers ----------------
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Validation error",
                "errors": jsonable_encoder(exc.errors()),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Log the full traceback server-side so Render's logs show the
        # real cause of any 500 — the JSON response to the client stays
        # generic on purpose (no stack traces leaking to end users).
        logger.error("Unhandled exception on %s %s:\n%s", request.method, request.url, traceback.format_exc())
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Internal server error"},
        )

    # ---------------- Routers ----------------
    prefix = settings.API_V1_PREFIX
    app.include_router(auth_routes.router, prefix=f"{prefix}/auth", tags=["Auth"])
    app.include_router(users_routes.router, prefix=f"{prefix}/users", tags=["Users"])
    app.include_router(files_routes.router, prefix=f"{prefix}/files", tags=["Files"])
    app.include_router(folders_routes.router, prefix=f"{prefix}/folders", tags=["Folders"])
    app.include_router(shares_routes.router, prefix=f"{prefix}/shares", tags=["Shares"])
    app.include_router(
        public_links_routes.router, prefix=f"{prefix}/public-links", tags=["Public Links"]
    )
    app.include_router(search_routes.router, prefix=f"{prefix}/search", tags=["Search"])
    app.include_router(stars_routes.router, prefix=f"{prefix}/stars", tags=["Stars"])
    app.include_router(trash_routes.router, prefix=f"{prefix}/trash", tags=["Trash"])

    @app.get("/", tags=["Health"])
    def root():
        return {"success": True, "message": f"{settings.APP_NAME} API is running 🚀"}

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "ok", "environment": settings.ENVIRONMENT}

    return app


app = create_app()

# Dev convenience only — in production, use Alembic migrations instead.
if settings.ENVIRONMENT == "development":
    Base.metadata.create_all(bind=engine)