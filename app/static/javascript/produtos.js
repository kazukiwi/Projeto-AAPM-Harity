// 1. Em vez de deixar a lista fixa, começamos pegando o que está salvo no navegador.
// Se não tiver nada, ele começa como um array vazio [].
let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

// Função responsável por desenhar a tabela e atualizar o contador
function renderizarTabelaProdutos() {
    const corpoTabela = document.getElementById("corpo-tabela");
    const contadorProdutos = document.getElementById("contador-produtos");

    if (!corpoTabela) return;

    // Atualiza o texto do cabeçalho de forma dinâmica
    contadorProdutos.textContent = `${inventario.length} produtos encontrados`;
    corpoTabela.innerHTML = ""; 

    // Se a lista estiver vazia, mostra uma mensagem amigável
    if (inventario.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #9ca3af; padding: 30px;">Nenhum produto cadastrado pelo administrador ainda.</td></tr>`;
        return;
    }

    inventario.forEach(prod => {
        const estaBaixo = prod.quantidade <= prod.min;
        
        let classeBadge = "padrao";
        const catNormalizada = prod.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (catNormalizada.includes("moveis")) classeBadge = "moveis";
        else if (catNormalizada.includes("eletronico")) classeBadge = "eletronicos";
        else if (catNormalizada.includes("escritorio")) classeBadge = "material-de-escritorio";

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
            <td><span class="sku-texto">${prod.sku}</span></td>
            <td><span class="badge-categoria ${classeBadge}">${prod.categoria}</span></td>
            <td>
                <div class="qtd-container">
                    <span class="qtd-valor ${estaBaixo ? 'critico' : ''}">${prod.quantidade}</span>
                    <span class="qtd-minimo">Min: ${prod.min || 3}</span>
                </div>
            </td>
            <td><span class="preco-texto">${parseFloat(prod.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></td>
            <td>${prod.localizacao || 'Depósito Geral'}</td>
            <td>
                <div class="acoes-container">
                    <button class="btn-acao ver" title="Visualizar"><i class="fa-regular fa-eye"></i></button>
                    <button class="btn-acao editar" title="Editar"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button class="btn-acao excluir" title="Excluir"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// Inicializa a tabela quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
    renderizarTabelaProdutos();
});