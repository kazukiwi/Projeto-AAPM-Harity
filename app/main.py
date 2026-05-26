from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse

from app.controllers import auth_controller
from app.controllers import admin_controller

from app.auth import get_usuario_opcional

app = FastAPI(title="Sistema estoque")

#Configurar o Fastapi para servir os arquivos estáticos (CSS, JV, IMGS)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

#Inclui os routers dos controles
app.include_router(auth_controller.router)
app.include_router(admin_controller.router)

#Tela inicial
@app.get("/")
def home(
    request: Request,
    usuario = Depends(get_usuario_opcional)
    ):

    # Não logado
    if usuario is None:
        return templates.TemplateResponse(
            request,
            "index.html",
            {"request": request, "usuario": usuario}
        )
    
    # Logado
    else:
        return templates.TemplateResponse(
            request,
            "home.html",
            {"request": request, "usuario": usuario}
        )
