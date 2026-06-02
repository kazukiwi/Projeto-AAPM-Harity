// 1. CARREGAMENTO DOS DADOS DO LOCALSTORAGE
let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

// Dados estáticos para os armários
const dadosArmarios = {
    armariosOcupados: 4,
    armariosDisponiveis: 45,
    totalAssociados: 5
};

// 2. Função principal para calcular e renderizar o Dashboard
function processarERenderizarDashboard() {
    let totalProdutos = 0;
    let estoqueBaixoContador = 0;
    let valorTotalEstoque = 0;
    
    let alertasDoEstoque = [];
    let contagemCategorias = {};

    // Passa de produto em produto calculando as métricas em tempo real
    inventario.forEach(prod => {
        totalProdutos += prod.quantidade;
        valorTotalEstoque += (prod.quantidade * prod.preco);

        // Regra de Estoque Baixo: Se tiver menos ou igual a 3 unidades
        if (prod.quantidade <= 3) {
            estoqueBaixoContador++;
            alertasDoEstoque.push({ nome: prod.nome, unidades: prod.quantidade });
        }

        // Agrupamento por categorias
        if (contagemCategorias[prod.categoria]) {
            contagemCategorias[prod.categoria]++;
        } else {
            contagemCategorias[prod.categoria] = 1;
        }
    });

    const totalCategoriasUnicas = Object.keys(contagemCategorias).length;

    // Injetando os resultados processados nos Cards de Estoque
    document.getElementById("total-produtos").textContent = totalProdutos;
    document.getElementById("estoque-baixo").textContent = estoqueBaixoContador;
    document.getElementById("total-categorias").textContent = totalCategoriasUnicas;
    document.getElementById("valor-total").textContent = valorTotalEstoque.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    // Injetando dados fixos de Armários
    document.getElementById("armarios-ocupados").textContent = dadosArmarios.armariosOcupados;
    document.getElementById("armarios-disponiveis").textContent = dadosArmarios.armariosDisponiveis;
    document.getElementById("total-associados").textContent = dadosArmarios.totalAssociados;

    // Renderizando lista de alertas dinâmicos
    const containerAlertas = document.getElementById("lista-alertas");
    if (containerAlertas) {
        containerAlertas.innerHTML = "";
        
        if (alertasDoEstoque.length === 0) {
            containerAlertas.innerHTML = `<div style="color: #6b7280; padding: 10px;">Nenhum alerta de estoque baixo.</div>`;
        } else {
            alertasDoEstoque.forEach(alerta => {
                const div = document.createElement("div");
                div.className = "alerta";
                div.innerHTML = `<strong>${alerta.nome}</strong><span style="color: #dc2626; font-weight: bold;">${alerta.unidades} ${alerta.unidades === 1 ? 'unidade' : 'unidades'}</span>`;
                containerAlertas.appendChild(div);
            });
        }
    }

    // Renderizando lista de categorias dinâmicas
    const containerCategorias = document.getElementById("lista-categorias");
    if (containerCategorias) {
        containerCategorias.innerHTML = "";
        
        if (totalCategoriasUnicas === 0) {
            containerCategorias.innerHTML = `<div style="color: #6b7280; padding: 10px;">Nenhuma categoria cadastrada.</div>`;
        } else {
            Object.keys(contagemCategorias).forEach(cat => {
                const div = document.createElement("div");
                div.className = "categoria";
                div.innerHTML = `<span>${cat}</span><strong>${contagemCategorias[cat]} ${contagemCategorias[cat] === 1 ? 'produto' : 'produtos'}</strong>`;
                containerCategorias.appendChild(div);
            });
        }
    }
}

// 3. Inicializador de Eventos (Lógica antiga do modal removida)
document.addEventListener("DOMContentLoaded", () => {
    // Executa a primeira renderização lendo o LocalStorage
    processarERenderizarDashboard();
});