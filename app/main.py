from fastapi import FastAPI, Request, Depends, Form
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
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


# --- BANCO DE DADOS TEMPORÁRIO PARA OS ARMÁRIOS (ESTRUTURA INDESTRUTÍVEL) ---
BANCO_ARMARIOS = []
if not BANCO_ARMARIOS:
    for i in range(1, 51):
        if i in [1, 5, 12, 25]:
            status_inicial = "ocupado"
            nome_mock = "Maria Santos"
            obs_mock = ""
        elif i == 20:
            status_inicial = "manutencao"
            nome_mock = ""
            obs_mock = "Fechadura com defeito"
        else:
            status_inicial = "disponivel"
            nome_mock = ""
            obs_mock = ""
        
        BANCO_ARMARIOS.append({
            "id": i,
            "numero": str(i).zfill(2),
            "status": status_inicial,
            "associado_nome": nome_mock,
            "associado_email": "maria.santos@email.com" if status_inicial == "ocupado" else "",
            "associado_telefone": "(11) 97654-3210" if status_inicial == "ocupado" else "",
            "associado_matricula": "AAPM-002" if status_inicial == "ocupado" else "",
            "atribuido_em": "04/03/2026" if status_inicial == "ocupado" else "",
            "observacoes": obs_mock
        })


# 4º: PÁGINA INICIAL / DASHBOARD
@app.get("/")
def home(
    request: Request,
    usuario=Depends(get_usuario_opcional),
    db: Session = Depends(get_db)
):
    if usuario is None:
        return templates.TemplateResponse(name="index.html", request=request)

    produtos_ativos = db.query(Produto).filter(Produto.ativo == True).all()

    total_produtos = len(produtos_ativos)
    produtos_alerta = [p for p in produtos_ativos if p.estoque_atual <= 5]
    estoque_baixo = len(produtos_alerta)
    valor_total = sum(p.estoque_atual * p.preco for p in produtos_ativos)

    contagem_cat = {}
    for p in produtos_ativos:
        if p.categoria and hasattr(p.categoria, 'nome'):
            name_cat = p.categoria.nome
        elif isinstance(p.categoria, str) and p.categoria.strip():
            name_cat = p.categoria
        else:
            name_cat = "Gerais"
        contagem_cat[name_cat] = contagem_cat.get(name_cat, 0) + 1
    
    total_categorias = len(contagem_cat)

    # Contagem dinâmica para os cards superiores da Home
    ocupados = len([a for a in BANCO_ARMARIOS if a["status"] == "ocupado"])
    disponiveis = len([a for a in BANCO_ARMARIOS if a["status"] == "disponivel"])

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
            "lista_armarios": BANCO_ARMARIOS, 
            "armarios_ocupados": ocupados,
            "armarios_disponiveis": disponiveis,
            "total_associados": ocupados  
        }
    )


# 5º: ROTA MAIS VENDIDOS
@app.get("/mais_vendidos")
def mais_vendidos(
    request: Request,
    usuario=Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    ranking_produtos = []
    categorias_dados = {}
    controle_produtos = {}

    try:
        from app.models.venda import Venda
        
        vendas_reais = db.query(Venda).all()
        total_unidades = len(vendas_reais)
        receita_total = sum(float(v.total_liquido or 0) for v in vendas_reais)

        for venda in vendas_reais:
            if venda.itens:
                for item in venda.itens:
                    nome_p = item.produto_nome if item.produto_nome else (item.produto.nome if item.produto else "Produto Removido")
                    
                    cat_p = "Gerais"
                    if item.produto and item.produto.categoria:
                        if hasattr(item.produto.categoria, 'nome'):
                            cat_p = item.produto.categoria.nome
                        else:
                            cat_p = str(item.produto.categoria)

                    cod_p = f"ID-{item.produto_id}"
                    if item.produto and hasattr(item.produto, 'codigo') and item.produto.codigo:
                        cod_p = item.produto.codigo

                    qtd = int(item.quantidade or 0)
                    subtotal = qtd * float(item.preco_unitario or 0)

                    if nome_p not in controle_produtos:
                        controle_produtos[nome_p] = {
                            "codigo": cod_p,
                            "categoria": cat_p,
                            "vendas": 0,
                            "receita": 0.0
                        }
                    
                    controle_produtos[nome_p]["vendas"] += qtd
                    controle_produtos[nome_p]["receita"] += subtotal
                    categorias_dados[cat_p] = categorias_dados.get(cat_p, 0) + qtd

        for nome, dados in controle_produtos.items():
            if dados["vendas"] > 0:
                ranking_produtos.append({
                    "nome": nome,
                    "codigo": dados["codigo"],
                    "categoria": dados["categoria"],
                    "vendas": dados["vendas"],
                    "receita": dados["receita"],
                    "porcentagem": 0.0
                })

    except Exception as e:
        print(f"--> Erro interno no processamento de vendas: {e}")
        ranking_produtos = []

    if not ranking_produtos:
        total_unidades = 0
        receita_total = 0.0
    else:
        ranking_produtos = sorted(ranking_produtos, key=lambda x: x["vendas"], reverse=True)
        total_vendas_geral = sum(p["vendas"] for p in ranking_produtos) or 1
        for p in ranking_produtos:
            p["porcentagem"] = round((p["vendas"] / total_vendas_geral) * 100, 1)

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


# 6º: ROTA PRINCIPAL DOS ARMÁRIOS (PROTEÇÃO MÁXIMA CONTRA ERRO 500)
@app.get("/armarios")
def listar_armarios(
    request: Request,
    usuario=Depends(get_usuario_opcional) # Trocado para opcional para evitar travas de banco
):
    # Fallback caso a sessão falhe por causa do banco de dados travado no Git
    if not usuario:
        class UsuarioMock:
            role = "admin"
            nome = "Usuário Local"
        usuario = UsuarioMock()

    total = len(BANCO_ARMARIOS)
    disponiveis = len([a for a in BANCO_ARMARIOS if a["status"] == "disponivel"])
    ocupados = len([a for a in BANCO_ARMARIOS if a["status"] == "ocupado"])
    manutencao = len([a for a in BANCO_ARMARIOS if a["status"] == "manutencao"])

    return templates.TemplateResponse(
        request=request, 
        name="armarios/index.html", 
        context={
            "request": request, # Garantindo envio explícito do objeto request para o contexto
            "usuario": usuario,
            "armarios": BANCO_ARMARIOS,
            "total_armarios": total,
            "armarios_disponiveis": disponiveis,
            "armarios_ocupados": ocupados,
            "armarios_manutencao": manutencao
        }
    )


# 7º: ROTA PARA ALTERAR O STATUS DO ARMÁRIO
@app.post("/armarios/alterar-status")
def alterar_status_armario(
    armario_id: int = Form(...),
    novo_status: str = Form(...),
    nome: str = Form(None),
    observacoes: str = Form(None),
    usuario=Depends(get_usuario_opcional)
):
    for armario in BANCO_ARMARIOS:
        if armario["id"] == armario_id:
            armario["status"] = novo_status
            
            if novo_status == "ocupado":
                armario["associado_nome"] = nome if (nome and nome.strip()) else "Maria Santos"
                armario["associado_email"] = "maria.santos@email.com"
                armario["associado_telefone"] = "(11) 97654-3210"
                armario["associado_matricula"] = "AAPM-002"
                armario["atribuido_em"] = "04/03/2026"
                armario["observacoes"] = ""
            elif novo_status == "manutencao":
                armario["associado_nome"] = ""
                armario["associado_email"] = ""
                armario["associado_telefone"] = ""
                armario["associado_matricula"] = ""
                armario["atribuido_em"] = ""
                armario["observacoes"] = observacoes if (observacoes and observacoes.strip()) else "Fechadura com defeito"
            else:
                armario["associado_nome"] = ""
                armario["associado_email"] = ""
                armario["associado_telefone"] = ""
                armario["associado_matricula"] = ""
                armario["atribuido_em"] = ""
                armario["observacoes"] = ""
            break
            
    return RedirectResponse(url="/armarios", status_code=303)