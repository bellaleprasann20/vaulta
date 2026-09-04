"""
Schemas package.
 
Shared base classes so every schema gets consistent config
(ORM-mode reads, UUID/datetime JSON encoding) without repeating it.
"""
 
from pydantic import BaseModel, ConfigDict
 
 
class ORMBase(BaseModel):
    """Base for any schema that gets built directly from a SQLAlchemy model."""
    model_config = ConfigDict(from_attributes=True)
 
 
class APIResponse(BaseModel):
    """Generic envelope for simple success/message responses."""
    success: bool = True
    message: str