from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Request, HTTPException, status
from dotenv import load_dotenv
import os

#Carregar as variaveis de ambiente
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRACAO_MINUTOS = os.getenv("ACCESS_TOKEN_EXPIRACAO_MINUTOS")

#CryptContent
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#Funções de senha
def hash_senha(senha: str):
    return pwd_context.hash(senha)

def verificar_senha(senha: str, senha_hash: str):
    return pwd_context.verify(senha, senha_hash)

#Funções do token
def criar_token(data: dict):
    payload = data.copy()

    #Define quando o token expira
    expira = datetime.now(timezone.utc) + timedelta(minutes=int(ACCESS_TOKEN_EXPIRACAO_MINUTOS))
    payload.update({"exp": expira})

    #Criar o token
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decodificar_token(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload