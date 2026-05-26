from app.auth import ACCESS_TOKEN_EXPIRACAO_MINUTOS
from datetime import datetime, timedelta, timezone

print(type(ACCESS_TOKEN_EXPIRACAO_MINUTOS))

print(type(int(ACCESS_TOKEN_EXPIRACAO_MINUTOS)))

expira = datetime.now(timezone.utc) + timedelta(minutes=int(ACCESS_TOKEN_EXPIRACAO_MINUTOS))
print(type(expira))