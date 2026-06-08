from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.venda import ItemVenda
from app.auth import get_usuario_logado

router = APIRouter(
    prefix="/mais_vendidos",
    tags=["Mais Vendidos"]
)

templates = Jinja2Templates(
    directory="app/templates"
)


@router.get("/")
def mais_vendidos(
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):

    produtos = (
        db.query(
            ItemVenda.produto_nome,
            func.sum(ItemVenda.quantidade).label("total_vendido")
        )
        .group_by(ItemVenda.produto_nome)
        .order_by(
            func.sum(ItemVenda.quantidade).desc()
        )
        .all()
    )

    return templates.TemplateResponse(
        request,
        "mais_vendidos/index.html",
        {
            "request": request,
            "usuario": usuario,
            "produtos": produtos
        }
    )