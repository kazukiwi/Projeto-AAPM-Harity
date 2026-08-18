from email.message import EmailMessage
from html import escape
import os
import smtplib
import ssl

from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.auth import (
    JWTError,
    criar_token,
    criar_token_redefinicao_senha,
    hash_senha,
    validar_token_redefinicao_senha,
    verificar_senha,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])

templates = Jinja2Templates(directory="app/templates")


def enviar_email_redefinicao(destinatario: str, link: str):
    """Envia o link de redefinição usando as variáveis SMTP do .env."""
    remetente = os.getenv("SMTP_FROM") or os.getenv("SMTP_USER")
    if not all([os.getenv("SMTP_HOST"), remetente]):
        raise RuntimeError("Configuração de e-mail incompleta")

    mensagem = EmailMessage()
    mensagem["Subject"] = "Redefinição de senha - AAPM"
    mensagem["From"] = remetente
    mensagem["To"] = destinatario
    mensagem.set_content(
        "Recebemos uma solicitação para redefinir sua senha. "
        f"Acesse o link abaixo em até 30 minutos:\n\n{link}\n\n"
        "Se você não fez esta solicitação, ignore este e-mail."
    )
    link_seguro = escape(link, quote=True)
    mensagem.add_alternative(
        f"""\
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0; padding:0; background:#c7c4e8; font-family:Arial, Helvetica, sans-serif; color:#15152f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 12px 32px rgba(9,20,92,.22);">
          <tr>
            <td style="padding:32px 42px; background:linear-gradient(135deg, #09145c, #1c1c64); color:#ffffff;">
              <div style="font-size:36px; line-height:1; font-weight:800; letter-spacing:1px;">AAPM</div>
              <div style="margin-top:10px; font-size:15px; opacity:.82;">Sistema de gestão</div>
            </td>
          </tr>
          <tr>
            <td style="padding:42px;">
              <h1 style="margin:0 0 18px; color:#09145c; font-size:28px; line-height:1.25;">Redefina sua senha</h1>
              <p style="margin:0 0 14px; font-size:16px; line-height:1.65;">Recebemos uma solicitação para criar uma nova senha para sua conta.</p>
              <p style="margin:0 0 30px; font-size:16px; line-height:1.65;">Para continuar, clique no botão abaixo. Este link é válido por <strong>30 minutos</strong>.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" bgcolor="#09145c" style="border-radius:12px;">
                    <a href="{link_seguro}" style="display:inline-block; padding:16px 26px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; border-radius:12px;">Criar nova senha</a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0; padding-top:24px; border-top:1px solid #e6e5f3; color:#5d5c78; font-size:13px; line-height:1.6;">Se você não solicitou esta alteração, ignore este e-mail. Sua senha atual continuará a mesma.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 42px; background:#f3f2fb; color:#5d5c78; font-size:12px; text-align:center;">AAPM — SENAI</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""",
        subtype="html",
    )

    host = os.environ["SMTP_HOST"]
    porta = int(os.getenv("SMTP_PORT", "587"))
    usuario = os.getenv("SMTP_USER")
    senha = os.getenv("SMTP_PASSWORD")
    usar_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    if usar_ssl:
        conexao = smtplib.SMTP_SSL(
            host, porta, timeout=30, context=ssl.create_default_context()
        )
    else:
        conexao = smtplib.SMTP(host, porta, timeout=30)

    with conexao as servidor:
        if not usar_ssl:
            servidor.starttls(context=ssl.create_default_context())
        if usuario and senha:
            servidor.login(usuario, senha)
        servidor.send_message(mensagem)

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
    response = RedirectResponse(url="/", status_code=302)
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


@router.get("/esqueci-senha")
def tela_esqueci_senha(request: Request):
    return templates.TemplateResponse(request, "auth/esqueci_senha.html", {"request": request})


@router.post("/esqueci-senha")
def solicitar_redefinicao_senha(
    request: Request,
    email: str = Form(...),
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(Usuario.email == email.strip().lower()).first()
    mensagem = "Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha."

    if usuario and usuario.ativo:
        token = criar_token_redefinicao_senha(usuario.email)
        link = str(request.url_for("tela_redefinir_senha")) + f"?token={token}"
        try:
            enviar_email_redefinicao(usuario.email, link)
        except (OSError, smtplib.SMTPException, RuntimeError) as erro:
            print(f"Erro ao enviar e-mail de redefinição: {erro}")

    return templates.TemplateResponse(
        request, "auth/esqueci_senha.html", {"request": request, "mensagem": mensagem}
    )


@router.get("/redefinir-senha", name="tela_redefinir_senha")
def tela_redefinir_senha(request: Request, token: str):
    try:
        validar_token_redefinicao_senha(token)
    except JWTError:
        return templates.TemplateResponse(
            request,
            "auth/redefinir_senha.html",
            {"request": request, "erro": "Este link é inválido ou expirou."},
            status_code=400,
        )
    return templates.TemplateResponse(request, "auth/redefinir_senha.html", {"request": request, "token": token})


@router.post("/redefinir-senha")
def redefinir_senha(
    request: Request,
    token: str = Form(...),
    senha: str = Form(...),
    confirmar_senha: str = Form(...),
    db: Session = Depends(get_db),
):
    if len(senha) < 8 or senha != confirmar_senha:
        return templates.TemplateResponse(
            request,
            "auth/redefinir_senha.html",
            {"request": request, "token": token, "erro": "Use ao menos 8 caracteres e confirme a mesma senha."},
            status_code=400,
        )
    try:
        email = validar_token_redefinicao_senha(token)
    except JWTError:
        return templates.TemplateResponse(
            request,
            "auth/redefinir_senha.html",
            {"request": request, "erro": "Este link é inválido ou expirou."},
            status_code=400,
        )

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        return templates.TemplateResponse(
            request,
            "auth/redefinir_senha.html",
            {"request": request, "erro": "Este link é inválido ou expirou."},
            status_code=400,
        )
    usuario.senha_hash = hash_senha(senha)
    db.commit()
    return RedirectResponse(url="/?mensagem=senha_redefinida", status_code=303)
