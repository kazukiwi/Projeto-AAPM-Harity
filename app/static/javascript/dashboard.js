// 1. Nossa "Base de Dados" provisória em formato de Array de Objetos
let inventario = [
    { nome: "Cadeira de Escritório", categoria: "Móveis", quantidade: 5, preco: 350.00 },
    { nome: "Notebook Dell", categoria: "Eletrônicos", quantidade: 2, preco: 4500.00 },
    { nome: "Papel A4 Resma", categoria: "Material de Escritório", quantidade: 1, preco: 25.00 },
    { nome: "Mesa de Reunião", categoria: "Móveis", quantidade: 4, preco: 1200.00 },
    { nome: "Monitor LG 24'", categoria: "Eletrônicos", quantidade: 8, preco: 850.00 },
    { nome: "Caneta Bic Caixa", categoria: "Material de Escritório", quantidade: 15, preco: 30.00 }
];

// Dados estáticos que você possuía para os armários
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
    containerAlertas.innerHTML = "";
    alertasDoEstoque.forEach(alerta => {
        const div = document.createElement("div");
        div.className = "alerta";
        div.innerHTML = `<strong>${alerta.nome}</strong><span>${alerta.unidades} ${alerta.unidades === 1 ? 'unidade' : 'unidades'}</span>`;
        containerAlertas.appendChild(div);
    });

    // Renderizando lista de categorias dinâmicas
    const containerCategorias = document.getElementById("lista-categorias");
    containerCategorias.innerHTML = "";
    Object.keys(contagemCategorias).forEach(cat => {
        const div = document.createElement("div");
        div.className = "categoria";
        div.innerHTML = `<span>${cat}</span><strong>${contagemCategorias[cat]} ${contagemCategorias[cat] === 1 ? 'produto' : 'produtos'}</strong>`;
        containerCategorias.appendChild(div);
    });
}

// 3. Gerenciamento de eventos (Cliques e Formulário)
document.addEventListener("DOMContentLoaded", () => {
    // Executa a primeira renderização dos dados iniciais
    processarERenderizarDashboard();

    const modal = document.getElementById("modal-produto");
    const btnAbrir = document.getElementById("btn-abrir-modal");
    const btnFechar = document.getElementById("btn-fechar-modal");
    const form = document.getElementById("form-produto");

    // Abrir o Modal ao clicar no botão
    btnAbrir.addEventListener("click", () => {
        modal.classList.add("active");
    });

    // Fechar o Modal ao clicar no X
    btnFechar.addEventListener("click", () => {
        modal.classList.remove("active");
        form.reset();
    });

    // Fechar o Modal se clicar na área escura de fora
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
            form.reset();
        }
    });

    // Ação de Cadastrar o Produto ao Enviar o Formulário
    form.addEventListener("submit", (e) => {
        e.preventDefault(); // Impede a página de recarregar

        // Captura os dados digitados pelo Admin
        const novoProduto = {
            nome: document.getElementById("nome").value,
            categoria: document.getElementById("categoria").value,
            quantidade: parseInt(document.getElementById("quantidade").value),
            preco: parseFloat(document.getElementById("preco").value)
        };

        // Adiciona o novo objeto dentro do nosso Array
        inventario.push(novoProduto);

        // Atualiza a tela inteira recalculando tudo imediatamente
        processarERenderizarDashboard();

        // Fecha a janela e limpa os campos
        modal.classList.remove("active");
        form.reset();
    });
});