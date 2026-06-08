// Mocking de dados simulando perfeitamente a imagem enviada
const armariosDados = [];
for (let i = 1; i <= 50; i++) {
    let status = 'disponivel';
    // Define os azuis (ocupados) e laranjas (manutenção) baseados na imagem
    if ([1, 5, 12, 25].includes(i)) status = 'ocupado';
    if (i === 20) status = 'manutencao';
    
    armariosDados.push({ id: i, status: status });
}

let armarioSelecionadoId = null;

// Renderizar o grid de armários dinamicamente
function renderizarGrid(filtro = 'todos') {
    const container = document.getElementById('container-grid-armarios');
    if (!container) return;
    container.innerHTML = '';

    armariosDados.forEach(armario => {
        if (filtro !== 'todos' && armario.status !== filtro) return;

        const btn = document.createElement('button');
        btn.className = `card-armario armario-${armario.status}`;
        
        // Define o ícone correto baseado no estado atual
        let icone = 'fa-lock-open';
        if (armario.status === 'ocupado') icone = 'fa-lock';
        if (armario.status === 'manutencao') icone = 'fa-wrench';

        btn.innerHTML = `
            <i class="fa-solid ${icone}" style="font-size: 16px;"></i>
            <span>${armario.id}</span>
        `;

        // Regra de negócio: clique só funciona e abre tela se for VERDE (disponível)
        btn.onclick = () => {
            if (armario.status === 'disponivel') {
                abrirModalArmario(armario.id);
            } else {
                alert(`Armário #${armario.id} não está disponível para modificação direta (Status: ${armario.status.toUpperCase()}).`);
            }
        };

        container.appendChild(btn);
    });
}

// Alternar entre os filtros de visualização superior
function filtrarArmarios(status) {
    const botoes = document.querySelectorAll('.btn-periodo');
    botoes.forEach(btn => btn.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }

    renderizarGrid(status);
}

// Abrir a tela modal customizada (Imagem 4)
function abrirModalArmario(id) {
    armarioSelecionadoId = id;
    document.getElementById('modal-titulo-armario').innerText = `Armário #${id}`;
    document.getElementById('modal-armario').style.display = 'flex';
}

// Função do Botão Azul (Atribuir Associado)
function atribuirAssociado() {
    alert(`Redirecionando/Ação para Atribuir Associado ao Armário #${armarioSelecionadoId}`);
    document.getElementById('modal-armario').style.display = 'none';
}

// Função do Botão Laranja (Marcar Manutenção)
function marcarManutencao() {
    alert(`Armário #${armarioSelecionadoId} foi colocado na lista de manutenção.`);
    document.getElementById('modal-armario').style.display = 'none';
}

// Exportação para arquivo Excel (.csv tratado com cabeçalho legível)
function exportarParaExcel() {
    // Adiciona o caractere BOM (\uFEFF) para forçar o Excel a ler os acentos e pontuação em UTF-8 corretamente
    let conteudoCsv = "\uFEFFID do Armário,Status do Armário\n";
    
    armariosDados.forEach(a => {
        let statusFormatado = "DISPONÍVEL";
        if (a.status === 'ocupado') statusFormatado = "OCUPADO";
        if (a.status === 'manutencao') statusFormatado = "EM MANUTENÇÃO";
        
        conteudoCsv += `${a.id},${statusFormatado}\n`;
    });

    const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "controle_de_armarios_aapm.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Gatilho inicial ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    renderizarGrid();
});