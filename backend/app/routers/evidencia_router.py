from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Usuario
from app.schemas import EvidenciaResponse
from app.services import auth_service, proyecto_service, reporte_service

router = APIRouter(prefix="/proyectos/{proyecto_id}/evidencias", tags=["Evidencias"])


def _validar_proyecto(db: Session, proyecto_id: int):
    if not proyecto_service.obtener_proyecto(db, proyecto_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")


@router.get("/", response_model=List[EvidenciaResponse])
def get_evidencias(proyecto_id: int, incluir_eliminadas: bool = False, db: Session = Depends(get_db)):
    _validar_proyecto(db, proyecto_id)
    return reporte_service.listar_evidencias(db, proyecto_id, incluir_eliminadas)


@router.post("/", response_model=EvidenciaResponse, status_code=status.HTTP_201_CREATED)
async def subir_evidencia(
    proyecto_id: int,
    usuario_id: int,
    archivo: UploadFile = File(...),
    descripcion: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    _validar_proyecto(db, proyecto_id)
    try:
        return await reporte_service.subir_evidencia(db, proyecto_id, usuario_id, archivo, descripcion)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.delete("/{evidencia_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evidencia(
    proyecto_id: int,
    evidencia_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(auth_service.obtener_usuario_actual),
):
    if not reporte_service.eliminar_evidencia(db, evidencia_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidencia no encontrada")
    return None
