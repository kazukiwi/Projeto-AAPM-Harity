# controllers/produto_controller.py — CRUD produtos AAPM SENAI
import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, Request, Form, UploadFile, File, status
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.movimentacao import Movimentacao

from app.database import get_db
from app.models.produtos import Produto
from app.models.categoria import Categoria
from app.auth import get_usuario_logado, get_admin

router = APIRouter(prefix="/produtos", tags=["Produtos"])

APP_DIR = Path(__file__).resolve().parents[1]
STATIC_DIR = APP_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"

templates = Jinja2Templates(directory=APP_DIR / "templates")

# Pasta onde as imagens serão salvas dentro de /static
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LISTAGEM
# ============================================================

@router.get("/")
def listar_produtos(
    request: Request,
    busca: str = "",
    categoria_id: int = 0,       # 0 = todas as categorias
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    query = db.query(Produto).filter(Produto.ativo == True)

    if busca:
        query = query.filter(Produto.nome.ilike(f"%{busca}%"))

    if categoria_id:
        query = query.filter(Produto.categoria_id == categoria_id)

    produtos    = query.order_by(Produto.nome).all()
    categorias  = db.query(Categoria).filter(Categoria.ativo == True).all()

    return templates.TemplateResponse(
        request,
        "produtos/index.html",
        {
            "request":      request,
            "usuario":      usuario,
            "produtos":     produtos,
            "categorias":   categorias,
            "busca":        busca,
            "categoria_id": categoria_id,
        }
    )


# ============================================================
# CADASTRO
# ============================================================

@router.get("/novo")
def form_novo_produto(
    request: Request,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    categorias = db.query(Categoria).filter(Categoria.ativo == True).all()

    return templates.TemplateResponse(
        request,
        "produtos/form.html",
        {
            "request":    request,
            "usuario":    admin,
            "editando":   None,
            "categorias": categorias
        }
    )


@router.post("/novo")
async def criar_produto(
    request: Request,
    nome: str          = Form(...),
    preco: float       = Form(...),
    estoque_atual: int = Form(...),
    categoria_id: int  = Form(0),   # 0 = sem categoria
    imagem: UploadFile = File(None), # None = campo opcional
    db: Session        = Depends(get_db),
    admin              = Depends(get_admin)
):
    categorias = db.query(Categoria).filter(Categoria.ativo == True).all()

    # Verifica duplicidade de nome
    if db.query(Produto).filter(Produto.nome.ilike(nome)).first():
        return templates.TemplateResponse(
            request,
            "produtos/form.html",
            {
                "request":    request,
                "usuario":    admin,
                "editando":   None,
                "categorias": categorias,
                "erro":       "Já existe um produto com este nome.",
                "valores":    {"nome": nome, "preco": preco,
                               "estoque_atual": estoque_atual,
                               "categoria_id": categoria_id}
            },
            status_code=400
        )

    # Processa o upload da imagem
    imagem_path = await _salvar_imagem(imagem)

    # O preço é armazenado em reais, na mesma unidade usada pelo PDV e pelas vendas.
    produto = Produto(
        nome          = nome,
        preco         = preco,
        estoque_atual = estoque_atual,
        categoria_id  = categoria_id or None,  # 0 vira NULL no banco
        imagem_path   = imagem_path,
    )

    db.add(produto)
    db.commit()

    return RedirectResponse(url="/produtos?criado=ok", status_code=302)


# DETALHE
@router.get("/{produto_id}")
def detalhe_produto(
    produto_id: int,
    request: Request,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    produto = db.query(Produto).filter(
        Produto.id == produto_id,
        Produto.ativo == True
    ).first()

    if not produto:
        return RedirectResponse(url="/produtos", status_code=302)

    return templates.TemplateResponse(
        request,
        "produtos/detalhe.html",
        {"request": request, "usuario": usuario, "produto": produto}
    )


# EDIÇÃO
@router.get("/{produto_id}/editar")
def form_editar_produto(
    produto_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    editando   = db.query(Produto).filter(Produto.id == produto_id).first()
    categorias = db.query(Categoria).filter(Categoria.ativo == True).all()

    if not editando:
        return RedirectResponse(url="/produtos", status_code=302)

    return templates.TemplateResponse(
        request,
        "produtos/form.html",
        {
            "request":    request,
            "usuario":    admin,
            "editando":   editando,
            "categorias": categorias
        }
    )


@router.post("/{produto_id}/editar")
async def editar_produto(
    produto_id: int,
    request: Request,
    nome: str          = Form(...),
    preco: float       = Form(...),
    estoque_atual: int = Form(...),
    categoria_id: int  = Form(0),
    imagem: UploadFile = File(None),
    db: Session        = Depends(get_db),
    admin              = Depends(get_admin)
):
    editando   = db.query(Produto).filter(Produto.id == produto_id).first()
    categorias = db.query(Categoria).filter(Categoria.ativo == True).all()

    if not editando:
        return RedirectResponse(url="/produtos", status_code=302)

    # Verifica conflito de nome com outro produto
    conflito = db.query(Produto).filter(
        Produto.nome.ilike(nome),
        Produto.id != produto_id
    ).first()

    if conflito:
        return templates.TemplateResponse(
            request,
            "produtos/form.html",
            {
                "request":    request,
                "usuario":    admin,
                "editando":   editando,
                "categorias": categorias,
                "erro":       "Já existe outro produto com este nome.",
            },
            status_code=400
        )

    # Processa nova imagem — só substitui se um arquivo foi enviado
    nova_imagem_path = await _salvar_imagem(imagem)
    if nova_imagem_path:
        # Remove a imagem antiga do disco para não acumular arquivos
        _remover_imagem(editando.imagem_path)
        editando.imagem_path = nova_imagem_path

    # Mantém o preço em reais ao atualizar o cadastro.
    editando.nome          = nome
    editando.preco         = preco
    editando.estoque_atual = estoque_atual
    editando.categoria_id  = categoria_id or None

    db.commit()

    return RedirectResponse(url=f"/produtos/{produto_id}?editado=ok", status_code=302)


# ============================================================
# DESATIVAR
# ============================================================

@router.post("/{produto_id}/desativar")
def desativar_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_admin)
):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()

    if produto:
        produto.ativo = False
        db.commit()

    return RedirectResponse(url="/produtos?desativado=ok", status_code=302)


# ============================================================
# FUNÇÕES AUXILIARES DE IMAGEM
# ============================================================

async def _salvar_imagem(imagem: UploadFile | None):
    """
    Salva o arquivo enviado em /app/static/uploads/ e retorna
    o path relativo para guardar no banco.
    """
    if not imagem or not imagem.filename:
        return None

    # Valida a extensão — aceita apenas imagens
    extensoes_permitidas = {".jpg", ".jpeg", ".png", ".webp"}
    _, ext = os.path.splitext(imagem.filename.lower())

    if ext not in extensoes_permitidas:
        return None

    # Garante nome de arquivo único usando UUID para evitar colisões
    nome_arquivo = f"{uuid.uuid4()}{ext}"
    caminho_completo = UPLOAD_DIR / nome_arquivo

    # Salva o arquivo no disco
    with open(caminho_completo, "wb") as buffer:
        shutil.copyfileobj(imagem.file, buffer)

    # Retorna o path relativo que a propriedade do modelo espera encontrar
    return f"uploads/{nome_arquivo}"


def _remover_imagem(imagem_path: str | None) -> None:
    """Remove o arquivo de imagem do disco se ele existir."""
    if not imagem_path:
        return

    # Remove referências de barras iniciais repetidas
    imagem_path_limpo = imagem_path.strip().lstrip('/').replace("\\", "/")
    
    # Se o path salvo já continha 'static/', removemos para não duplicar com o join abaixo
    if imagem_path_limpo.startswith("static/"):
        imagem_path_limpo = imagem_path_limpo.replace("static/", "", 1)

    caminho = (STATIC_DIR / imagem_path_limpo).resolve()

    # Nunca remove arquivos fora da pasta estática, mesmo se o banco tiver um caminho inválido.
    try:
        caminho.relative_to(STATIC_DIR.resolve())
    except ValueError:
        return

    if caminho.is_file():
        caminho.unlink()


@router.get("/mais-vendidos")
def mais_vendidos(db: Session = Depends(get_db)):
    resultado = (
        db.query(
            Produto.id,
            Produto.nome,
            func.sum(Movimentacao.quantidade).label("total_vendido")
        )
    )
