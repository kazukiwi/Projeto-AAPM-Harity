// Variável global para armazenar os produtos vindos do MySQL
let listaProdutosDoBanco = [];

// 1. BUSCAR PRODUTOS DO MYSQL (FASTAPI)
async function buscarProdutosDoMySQL() {
    try {
        // Ajuste a URL se a sua rota no FastAPI for diferente (ex: /api/produtos)
        const resposta = await fetch("/produtos"); 
        if (!resposta.ok) throw new Error("Erro ao buscar dados do MySQL");
        
        listaProdutosDoBanco = await resposta.json();
        
        // Renderiza a tabela e preenche as categorias do filtro
        renderizarTabelaProdutos(listaProdutosDoBanco);
        preencherFiltroCategorias(listaProdutosDoBanco);
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        document.getElementById("corpo-tabela").innerHTML = `
            <tr><td colspan="7" style="text-align:center; color:red;">Erro ao carregar dados do banco de dados.</td></tr>
        `;
    }
}

// 2. RENDERIZAR AS LINHAS DA TABELA
function renderizarTabelaProdutos(produtos) {
    const corpoTabela = document.getElementById("corpo-tabela");
    const contador = document.getElementById("contador-produtos");
    corpoTabela.innerHTML = "";

    // Atualiza o contador de itens encontrados
    contador.textContent = `${produtos.length} ${produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;

    if (produtos.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum produto cadastrado ou encontrado.</td></tr>`;
        return;
    }

    // Passa de produto em produto gerando as tags HTML da tabela
    produtos.forEach(prod => {
        const tr = document.createElement("tr");

        // Tratamento de segurança caso o banco retorne campos vazios
        const sku = prod.sku || "N/A";
        const localizacao = prod.localizacao || "Depósito";
        const precoFormatado = parseFloat(prod.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Aplica uma classe de aviso visual caso o estoque esteja baixo (3 ou menos)
        const classeEstoque = prod.quantidade <= 3 ? 'style="color: #dc2626; font-weight: bold;"' : '';

        tr.innerHTML = `
            <td><strong>${prod.nome}</strong></td>
            <td><span class="sku-tag">${sku}</span></td>
            <td>${prod.categoria}</td>
            <td ${classeEstoque}>${prod.quantidade} un</td>
            <td>${precoFormatado}</td>
            <td>${localizacao}</td>
            <td style="text-align: center;">
                <button class="btn-acao-deletar" onclick="deletarProdutoDoBanco(${prod.id})" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// 3. PREENCHER O FILTRO SELECT DINAMICAMENTE
function preencherFiltroCategorias(produtos) {
    const selectCategoria = document.getElementById("select-categoria");
    if (!selectCategoria) return;

    // Remove duplicadas usando Set
    const categorias = [...new Set(produtos.map(p => p.categoria))];

    // Mantém apenas a primeira opção e limpa o resto anterior
    selectCategoria.innerHTML = '<option value="">Todas as categorias</option>';

    categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
    });
}

// 4. SISTEMA DE FILTRAGEM (BUSCA, CATEGORIA E ESTOQUE BAIXO)
function aplicarFiltros() {
    const textoBusca = document.getElementById("input-busca").value.toLowerCase();
    const categoriaSelecionada = document.getElementById("select-categoria").value;
    const apenasEstoqueBaixo = document.getElementById("check-estoque-baixo").checked;

    const produtosFiltrados = listaProdutosDoBanco.filter(prod => {
        const bateTexto = prod.nome.toLowerCase().includes(textoBusca) || (prod.sku && prod.sku.toLowerCase().includes(textoBusca));
        const bateCategoria = categoriaSelecionada === "" || prod.categoria === categoriaSelecionada;
        const bateEstoque = !apenasEstoqueBaixo || prod.quantidade <= 3;

        return bateTexto && bateCategoria && bateEstoque;
    });

    renderizarTabelaProdutos(produtosFiltrados);
}

// 5. FUNÇÃO PARA DELETAR PRODUTO DO BANCO DE DADOS (OPCIONAL)
async function deletarProdutoDoBanco(id) {
    if (!id) return alert("Este produto provisório não possui ID no MySQL.");
    
    if (confirm("Tem certeza que deseja excluir este produto do MySQL?")) {
        try {
            const resposta = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
            if (!resposta.ok) throw new Error("Erro ao deletar");
            
            // Recarrega a lista direto do banco atualizada
            buscarProdutosDoMySQL();
        } catch (erro) {
            console.error(erro);
            alert("Erro ao excluir produto.");
        }
    }
}

// 6. INICIALIZADOR DE EVENTOS DE DIGITAÇÃO E SELEÇÃO
document.addEventListener("DOMContentLoaded", () => {
    // Inicializa a tabela buscando do MySQL
    buscarProdutosDoMySQL();

    // Adiciona os ouvintes de eventos para filtrar conforme o usuário interage
    document.getElementById("input-busca").addEventListener("input", aplicarFiltros);
    document.getElementById("select-categoria").addEventListener("change", aplicarFiltros);
    document.getElementById("check-estoque-baixo").addEventListener("change", aplicarFiltros);
});