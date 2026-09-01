from fastapi import APIRouter, Depends, Request, Form, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.auth import hash_senha, verificar_senha, criar_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])

templates = Jinja2Templates(directory="app/templates")

#Rota de cadastro
@router.get("/login")
def tela_login(request: Request):
    return templates.TemplateResponse(
        request,
        "auth/login.html",
        {"request": request}
    )

@router.post("/login")
def login_usuario(
    request: Request,
    email: str = Form(...),
    senha: str = Form(...),
    db: Session = Depends(get_db)
):
    #Verificar se o usuário existe
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or not verificar_senha(senha, usuario.senha_hash):
        return templates.TemplateResponse(
            request,
            "index.html",
            {"request": request, "erro": "E-mail ou senha inválidos"}
        )
    
    if not usuario.ativo:
        return templates.TemplateResponse(
            request,
            "index.html",
            {"request": request, "erro": "Usuário inativo. Contate o administrador."}
        )
    
    #Criar token de acesso
    token_data = {
        "sub": usuario.email,
        "nome": usuario.nome,
        "role": usuario.role,
        "id": usuario.id
    }

    token = criar_token(token_data)

    #Redirecionar para a tela inicial com o token no cookie
    response = RedirectResponse(url="/?login=ok", status_code=303)
    response.set_cookie(
        key="access_token", 
        value=token, 
        httponly=True, 
        max_age=3600,
        samesite="lax")
    return response

@router.get("/logout")
def logout_usuario():
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie(key="access_token")
    return response