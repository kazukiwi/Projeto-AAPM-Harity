from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, index=True, nullable=False)
    ativo = Column(Integer, default=True)

    produtos = relationship("Produto", back_populates="categoria")