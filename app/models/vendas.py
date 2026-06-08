from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base

class Venda(Base):
    __tablename__ = "vendas"

    id = Column(Integer, primary_key=True, index=True)

    produto_id = Column(
        Integer,
        ForeignKey("produtos.id"),
        nullable=False
    )

    quantidade = Column(Integer, nullable=False)

    valor_unitario = Column(Integer, nullable=False)

    data = Column(
        DateTime,
        default=datetime.utcnow
    )

    produto = relationship("Produto")