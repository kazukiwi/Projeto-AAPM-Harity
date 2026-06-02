// Variável global para armazenar os produtos vindos do MySQL
let listaProdutosDoBanco = [];

// 1. BUSCAR PRODUTOS DO MYSQL (FASTAPI)
async function buscarProdutosDoMySQL() {
    try {
        const resposta = await fetch("/produtos"); 
        if (!resposta.ok) throw new Error("Erro ao buscar dados do MySQL");
        
        listaProdutosDoBanco = await resposta.json();
        
        // Renderiza a tabela baseada nos campos reais do banco
        renderizarTabelaProdutos(listaProdutosDoBanco);
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        document.getElementById("corpo-tabela").innerHTML = `
            <tr><td colspan="7" style="text-align:center; color:red;">Erro ao carregar dados do banco de dados.</td></tr>
        `;
    }
}

// 2. RENDERIZAR AS LINHAS DA TABELA (Sem SKU, com Imagem e Status)
function renderizarTabelaProdutos(produtos) {
    const corpoTabela = document.getElementById("corpo-tabela");
    const contador = document.getElementById("contador-produtos");
    corpoTabela.innerHTML = "";

    contador.textContent = `${produtos.length} ${produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;

    if (produtos.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum produto cadastrado ou encontrado.</td></tr>`;
        return;
    }

    produtos.forEach(prod => {
        const tr = document.createElement("tr");

        // Definição dos campos para casar com a estrutura do seu banco
        const precoFormatado = parseFloat(prod.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const urlImagem = prod.imagem_url || "/static/img/placeholder.png"; // Imagem padrão caso nula
        
        // Categoria via relacionamento ID ou fallback textual
        const categoriaNome = prod.categoria ? prod.categoria.nome : "Sem Categoria";

        // Aplica uma classe de aviso visual caso o estoque esteja baixo (3 ou menos)
        const classeEstoque = prod.estoque_atual <= 3 ? 'style="color: #dc2626; font-weight: bold;"' : '';
        
        // Badge de Status Ativo / Inativo
        const statusBadge = prod.ativo 
            ? `<span class="badge-status ativo">Ativo</span>` 
            : `<span class="badge-status inativo">Inativo</span>`;

        tr.innerHTML = `
            <td>
                <img src="${urlImagem}" alt="${prod.nome}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;">
            </td>
            <td><strong>${prod.nome}</strong></td>
            <td><span class="badge-categoria padrao">${categoriaNome}</span></td>
            <td ${classeEstoque}>${prod.estoque_atual} un</td>
            <td><span class="preco-texto">${precoFormatado}</span></td>
            <td>${statusBadge}</td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <a href="/produtos/${prod.id}/editar" class="btn-acao ver" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </a>
                    <button class="btn-acao excluir" onclick="deletarProdutoDoBanco(${prod.id})" title="Excluir" style="background:none; border:none; padding:0;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// 3. SISTEMA DE FILTRAGEM (Ajustado para os novos campos)
function aplicarFiltros() {
    const textoBusca = document.getElementById("input-busca").value.toLowerCase();
    const categoriaSelecionada = document.getElementById("select-categoria").value;
    const apenasEstoqueBaixo = document.getElementById("check-estoque-baixo").checked;

    const produtosFiltrados = listaProdutosDoBanco.filter(prod => {
        const bateTexto = prod.nome.toLowerCase().includes(textoBusca);
        
        // Compara por ID da categoria se o filtro contiver valores numéricos
        const prodCatId = prod.categoria_id ? prod.categoria_id.toString() : "";
        const bateCategoria = categoriaSelecionada === "" || prodCatId === categoriaSelecionada;
        
        const bateEstoque = !apenasEstoqueBaixo || prod.estoque_atual <= 3;

        return bateTexto && bateCategoria && bateEstoque;
    });

    renderizarTabelaProdutos(produtosFiltrados);
}

// 4. FUNÇÃO DELETAR PRODUTO DO BANCO DE DADOS
async function deletarProdutoDoBanco(id) {
    if (!id) return;
    
    if (confirm("Tem certeza que deseja desativar/excluir este produto?")) {
        try {
            const resposta = await fetch(`/produtos/${id}/desativar`, { method: "POST" });
            if (!resposta.ok) throw new Error("Erro ao alterar estado do produto");
            
            buscarProdutosDoMySQL();
        } catch (erro) {
            console.error(erro);
            alert("Erro ao remover produto.");
        }
    }
}

// 5. INICIALIZADOR
document.addEventListener("DOMContentLoaded", () => {
    buscarProdutosDoMySQL();

    document.getElementById("input-busca").addEventListener("input", aplicarFiltros);
    document.getElementById("select-categoria").addEventListener("change", aplicarFiltros);
    document.getElementById("check-estoque-baixo").addEventListener("change", aplicarFiltros);
});