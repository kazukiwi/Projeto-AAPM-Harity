from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


from app.controllers import (
    auth_controller,
    admin_controller,
    categorias_controller,
    produto_controller,
    movimentacao_controller,
    pdv_controller  # 🟢 Alterado para o nome correto do arquivo
)

from app.auth import get_usuario_opcional, get_usuario_logado

app = FastAPI(title="Sistema Estoque")

# Arquivos estáticos
app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

# Routers
app.include_router(auth_controller.router)
app.include_router(admin_controller.router)
app.include_router(categorias_controller.router)
app.include_router(produto_controller.router)
app.include_router(movimentacao_controller.router)
app.include_router(pdv_controller.router) # 🟢 INCLUÍDO O ROUTER DO PDV!


# Página inicial
@app.get("/")
def home(
    request: Request,
    usuario=Depends(get_usuario_opcional)
):
    if usuario is None:
        return templates.TemplateResponse(
            name="index.html",
            request=request
        )

    return templates.TemplateResponse(
        name="dashboard.html",
        request=request,
        context={
            "usuario": usuario
        }
    )