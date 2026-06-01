from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.controllers import auth_controller
from app.controllers import admin_controller
from app.controllers import categorias_controller
from app.controllers import produto_controller

from app.auth import get_usuario_opcional, get_usuario_logado

app = FastAPI(title="Sistema estoque")

# Arquivos estáticos
app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

# Routers
app.include_router(auth_controller.router)
app.include_router(admin_controller.router)
app.include_router(categorias_controller.router)
app.include_router(produto_controller.router)


# Página inicial
@app.get("/")
def home(
    request: Request,
    usuario=Depends(get_usuario_opcional)
):
    if usuario is None:
        return templates.TemplateResponse(
            request,
            "index.html",
            {"request": request}
        )

    else:
        return templates.TemplateResponse(
            request,
            "dashboard.html",
            {
                "request": request,
                "usuario": usuario
            }
        )
