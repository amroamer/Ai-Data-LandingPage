import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models import Product
from app.schemas import CreateProductRequest, ProductOut, UpdateProductRequest

# Public router — visible-only listing + single-product read. No auth.
public_router = APIRouter(prefix="/auth/api/products", tags=["products"])

# Admin router — full CRUD including hidden products. Admin-only.
admin_router = APIRouter(
    prefix="/auth/api/admin/products",
    tags=["products-admin"],
    dependencies=[Depends(require_admin)],
)


# ── Public endpoints ──

@public_router.get("", response_model=list[ProductOut])
async def list_visible_products(db: AsyncSession = Depends(get_db)):
    """Return only visible products, ordered by ``sort_order`` then created_at.

    Powers the landing-page listing. Hidden products are excluded entirely;
    admins see everything via the admin router.
    """
    result = await db.execute(
        select(Product)
        .where(Product.is_visible.is_(True))
        .order_by(Product.sort_order, Product.created_at)
    )
    return result.scalars().all()


@public_router.get("/{slug}", response_model=ProductOut)
async def get_visible_product(slug: str, db: AsyncSession = Depends(get_db)):
    """Look up a single visible product by slug. 404 when not found or hidden.

    The detail page hits this endpoint. Hidden products return 404 here
    (rather than 403) so the existence of a hidden product isn't leaked.
    """
    result = await db.execute(
        select(Product).where(Product.slug == slug, Product.is_visible.is_(True))
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


# ── Admin endpoints ──

@admin_router.get("", response_model=list[ProductOut])
async def admin_list_products(db: AsyncSession = Depends(get_db)):
    """Return every product (visible + hidden) for the admin management page."""
    result = await db.execute(
        select(Product).order_by(Product.sort_order, Product.created_at)
    )
    return result.scalars().all()


@admin_router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def admin_create_product(body: CreateProductRequest, db: AsyncSession = Depends(get_db)):
    """Create a new product. 409 if the slug already exists."""
    result = await db.execute(select(Product).where(Product.slug == body.slug))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")

    product = Product(**body.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@admin_router.put("/{product_id}", response_model=ProductOut)
async def admin_update_product(
    product_id: uuid.UUID,
    body: UpdateProductRequest,
    db: AsyncSession = Depends(get_db),
):
    """Partial update — only fields explicitly set on the body are touched.

    ``slug`` is intentionally absent from the update schema; it cannot be
    changed once the product is created.
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)
    return product


@admin_router.delete("/{product_id}")
async def admin_delete_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Hard-delete a product. Use ``is_visible = False`` if you only want to hide.

    There is no soft-delete here — admins explicitly choose between hiding
    (preserves the row + content) and deleting (removes everything).
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    await db.delete(product)
    await db.commit()
    return {"detail": "Product deleted"}
