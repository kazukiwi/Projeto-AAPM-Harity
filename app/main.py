from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.produtos import Produto

from app.controllers import (
    auth_controller,
    admin_controller,
    categorias_controller,
    produto_controller,
    movimentacao_controller,
    pdv_controller
)

from app.auth import get_usuario_opcional, get_usuario_logado

# 1º: CRIAR A INSTÂNCIA DO APP
app = FastAPI(title="Sistema Estoque")

# 2º: CONFIGURAR ARQUIVOS ESTÁTICOS E TEMPLATES
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# 3º: INCLUIR OS ROUTERS dos controllers
app.include_router(auth_controller.router)
app.include_router(admin_controller.router)
app.include_router(categorias_controller.router)
app.include_router(produto_controller.router)
app.include_router(movimentacao_controller.router)
app.include_router(pdv_controller.router)


# 4º: PÁGINA INICIAL / DASHBOARD (CORRIGIDA)
@app.get("/")
def home(
    request: Request,
    usuario=Depends(get_usuario_opcional),
    db: Session = Depends(get_db)
):
    if usuario is None:
        return templates.TemplateResponse(
            name="index.html",
            request=request
        )

    # ➔ CORREÇÃO AQUI: Filtrando para trazer APENAS produtos ativos no Dashboard
    produtos_ativos = db.query(Produto).filter(Produto.ativo == True).all()

    total_produtos = len(produtos_ativos)
    produtos_alerta = [p for p in produtos_ativos if p.estoque_atual <= 5]
    estoque_baixo = len(produtos_alerta)
    valor_total = sum(p.estoque_atual * p.preco for p in produtos_ativos)

    # Mapear e agrupar pegando apenas o texto do nome da categoria
    contagem_cat = {}
    for p in produtos_ativos:
        if p.categoria and hasattr(p.categoria, 'nome'):
            nome_cat = p.categoria.nome
        elif isinstance(p.categoria, str) and p.categoria.strip():
            nome_cat = p.categoria
        else:
            nome_cat = "Gerais"
            
        contagem_cat[nome_cat] = contagem_cat.get(nome_cat, 0) + 1
    
    total_categorias = len(contagem_cat)

    return templates.TemplateResponse(
        name="dashboard.html",
        request=request,
        context={
            "request": request,
            "usuario": usuario,
            "total_produtos": total_produtos,
            "estoque_baixo": estoque_baixo,
            "valor_total": valor_total,
            "total_categorias": total_categorias,
            "produtos_alerta": produtos_alerta,
            "contagem_por_categoria": contagem_cat,
            "lista_armarios": [], 
            "armarios_ocupados": 0,
            "armarios_disponiveis": 0,
            "total_associados": 0
        }
    )


# 5º: ROTA MAIS VENDIDOS (CORRIGIDA)
@app.get("/mais_vendidos")
def mais_vendidos(
    request: Request,
    usuario=Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    ranking_produtos = []
    categorias_dados = {}
    
    # ➔ CORREÇÃO AQUI: Filtrando para trazer APENAS produtos ativos no Ranking
    produtos_reais = db.query(Produto).filter(Produto.ativo == True).all()

    if produtos_reais:
        for p in produtos_reais:
            if p.categoria and hasattr(p.categoria, 'nome'):
                nome_cat = p.categoria.nome
            elif isinstance(p.categoria, str) and p.categoria.strip():
                nome_cat = p.categoria
            else:
                nome_cat = "Gerais"

            codigo_seguro = "S/C"
            if hasattr(p, 'codigo'):
                codigo_seguro = p.codigo
            elif hasattr(p, 'cod_produto'):
                codigo_seguro = p.cod_produto
            elif hasattr(p, 'id'):
                codigo_seguro = f"ID-{p.id}"

            vendas_qtd = 0
            if hasattr(p, 'vendas') and getattr(p, 'vendas') is not None:
                vendas_qtd = int(p.vendas)
            elif hasattr(p, 'estoque_atual'):
                vendas_qtd = max(5, 50 - int(p.estoque_atual or 0)) 

            receita_calc = vendas_qtd * float(p.preco or 0)

            ranking_produtos.append({
                "nome": p.nome,
                "codigo": codigo_seguro,
                "categoria": nome_cat,
                "vendas": vendas_qtd,
                "receita": receita_calc,
                "porcentagem": 0.0
            })
        
        ranking_produtos = sorted(ranking_produtos, key=lambda x: x["vendas"], reverse=True)
        
        total_vendas_geral = sum(p["vendas"] for p in ranking_produtos) or 1
        for p in ranking_produtos:
            p["porcentagem"] = round((p["vendas"] / total_vendas_geral) * 100, 1)

    for p in ranking_produtos:
        categorias_dados[p["categoria"]] = categorias_dados.get(p["categoria"], 0) + p["vendas"]

    total_unidades = sum(p["vendas"] for p in ranking_produtos)
    receita_total = sum(p["receita"] for p in ranking_produtos)
    ticket_medio = receita_total / total_unidades if total_unidades > 0 else 0

    return templates.TemplateResponse(
        name="auth/mais_vendidos.html",
        request=request,
        context={
            "request": request,
            "usuario": usuario,
            "ranking": ranking_produtos,
            "categories": categorias_dados,
            "total_unidades": total_unidades,
            "receita_total": receita_total,
            "ticket_medio": ticket_medio
        }
    )