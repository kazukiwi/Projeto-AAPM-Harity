<<<<<<< HEAD
=======
from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

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


# 4º: PÁGINA INICIAL / DASHBOARD
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

    # Buscar dados reais do banco de dados
    produtos_ativos = db.query(Produto).all()

    total_produtos = len(produtos_ativos)
    produtos_alerta = [p for p in produtos_ativos if p.estoque_atual <= 5]
    estoque_baixo = len(produtos_alerta)
    valor_total = sum(p.estoque_atual * p.preco for p in produtos_ativos)

    # 🟢 MODIFICADO: Mapear e agrupar pegando apenas o texto do nome da categoria
    contagem_cat = {}
    for p in produtos_ativos:
        # Se 'categoria' for um objeto do relacionamento e tiver o atributo 'nome'
        if p.categoria and hasattr(p.categoria, 'nome'):
            nome_cat = p.categoria.nome
        # Se por acaso for uma string simples
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
            
            # 🟢 ALTERADO: Definidos estritamente como 0 porque ainda não há cadastros
            "lista_armarios": [], 
            "armarios_ocupados": 0,
            "armarios_disponiveis": 0,
            "total_associados": 0
        }
    )
>>>>>>> edf0baa568d6271fcec26fd502945d6c7b615e6d
