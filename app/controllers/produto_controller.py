# controllers/produto_controller.py — CRUD produtos AAPM SENAI
import math
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
from app.models.produtos import Produto, EstoqueTamanho, Tamanho, ordenar_tamanhos
from app.models.categoria import Categoria
from app.auth import get_usuario_logado, get_admin

router = APIRouter(prefix="/produtos", tags=["Produtos"])

APP_DIR = Path(__file__).resolve().parents[1]
STATIC_DIR = APP_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"

templates = Jinja2Templates(directory=APP_DIR / "templates")

# Pasta onde as imagens serão salvas dentro de /static
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
def _salvar_estoques_tamanho(produto: Produto, possui_variacoes_tamanho: bool, estoques: dict[int, int]) -> None:
    if not possui_variacoes_tamanho:
        produto.estoques_tamanho.clear()
        return

    existentes = {registro.tamanho_id: registro for registro in produto.estoques_tamanho}
    for tamanho_id, quantidade in estoques.items():
        registro = existentes.get(tamanho_id)
        if registro:
            registro.estoque_atual = quantidade
        else:
            produto.estoques_tamanho.append(EstoqueTamanho(tamanho_id=tamanho_id, estoque_atual=quantidade))
    produto.estoque_atual = sum(estoques.values())


async def _obter_estoques_tamanho(request: Request, db: Session) -> dict[int, int]:
    """Lê os campos dinâmicos estoque_tamanho_<id>."""
    form = await request.form()
    tamanhos = db.query(Tamanho).filter(Tamanho.ativo == True).all()
    estoques = {}
    for tamanho in tamanhos:
        try:
            quantidade = int(form.get(f"estoque_tamanho_{tamanho.id}", 0) or 0)
        except (TypeError, ValueError):
            raise ValueError("estoque inválido")
        if quantidade < 0:
            raise ValueError("estoque inválido")
        estoques[tamanho.id] = quantidade
    return estoques


# ============================================================
# LISTAGEM
# ============================================================

@router.get("/")
def listar_produtos(
    request: Request,
    busca: str = "",
    categoria_id: int = 0,
    pagina: int = 1,
    por_pagina: int = 10,
    db: Session = Depends(get_db),
    usuario = Depends(get_usuario_logado)
):
    query = db.query(Produto).filter(Produto.ativo == True)

    if busca:
        query = query.filter(Produto.nome.ilike(f"%{busca}%"))

    if categoria_id:
        query = query.filter(Produto.categoria_id == categoria_id)

        query = query.order_by(Produto.nome)
    total_produtos = query.count()

    pagina = max(pagina, 1)
    por_pagina = max(por_pagina, 1)

    total_paginas = math.ceil(total_produtos / por_pagina) if total_produtos else 1

    offset = (pagina - 1) * por_pagina

    produtos = query.offset(offset).limit(por_pagina).all()
   


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

            "pagina":       pagina,
            "por_pagina":   por_pagina,
            "total_paginas": total_paginas,
            "total_produtos": total_produtos
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
    tamanhos = ordenar_tamanhos(db.query(Tamanho).filter(Tamanho.ativo == True).all())

    return templates.TemplateResponse(
        request,
        "produtos/form.html",
        {
            "request":    request,
            "usuario":    admin,
            "editando":   None,
            "categorias": categorias,
            "tamanhos": tamanhos,
        }
    )


@router.post("/novo")
async def criar_produto(
    request: Request,
    nome: str          = Form(...),
    preco: float       = Form(...),
    estoque_atual: int = Form(0),
    possui_variacoes_tamanho: bool = Form(False),
    categoria_id: int  = Form(0),   # 0 = sem categoria
    imagem: UploadFile = File(None), # None = campo opcional
    db: Session        = Depends(get_db),
    admin              = Depends(get_admin)
):
    categorias = db.query(Categoria).filter(Categoria.ativo == True).all()
    tamanhos = ordenar_tamanhos(db.query(Tamanho).filter(Tamanho.ativo == True).all())

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
                "tamanhos": tamanhos,
                "erro":       "Já existe um produto com este nome.",
                "valores":    {"nome": nome, "preco": preco,
                               "estoque_atual": estoque_atual,
                               "categoria_id": categoria_id,
                               "possui_variacoes_tamanho": possui_variacoes_tamanho}
            },
            status_code=400
        )

    # O preço é armazenado em reais, na mesma unidade usada pelo PDV e pelas vendas.
    try:
        estoques_tamanho = await _obter_estoques_tamanho(request, db)
    except ValueError:
        return RedirectResponse(url="/produtos/novo?erro=estoque", status_code=302)
    if possui_variacoes_tamanho and sum(estoques_tamanho.values()) == 0:
        return templates.TemplateResponse(
            request,
            "produtos/form.html",
            {
                "request": request,
                "usuario": admin,
                "editando": None,
                "categorias": categorias,
                "tamanhos": tamanhos,
                "erro": "Informe a quantidade de pelo menos um tamanho.",
                "valores": {
                    "nome": nome, "preco": preco, "estoque_atual": estoque_atual,
                    "estoques_tamanho": {str(k): v for k, v in estoques_tamanho.items()},
                    "categoria_id": categoria_id,
                    "possui_variacoes_tamanho": possui_variacoes_tamanho,
                },
            },
            status_code=400,
        )

    # Processa o upload da imagem após validar os dados do produto.
    imagem_path = await _salvar_imagem(imagem)

    produto = Produto(
        nome          = nome,
        preco         = preco,
        estoque_atual = sum(estoques_tamanho.values()) if possui_variacoes_tamanho else estoque_atual,
        possui_variacoes_tamanho = possui_variacoes_tamanho,
        categoria_id  = categoria_id or None,  # 0 vira NULL no banco
        imagem_path   = imagem_path,
    )
    if possui_variacoes_tamanho:
        _salvar_estoques_tamanho(produto, possui_variacoes_tamanho, estoques_tamanho)

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
    tamanhos = ordenar_tamanhos(db.query(Tamanho).filter(Tamanho.ativo == True).all())

    if not editando:
        return RedirectResponse(url="/produtos", status_code=302)

    return templates.TemplateResponse(
        request,
        "produtos/form.html",
        {
            "request":    request,
            "usuario":    admin,
            "editando":   editando,
            "categorias": categorias,
            "tamanhos": tamanhos,
        }
    )


@router.post("/{produto_id}/editar")
async def editar_produto(
    produto_id: int,
    request: Request,
    nome: str          = Form(...),
    preco: float       = Form(...),
    estoque_atual: int = Form(0),
    possui_variacoes_tamanho: bool = Form(False),
    categoria_id: int  = Form(0),
    imagem: UploadFile = File(None),
    db: Session        = Depends(get_db),
    admin              = Depends(get_admin)
):
    editando   = db.query(Produto).filter(Produto.id == produto_id).first()
    categorias = db.query(Categoria).filter(Categoria.ativo == True).all()
    tamanhos = ordenar_tamanhos(db.query(Tamanho).filter(Tamanho.ativo == True).all())

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
                "tamanhos": tamanhos,
                "erro":       "Já existe outro produto com este nome.",
            },
            status_code=400
        )

    # Mantém o preço em reais ao atualizar o cadastro.
    try:
        estoques_tamanho = await _obter_estoques_tamanho(request, db)
    except ValueError:
        return RedirectResponse(url=f"/produtos/{produto_id}/editar?erro=estoque", status_code=302)
    if possui_variacoes_tamanho and sum(estoques_tamanho.values()) == 0:
        return templates.TemplateResponse(
            request,
            "produtos/form.html",
            {
                "request": request,
                "usuario": admin,
                "editando": editando,
                "categorias": categorias,
                "tamanhos": tamanhos,
                "erro": "Informe a quantidade de pelo menos um tamanho.",
            },
            status_code=400,
        )

    # Processa nova imagem — só substitui se um arquivo foi enviado.
    nova_imagem_path = await _salvar_imagem(imagem)
    if nova_imagem_path:
        # Remove a imagem antiga do disco para não acumular arquivos
        _remover_imagem(editando.imagem_path)
        editando.imagem_path = nova_imagem_path

    editando.nome          = nome
    editando.preco         = preco
    editando.estoque_atual = estoque_atual
    editando.possui_variacoes_tamanho = possui_variacoes_tamanho
    editando.categoria_id  = categoria_id or None
    _salvar_estoques_tamanho(editando, possui_variacoes_tamanho, estoques_tamanho)

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
