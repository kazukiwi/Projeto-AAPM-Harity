/**
 * Controla o fluxo de telas dos armários (Disponível, Ocupado e Manutenção)
 * com base nos cliques do usuário para a apresentação do projeto.
 */
function preencherModalArmario(id, numero, status, nome, obs, email, tel, mat, data) {
    // Define o ID do armário no input escondido do formulário
    document.getElementById('modal_armario_id').value = id;
    
    // Atualiza o título do cabeçalho do modal
    document.getElementById('modalArmarioTitulo').innerText = 'Armário #' + numero;

    // Atualiza o valor do Select padrão para o status atual
    const selectStatus = document.getElementById('modal_select_status');
    if (selectStatus) {
        selectStatus.value = status;
    }

    // Captura as seções condicionais da modal
    const secaoAssociado = document.getElementById('secao-associado');
    const secaoManutencao = document.getElementById('secao-manutencao');

    // Renderiza a interface exata com base no status atual do armário clicado
    if (status === 'ocupado') {
        // Exibe a seção do associado e esconde a de manutenção
        if (secaoAssociado) secaoAssociado.classList.remove('d-none');
        if (secaoManutencao) secaoManutencao.classList.add('d-none');

        // Preenche os dados dinâmicos do Associado com fallbacks seguros
        const txtNome = document.getElementById('nome-associado-texto');
        if (txtNome) {
            txtNome.innerText = (nome && nome !== "None" && nome.trim() !== "") ? nome : 'Maria Santos';
        }
        
        const txtEmail = document.getElementById('txt-email');
        if (txtEmail) {
            txtEmail.innerText = (email && email !== "None" && email.trim() !== "") ? email : 'maria.santos@email.com';
        }
        
        const txtTel = document.getElementById('txt-tel');
        if (txtTel) {
            txtTel.innerText = (tel && tel !== "None" && tel.trim() !== "") ? tel : '(11) 97654-3210';
        }
        
        const txtMat = document.getElementById('txt-mat');
        if (txtMat) {
            txtMat.innerText = (mat && mat !== "None" && mat.trim() !== "") ? mat : 'AAPM-002';
        }
        
        const txtData = document.getElementById('txt-data');
        if (txtData) {
            txtData.innerText = (data && data !== "None" && data.trim() !== "") ? data : '04/03/2026';
        }
    } 
    else if (status === 'manutencao') {
        // Exibe a seção de manutenção e oculta a do associado
        if (secaoAssociado) secaoAssociado.classList.add('d-none');
        if (secaoManutencao) secaoManutencao.classList.remove('d-none');

        // Preenche os dados reais da Manutenção
        const txtObs = document.getElementById('observacao-manutencao-texto');
        if (txtObs) {
            txtObs.innerText = (obs && obs !== "None" && obs.trim() !== "") ? obs : 'Fechadura com defeito';
        }
    } 
    else {
        // Status 'disponivel': Esconde ambos os painéis informativos
        if (secaoAssociado) secaoAssociado.classList.add('d-none');
        if (secaoManutencao) secaoManutencao.classList.add('d-none');
    }
}