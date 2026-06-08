// Variáveis globais para armazenar os dados vindos do banco e os gráficos
let dadosProdutosAPI = [];
let graficoBarras = null;
let graficoPizza = null;
let filtroAtualCategoria = 'todas';
let ordenacaoAtual = 'quantidade'; // quantidade ou receita

// Inicialização da Página ao carregar o navegador
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Primeiro inicializa os gráficos vazios com o layout correto
    inicializarGraficos();
    
    // 2. Busca os dados reais do banco através da rota da API
    await carregarDadosDaAPI();
});

// Função que faz o fetch dos dados reais da API do FastAPI
async function carregarDadosDaAPI() {
    try {
        // Faz a requisição HTTP GET para a rota do seu backend
        const resposta = await fetch('/api/v1/produtos/mais-vendidos');
        
        if (!resposta.ok) {
            throw new Error(`Erro na requisição: ${resposta.status}`);
        }
        
        // Converte a resposta do FastAPI para JSON e joga na nossa variável global
        dadosProdutosAPI = await resposta.json();
        
        // Recalcula os cards superiores de forma dinâmica com base nos dados do banco
        atualizarCardsIndicadores(dadosProdutosAPI);
        
        // Renderiza a tabela e atualiza os gráficos com os dados reais
        renderizarTabelaERanking();
        
    } catch (erro) {
        console.error("Falha ao carregar dados reais da API:", erro);
        // Fallback de segurança: Caso a API dê erro ou não esteja pronta, cria uma linha de aviso na tabela
        const tbody = document.getElementById('corpo-tabela-ranking');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#dc2626; padding:20px;">⚠️ Erro ao conectar com o banco de dados de produtos.</td></tr>`;
        }
    }
}

// Função para atualizar dinamicamente os valores dos 3 cards superiores
function atualizarCardsIndicadores(produtos) {
    if (!produtos || produtos.length === 0) return;

    // Calcula os totais do banco dinamicamente
    const totalVendas = produtos.reduce((acc, p) => acc + p.vendas, 0);
    const receitaTotal = produtos.reduce((acc, p) => acc + p.receita, 0);
    const ticketMedio = totalVendas > 0 ? (receitaTotal / totalVendas) : 0;

    // Atualiza os elementos na tela (procura pelos h2 dentro dos cards)
    const cards = document.querySelectorAll('.card-corpo-ind h2');
    if (cards.length >= 3) {
        cards[0].innerHTML = `${totalVendas} <span class="txt-sub">unidades vendidas</span>`;
        cards[1].innerHTML = `R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span class="txt-sub">em vendas</span>`;
        cards[2].innerHTML = `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span class="txt-sub">por unidade</span>`;
    }
}

// Função para montar a Tabela e atualizar os Gráficos de acordo com filtros e ordenação
function renderizarTabelaERanking() {
    const tbody = document.getElementById('corpo-tabela-ranking');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 1. Filtrar os dados por Categoria
    let dadosFiltrados = dadosProdutosAPI.filter(p => {
        return filtroAtualCategoria === 'todas' || p.categoria === filtroAtualCategoria;
    });

    // 2. Ordenar os dados por Quantidade ou por Receita
    if (ordenacaoAtual === 'quantidade') {
        dadosFiltrados.sort((a, b) => b.vendas - a.vendas);
    } else {
        dadosFiltrados.sort((a, b) => b.receita - a.receita);
    }

    // Limita para exibir no máximo os 8 primeiros nos gráficos (Top 8)
    const dadosTop8 = dadosFiltrados.slice(0, 8);

    // 3. Montar as linhas da tabela dinamicamente
    dadosFiltrados.forEach((prod, index) => {
        const tr = document.createElement('tr');
        
        let classeBadge = 'cat-escritorio';
        if (prod.categoria === 'Móveis' || prod.categoria.toLowerCase() === 'móveis') classeBadge = 'cat-moveis';
        if (prod.categoria === 'Eletrônicos' || prod.categoria.toLowerCase() === 'eletrônicos') classeBadge = 'cat-eletronicos';

        // Destaca medalhas para o top 3
        let iconeRank = index < 3 ? `<i class="fa-solid fa-medal" style="color: ${index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : '#cd7f32'}"></i>` : '';

        tr.innerHTML = `
            <td style="font-weight: 600;">${iconeRank} #${index + 1}</td>
            <td>
                <div style="font-weight: 600; color: #1e293b;">${prod.nome}</div>
                <div style="font-size: 11px; color: #94a3b8;">${prod.codigo || 'SEM-COD'}</div>
            </td>
            <td><span class="badge-categoria ${classeBadge}">${prod.categoria}</span></td>
            <td style="font-weight: 500;">${prod.vendas} <span style="font-size: 11px; color: #64748b; display:block;">unidades</span></td>
            <td style="font-weight: 600; color: #10b981;">R$ ${prod.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>R$ ${(prod.precoMedio || (prod.receita / prod.vendas)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>
                <div class="progress-container-table">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${prod.percentual || 0}%;"></div>
                    </div>
                    <span style="font-size: 12px; font-weight: 600; color: #475569;">${prod.percentual || 0}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Atualiza os dados visuais do Chart.js
    if (graficoBarras && graficoPizza) {
        atualizarDadosDosGraficos(dadosTop8);
    }
}

// Inicialização estruturada da estrutura vazia usando o Chart.js
function inicializarGraficos() {
    // Gráfico de Barras (Top Produtos)
    const ctxBarras = document.getElementById('graficoBarrasProdutos').getContext('2d');
    graficoBarras = new Chart(ctxBarras, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Métrica Selecionada',
                data: [],
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { drawBorder: false } }, x: { grid: { display: false } } }
        }
    });

    // Gráfico de Pizza (Categorias)
    const ctxPizza = document.getElementById('graficoPizzaCategorias').getContext('2d');
    graficoPizza = new Chart(ctxPizza, {
        type: 'pie',
        data: {
            labels: ['Material de Escritório', 'Móveis', 'Eletrônicos'],
            datasets: [{
                data: [0, 0, 0], // Inicia zerado e calcula via banco depois
                backgroundColor: ['#f97316', '#3b82f6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } } }
        }
    });
}

// Atualizar os vetores internos do Chart.js de forma reativa
function atualizarDadosDosGraficos(dadosTop8) {
    // 1. Atualizar Gráfico de Barras
    graficoBarras.data.labels = dadosTop8.map(p => p.nome);
    graficoBarras.data.datasets[0].data = dadosTop8.map(p => ordenacaoAtual === 'quantidade' ? p.vendas : p.receita);
    graficoBarras.data.datasets[0].label = ordenacaoAtual === 'quantidade' ? 'Unidades Vendidas' : 'Receita em R$';
    graficoBarras.update();

    // 2. Calcular distribuição proporcional real para o Gráfico de Pizza
    let qtdEscritorio = 0, qtdMoveis = 0, qtdEletronicos = 0;
    
    dadosProdutosAPI.forEach(p => {
        const cat = p.categoria.toLowerCase();
        if (cat.includes('escritório') || cat.includes('escritorio')) qtdEscritorio += p.vendas;
        else if (cat.includes('móveis') || cat.includes('moveis')) qtdMoveis += p.vendas;
        else if (cat.includes('eletrônico') || cat.includes('eletronico')) qtdEletronicos += p.vendas;
    });

    const totalGeralCategorias = qtdEscritorio + qtdMoveis + qtdEletronicos;
    if (totalGeralCategorias > 0) {
        const pctEscritorio = Math.round((qtdEscritorio / totalGeralCategorias) * 100);
        const pctMoveis = Math.round((qtdMoveis / totalGeralCategorias) * 100);
        const pctEletronicos = Math.round((qtdEletronicos / totalGeralCategorias) * 100);
        
        graficoPizza.data.datasets[0].data = [pctEscritorio, pctMoveis, pctEletronicos];
        graficoPizza.update();
    }
}

// Controladores dos Filtros Superiores da Tela
function alterarFiltroCategoria() {
    filtroAtualCategoria = document.getElementById('filtro-categoria').value;
    renderizarTabelaERanking();
}

function mudarOrdenacao(tipo) {
    ordenacaoAtual = tipo;
    
    document.getElementById('btn-ordem-qtd').classList.remove('active');
    document.getElementById('btn-ordem-receita').classList.remove('active');
    
    if (tipo === 'quantidade') {
        document.getElementById('btn-ordem-qtd').classList.add('active');
    } else {
        document.getElementById('btn-ordem-receita').classList.add('active');
    }
    
    renderizarTabelaERanking();
}

// Exportação dinâmica baseada no estado vindo do seu Banco de Dados
function exportarProdutosCSV() {
    if (dadosProdutosAPI.length === 0) return alert("Nenhum dado disponível para exportação.");
    
    let csv = "\uFEFFRanking,Produto,Código,Categoria,Vendas,Receita(R$)\n";
    dadosProdutosAPI.forEach((p, i) => {
        csv += `${i + 1},${p.nome},${p.codigo || ''},${p.categoria},${p.vendas},${p.receita}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ranking_produtos_real_aapm.csv";
    link.click();
}