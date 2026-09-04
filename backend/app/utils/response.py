"""
Response helpers — small builders for a consistent JSON envelope on
endpoints that don't already return a Pydantic schema directly (most
routes return schemas and don't need these; these exist for ad-hoc
success/error payloads and for the global exception handlers in main.py).
"""

from typing import Any

from fastapi.responses import JSONResponse


def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> JSONResponse:
    payload: dict[str, Any] = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return JSONResponse(status_code=status_code, content=payload)


def error_response(message: str, status_code: int = 400, errors: Any = None) -> JSONResponse:
    payload: dict[str, Any] = {"success": False, "message": message}
    if errors is not None:
        payload["errors"] = errors
    return JSONResponse(status_code=status_code, content=payload)


def paginated_response(
    items: list[Any], total: int, page: int = 1, page_size: int = 50
) -> dict[str, Any]:
    """Plain dict (not JSONResponse) — meant to be returned as a response_model-backed
    payload from a route, e.g. wrapped in a Pydantic schema that mirrors this shape."""
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
    }