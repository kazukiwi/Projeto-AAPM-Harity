// Base de dados provisória contendo exatamente os registros da imagem fornecida
let inventario = [
    { 
        nome: "Cadeira de Escritório", 
        descricao: "Cadeira ergonômica com ajuste de altura", 
        sku: "CAD-001", 
        categoria: "Móveis", 
        quantidade: 15, 
        min: 5, 
        preco: 450.00, 
        localizacao: "Armazém A - Prateleira 3" 
    },
    { 
        nome: "Mesa de Reunião", 
        descricao: "Mesa para 8 pessoas", 
        sku: "MES-002", 
        categoria: "Móveis", 
        quantidade: 3, 
        min: 2, 
        preco: 1200.00, 
        localizacao: "Armazém B - Setor 1" 
    },
    { 
        nome: "Notebook Dell", 
        descricao: "Notebook i7, 16GB RAM, 512GB SSD", 
        sku: "NB-003", 
        categoria: "Eletrônicos", 
        quantidade: 2, 
        min: 5, 
        preco: 4500.00, 
        localizacao: "Sala Segura - Armário 2" 
    },
    { 
        nome: "Monitor LG 27\"", 
        descricao: "Monitor Full HD IPS", 
        sku: "MON-004", 
        categoria: "Eletrônicos", 
        quantidade: 8, 
        min: 3, 
        preco: 850.00, 
        localizacao: "Armazém A - Prateleira 1" 
    },
    { 
        nome: "Papel A4 Resma", 
        descricao: "Resma com 500 folhas", 
        sku: "PAP-005", 
        categoria: "Material de Escritório", 
        quantidade: 1, 
        min: 10, 
        preco: 25.00, 
        localizacao: "Depósito - Prateleira 5" 
    },
    { 
        nome: "Caneta Azul BIC", 
        descricao: "Caixa com 50 unidades", 
        sku: "CAN-006", 
        categoria: "Material de Escritório", 
        quantidade: 20, 
        min: 5, 
        preco: 35.00, 
        localizacao: "Depósito - Prateleira 4" 
    }
];

// Função responsável por desenhar a tabela e atualizar o contador
function renderizarTabelaProdutos() {
    const corpoTabela = document.getElementById("corpo-tabela");
    const contadorProdutos = document.getElementById("contador-produtos");

    if (!corpoTabela) return;

    // Atualiza o texto do cabeçalho de forma dinâmica
    contadorProdutos.textContent = `${inventario.length} produtos encontrados`;
    corpoTabela.innerHTML = ""; 

    inventario.forEach(prod => {
        // Valida se o estoque atual está abaixo ou no limite mínimo
        const estaBaixo = prod.quantidade <= prod.min;
        
        // Define a classe CSS correta para aplicar a cor do badge da categoria
        let classeBadge = "padrao";
        const catNormalizada = prod.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (catNormalizada.includes("moveis")) classeBadge = "moveis";
        else if (catNormalizada.includes("eletronico")) classeBadge = "eletronicos";
        else if (catNormalizada.includes("escritorio")) classeBadge = "material-de-escritorio";

        // Cria a linha da tabela dinamicamente
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="nome-produto-celula">
                    ${estaBaixo ? '<i class="fa-solid fa-circle-exclamation icone-aviso-estoque" title="Estoque Crítico!"></i>' : ''}
                    <div class="detalhes-produto">
                        <strong>${prod.nome}</strong>
                        <span>${prod.descricao}</span>
                    </div>
                </div>
            </td>
            <td><span class="sku-texto">${prod.sku}</span></td>
            <td><span class="badge-categoria ${classeBadge}">${prod.categoria}</span></td>
            <td>
                <div class="qtd-container">
                    <span class="qtd-valor ${estaBaixo ? 'critico' : ''}">${prod.quantidade}</span>
                    <span class="qtd-minimo">Min: ${prod.min}</span>
                </div>
            </td>
            <td><span class="preco-texto">${prod.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></td>
            <td>${prod.localizacao}</td>
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