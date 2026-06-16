from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), unique=True, index=True)
    preco = Column(Integer)
    estoque_atual = Column(Integer, nullable=False, default=0)
    ativo = Column(Boolean, default=True)

    imagem_path = Column(String(255), nullable=True)

    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True)
    categoria = relationship("Categoria", back_populates="produtos")

    @property
    def imagem_url(self):
        # 1. Se não houver imagem guardada no banco de dados, retorna a imagem padrão do sistema
        if not self.imagem_path:
            return "/static/img/produto_padrao.png"

        # Remove espaços em branco extras que possam existir no início ou fim
        imagem_path = self.imagem_path.strip()

        # 2. Se já for um link externo completo (http:// ou https://), retorna diretamente
        if imagem_path.startswith(("http://", "https://")):
            return imagem_path

        # 3. Limpa barras iniciais para evitar caminhos duplicados como '//static'
        path_limpo = imagem_path.lstrip('/')

        # 4. Se o banco já gravou o caminho começando com "static/uploads/"
        if path_limpo.startswith("static/"):
            return f"/{path_limpo}"

        # 5. Se o banco guardou apenas "uploads/nome.webp", como a pasta está dentro de static,
        # nós injetamos o prefixo correto automaticamente
        if path_limpo.startswith("uploads/"):
            return f"/static/{path_limpo}"

        # 6. Caso genérico de segurança para outros ficheiros relativos dentro da pasta static
        return f"/static/{path_limpo}"