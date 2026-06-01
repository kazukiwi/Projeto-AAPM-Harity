// Função para buscar os produtos do backend e renderizar na tela
async function carregarEFiltrarProdutos() {
    const corpoTabela = document.getElementById("corpo-tabela");
    const contadorProdutos = document.getElementById("contador-produtos");

    if (!corpoTabela) return;

    try {
        // 1. Faz a requisição para a rota da API que gerencia os produtos
        // Ajuste a URL abaixo de acordo com a rota real criada no seu 'produto_controller'
        const resposta = await fetch('/api/produtos'); 
        
        if (!resposta.ok) {
            throw new Error('Erro ao buscar dados do servidor');
        }

        const inventario = await resposta.json();

        // 2. Atualiza o texto do cabeçalho com a quantidade real do banco
        contadorProdutos.textContent = `${inventario.length} produtos encontrados`;
        corpoTabela.innerHTML = ""; 

        // 3. Varre a lista dinâmica retornada pelo Admin/Backend
        inventario.forEach(prod => {
            // Garante a tipagem correta dos valores vindos do banco
            const qtdAtual = parseInt(prod.quantidade);
            const qtdMinima = parseInt(prod.min || prod.quantidade_minima || 3);
            const precoFormatado = parseFloat(prod.preco);

            // Valida se o estoque atual está abaixo ou no limite mínimo
            const estaBaixo = qtdAtual <= qtdMinima;
            
            // Define a classe CSS correta para aplicar a cor do badge da categoria
            let classeBadge = "padrao";
            const categoriaTexto = prod.categoria?.nome || prod.categoria || "Geral";
            const catNormalizada = categoriaTexto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (catNormalizada.includes("moveis")) classeBadge = "moveis";
            else if (catNormalizada.includes("eletronico")) classeBadge = "eletronicos";
            else if (catNormalizada.includes("escritorio")) classeBadge = "material-de-escritorio";

            // Cria a linha da tabela dinamicamente com os dados reais
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div class="nome-produto-celula">
                        ${estaBaixo ? '<i class="fa-solid fa-circle-exclamation icone-aviso-estoque" title="Estoque Crítico!"></i>' : ''}
                        <div class="detalhes-produto">
                            <strong>${prod.nome}</strong>
                            <span>${prod.descricao || 'Sem descrição'}</span>
                        </div>
                    </div>
                </td>
                <td><span class="sku-texto">${prod.sku || 'N/A'}</span></td>
                <td><span class="badge-categoria ${classeBadge}">${categoriaTexto}</span></td>
                <td>
                    <div class="qtd-container">
                        <span class="qtd-valor ${estaBaixo ? 'critico' : ''}">${qtdAtual}</span>
                        <span class="qtd-minimo">Min: ${qtdMinima}</span>
                    </div>
                </td>
                <td><span class="preco-texto">${precoFormatado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></td>
                <td>${prod.localizacao || 'Não informada'}</td>
                <td>
                    <div class="acoes-container">
                        <button class="btn-acao ver" title="Visualizar" onclick="visualizarProduto(${prod.id})"><i class="fa-regular fa-eye"></i></button>
                        <button class="btn-acao editar" title="Editar" onclick="editarProduto(${prod.id})"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button class="btn-acao excluir" title="Excluir" onclick="excluirProduto(${prod.id})"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            corpoTabela.appendChild(tr);
        });

    } catch (erro) {
        console.error('Erro na sincronização de produtos:', erro);
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red; padding:20px;">Erro ao carregar a lista de produtos em tempo real.</td></tr>`;
    }
}

// Funções de apoio para os botões de ação (Mapeadas usando o ID do banco)
function visualizarProduto(id) { console.log("Visualizar produto ID:", id); }
function editarProduto(id) { console.log("Editar produto ID:", id); }
function excluirProduto(id) { console.log("Excluir produto ID:", id); }

// Inicializa a tabela buscando os dados do banco assim que a página carrega
document.addEventListener("DOMContentLoaded", () => {
    carregarEFiltrarProdutos();
});