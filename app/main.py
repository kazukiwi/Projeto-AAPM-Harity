from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse

from app.controllers import auth_controller
from app.controllers import admin_controller
from app.controllers import categorias_controller
from app.controllers import produto_controller

from app.auth import get_usuario_opcional

app = FastAPI(title="Sistema estoque")

#Configurar o Fastapi para servir os arquivos estáticos (CSS, JV, IMGS)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

#Inclui os routers dos controles
app.include_router(auth_controller.router)
app.include_router(admin_controller.router)
app.include_router(categorias_controller.router)
app.include_router(produto_controller.router)

#Tela inicial
@app.get("/")
def home(
    request: Request,
    usuario = Depends(get_usuario_opcional)
):
    # Se NÃO estiver logado, redireciona DIRETAMENTE para a rota de login
    if usuario is None:
        # Altere "/login" para a rota exata definida no seu auth_controller
        return RedirectResponse(url="/auth/login", status_code=303)
    
    # Se estiver logado, leva para a home interna do sistema
    else:
        return templates.TemplateResponse(
            request,
            "auth/dashbord.html",
            {"request": request, "usuario": usuario}
        )
