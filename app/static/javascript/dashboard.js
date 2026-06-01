// 1. CARREGAMENTO DOS DADOS DO LOCALSTORAGE
// Buscamos o inventário salvo no navegador. Se não houver nada, ele inicia como um array vazio [].
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
    containerAlertas.innerHTML = "";
    
    if (alertasDoEstoque.length === 0) {
        containerAlertas.innerHTML = `<div style="color: #6b7280; padding: 10px;">Nenhum alerta de estoque baixo.</div>`;
    } else {
        alertasDoEstoque.forEach(alerta => {
            const div = document.createElement("div");
            div.className = "alerta";
            div.innerHTML = `<strong>${alerta.nome}</strong><span>${alerta.unidades} ${alerta.unidades === 1 ? 'unidade' : 'unidades'}</span>`;
            containerAlertas.appendChild(div);
        });
    }

    // Renderizando lista de categorias dinâmicas
    const containerCategorias = document.getElementById("lista-categorias");
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

// 3. Gerenciamento de eventos (Cliques e Formulário)
document.addEventListener("DOMContentLoaded", () => {
    // Executa a primeira renderização lendo o LocalStorage
    processarERenderizarDashboard();

    const modal = document.getElementById("modal-produto");
    const btnAbrir = document.getElementById("btn-abrir-modal");
    const btnFechar = document.getElementById("btn-fechar-modal");
    const form = document.getElementById("form-produto");

    // Abrir o Modal ao clicar no botão
    if (btnAbrir) {
        btnAbrir.addEventListener("click", () => {
            modal.classList.add("active");
        });
    }

    // Fechar o Modal ao clicar no X
    if (btnFechar) {
        btnFechar.addEventListener("click", () => {
            modal.classList.remove("active");
            form.reset();
        });
    }

    // Fechar o Modal se clicar na área escura de fora
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
                form.reset();
            }
        });
    }

    // Ação de Cadastrar o Produto ao Enviar o Formulário
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault(); // Impede a página de recarregar

            // Captura os dados digitados pelo Admin e adiciona propriedades extras para a tabela de produtos
            const novoProduto = {
                nome: document.getElementById("nome").value,
                categoria: document.getElementById("categoria").value,
                quantidade: parseInt(document.getElementById("quantidade").value),
                preco: parseFloat(document.getElementById("preco").value),
                sku: "SKU-" + Math.floor(1000 + Math.random() * 9000), // Gera SKU automático (ex: SKU-4521)
                min: 3,
                localizacao: "Depósito Geral"
            };

            // Adiciona o novo objeto dentro do nosso Array
            inventario.push(novoProduto);

            // 🟢 SALVA NO LOCALSTORAGE: Garante que os dados persistem ao mudar de página
            localStorage.setItem("inventario", JSON.stringify(inventario));

            // Atualiza a tela inteira recalculando tudo imediatamente
            processarERenderizarDashboard();

            // Fecha a janela e limpa os campos
            modal.classList.remove("active");
            form.reset();
        });
    }
});