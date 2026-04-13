from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models import Setting, User
from app.schemas import SettingOut, UpdateSettingsRequest

router = APIRouter(prefix="/auth/api/settings", tags=["settings"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[SettingOut])
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Setting).order_by(Setting.key))
    return result.scalars().all()


@router.put("", response_model=list[SettingOut])
async def update_settings(
    body: UpdateSettingsRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    for key, value in body.settings.items():
        result = await db.execute(select(Setting).where(Setting.key == key))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = value
            setting.updated_by = admin.id
        else:
            db.add(Setting(key=key, value=value, updated_by=admin.id))

    await db.commit()

    result = await db.execute(select(Setting).order_by(Setting.key))
    return result.scalars().all()
