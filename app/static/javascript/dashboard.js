// Dados estáticos para os armários (mantidos caso queira usar no JS futuramente)
const dadosArmarios = {
    armariosOcupados: 4,
    armariosDisponiveis: 45,
    totalAssociados: 5
};

// Removemos toda a colisão com o estoque e mantemos apenas inicializações visuais necessárias
document.addEventListener("DOMContentLoaded", () => {
    console.log("Dashboard carregado com dados reais do banco de dados!");
    
    // Caso precise injetar os dados de armários dinamicamente por aqui:
    const armOcup = document.getElementById("armarios-ocupados");
    const armDisp = document.getElementById("armarios-disponiveis");
    const totAssoc = document.getElementById("total-associados");

    if (armOcup) armOcup.textContent = dadosArmarios.armariosOcupados;
    if (armDisp) armDisp.textContent = dadosArmarios.armariosDisponiveis;
    if (totAssoc) totAssoc.textContent = dadosArmarios.totalAssociados;
});