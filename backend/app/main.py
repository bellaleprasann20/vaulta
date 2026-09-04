"""
Vaulta — FastAPI entrypoint.
Wires together middleware, exception handlers, and versioned routers.
Run locally with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import Base, engine

# NOTE: these route modules will be added as we build each feature.
# Import guards keep the app bootable even before every router exists.
try:
    from app.routes import auth as auth_routes
except ImportError:
    auth_routes = None

try:
    from app.routes import users as users_routes
except ImportError:
    users_routes = None

try:
    from app.routes import files as files_routes
except ImportError:
    files_routes = None

try:
    from app.routes import folders as folders_routes
except ImportError:
    folders_routes = None

try:
    from app.routes import shares as shares_routes
except ImportError:
    shares_routes = None

try:
    from app.routes import public_links as public_links_routes
except ImportError:
    public_links_routes = None

try:
    from app.routes import search as search_routes
except ImportError:
    search_routes = None

try:
    from app.routes import stars as stars_routes
except ImportError:
    stars_routes = None

try:
    from app.routes import trash as trash_routes
except ImportError:
    trash_routes = None


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
            content={"success": False, "message": "Validation error", "errors": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Internal server error"},
        )

    # ---------------- Routers ----------------
    prefix = settings.API_V1_PREFIX
    if auth_routes:
        app.include_router(auth_routes.router, prefix=f"{prefix}/auth", tags=["Auth"])
    if users_routes:
        app.include_router(users_routes.router, prefix=f"{prefix}/users", tags=["Users"])
    if files_routes:
        app.include_router(files_routes.router, prefix=f"{prefix}/files", tags=["Files"])
    if folders_routes:
        app.include_router(folders_routes.router, prefix=f"{prefix}/folders", tags=["Folders"])
    if shares_routes:
        app.include_router(shares_routes.router, prefix=f"{prefix}/shares", tags=["Shares"])
    if public_links_routes:
        app.include_router(
            public_links_routes.router, prefix=f"{prefix}/public-links", tags=["Public Links"]
        )
    if search_routes:
        app.include_router(search_routes.router, prefix=f"{prefix}/search", tags=["Search"])
    if stars_routes:
        app.include_router(stars_routes.router, prefix=f"{prefix}/stars", tags=["Stars"])
    if trash_routes:
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