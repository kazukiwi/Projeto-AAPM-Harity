// 1. Simulação dos dados que o Admin vai inserir (ou que virão do banco de dados)
const dadosDoAdmin = {
    totalProdutos: 6,
    estoqueBaixo: 2,
    valorTotal: 26875.00,
    totalCategorias: 3,
    armariosOcupados: 4,
    armariosDisponiveis: 45,
    totalAssociados: 5,
    
    // Lista de produtos com estoque baixo
    alertas: [
        { nome: "Notebook Dell", unidades: 2 },
        { nome: "Papel A4 Resma", unidades: 1 }
    ],
    
    // Lista de produtos por categoria
    categorias: [
        { nome: "Móveis", quantidade: 2 },
        { nome: "Eletrônicos", quantidade: 2 },
        { nome: "Material de Escritório", quantidade: 2 }
    ]
};

// 2. Função que injeta esses dados no HTML da página
function atualizarDashboard(dados) {
    // Atualizando os cards superiores (Estoque)
    document.getElementById("total-produtos").textContent = dados.totalProdutos;
    document.getElementById("estoque-baixo").textContent = dados.estoqueBaixo;
    document.getElementById("total-categorias").textContent = dados.totalCategorias;
    
    // Formatando o valor para a moeda Real (R$)
    document.getElementById("valor-total").textContent = dados.valorTotal.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    // Atualizando os cards do meio (Armários e Associados)
    document.getElementById("armarios-ocupados").textContent = dados.armariosOcupados;
    document.getElementById("armarios-disponiveis").textContent = dados.armariosDisponiveis;
    document.getElementById("total-associados").textContent = dados.totalAssociados;

    // --- Renderizando a lista de Alertas Dinamicamente ---
    const containerAlertas = document.getElementById("lista-alertas");
    containerAlertas.innerHTML = ""; // Limpa o container antes de colocar novos dados
    
    dados.alertas.forEach(alerta => {
        const divAlerta = document.createElement("div");
        divAlerta.className = "alerta";
        divAlerta.innerHTML = `
            <strong>${alerta.nome}</strong>
            <span>${alerta.unidades} ${alerta.unidades === 1 ? 'unidade' : 'unidades'}</span>
        `;
        containerAlertas.appendChild(divAlerta);
    });

    // --- Renderizando a lista de Categorias Dinamicamente ---
    const containerCategorias = document.getElementById("lista-categorias");
    containerCategorias.innerHTML = ""; // Limpa o container antes de colocar novos dados
    
    dados.categorias.forEach(cat => {
        const divCategoria = document.createElement("div");
        divCategoria.className = "categoria";
        divCategoria.innerHTML = `
            <span>${cat.nome}</span>
            <strong>${cat.quantidade} ${cat.quantidade === 1 ? 'produto' : 'produtos'}</strong>
        `;
        containerCategorias.appendChild(divCategoria);
    });
}

// 3. Executa a função assim que a página carregar completamente
document.addEventListener("DOMContentLoaded", () => {
    atualizarDashboard(dadosDoAdmin);
});