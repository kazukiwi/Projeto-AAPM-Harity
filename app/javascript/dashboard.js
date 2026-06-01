// Atualiza dashboard automaticamente (simulação)

function atualizarDashboard() {
    const totalProdutos = document.querySelector(".card.azul h3");
    const estoqueBaixo = document.querySelector(".card.vermelho h3");
    const valorTotal = document.querySelector(".card.verde h3");
    const categorias = document.querySelector(".card.roxo h3");

    if (!totalProdutos || !estoqueBaixo || !valorTotal || !categorias) return;

    totalProdutos.innerText = Math.floor(Math.random() * 20);
    estoqueBaixo.innerText = Math.floor(Math.random() * 5);
    categorias.innerText = Math.floor(Math.random() * 10);

    console.log("Dashboard atualizado");
}

// roda a cada 5 segundos
setInterval(atualizarDashboard, 5000);

// primeira execução imediata
atualizarDashboard();