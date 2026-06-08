document.addEventListener('DOMContentLoaded', function () {
    
    // 1. CAPTURA DOS DADOS DO DOM HTML
    const containerDados = document.getElementById('dados-jinja');
    if (!containerDados) {
        console.error("Elemento #dados-jinja não foi encontrado.");
        return;
    }

    let dadosProdutosLabels = JSON.parse(containerDados.getAttribute('data-produtos-labels') || '[]');
    let dadosProdutosValores = JSON.parse(containerDados.getAttribute('data-produtos-valores') || '[]');
    let dadosCategoriasLabels = JSON.parse(containerDados.getAttribute('data-categorias-labels') || '[]');
    let dadosCategoriasValores = JSON.parse(containerDados.getAttribute('data-categorias-valores') || '[]');

    // ============================================================
    // 2. SISTEMA DE EXPORTAÇÃO PARA PLANILHA (CSV)
    // ============================================================
    const btnExportar = document.querySelector('.btn-exportar-csv');
    if (btnExportar) {
        btnExportar.addEventListener('click', function () {
            let csv = [];
            const rows = document.querySelectorAll("table.tabela-vendas tr");
            
            for (let i = 0; i < rows.length; i++) {
                let row = [], cols = rows[i].querySelectorAll("td, th");
                for (let j = 0; j < cols.length; j++) {
                    let texto = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, " ").trim();
                    row.push('"' + texto.replace(/"/g, '""') + '"');
                }
                csv.push(row.join(";"));
            }

            const csvContent = "\uFEFF" + csv.join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "relatorio_mais_vendidos.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // ============================================================
    // 3. GRÁFICO: Top Produtos (Barras)
    // ============================================================
    const ctxBarras = document.getElementById('chartTopProdutos');
    if (ctxBarras && dadosProdutosLabels.length > 0) {
        new Chart(ctxBarras, {
            type: 'bar',
            data: {
                labels: dadosProdutosLabels,
                datasets: [{
                    label: 'Unidades Vendidas',
                    data: dadosProdutosValores,
                    backgroundColor: '#2563eb',
                    borderRadius: 6,
                    barThickness: 25
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // ============================================================
    // 4. GRÁFICO: Vendas por Categoria (Rosca)
    // ============================================================
    const ctxRosca = document.getElementById('chartCategorias');
    if (ctxRosca && dadosCategoriasLabels.length > 0) {
        new Chart(ctxRosca, {
            type: 'doughnut',
            data: {
                labels: dadosCategoriasLabels,
                datasets: [{
                    data: dadosCategoriasValores,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 15 }
                    }
                },
                cutout: '70%'
            }
        });
    }
});

function mudarOrdenacao(tipo) {
    const btnQtd = document.getElementById('btn-ordem-qtd');
    const btnReceita = document.getElementById('btn-ordem-receita');
    
    if (tipo === 'quantidade') {
        btnQtd.classList.add('active');
        btnReceita.classList.remove('active');
    } else {
        btnReceita.classList.add('active');
        btnQtd.classList.remove('active');
    }
}