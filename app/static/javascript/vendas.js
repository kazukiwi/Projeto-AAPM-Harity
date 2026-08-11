let carrinho = [];

document.addEventListener('DOMContentLoaded', function () {
    const selectProd = document.getElementById('select-prod');
    const selectCliente = document.getElementById('select-cliente');
    const grupoTamanho = document.getElementById('grupo-tamanho');
    const selectTamanho = document.getElementById('pdv-tamanho');
    const formAddItem = document.getElementById('form-add-item-pdv');

    // 1. Monitora a mudança do produto para atualizar campos e exibir tamanho se for camiseta
    if (selectProd) {
        selectProd.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            const nomeProduto = selectedOption.getAttribute('data-nome') || '';
            const preco = selectedOption.getAttribute('data-preco');
            const estoque = selectedOption.getAttribute('data-estoque');

            if (preco) {
                document.getElementById('pdv-preco').value = `R$ ${parseFloat(preco).toFixed(2).replace('.', ',')}`;
            }
            if (estoque) {
                document.getElementById('pdv-estoque').value = `${estoque} un`;
                document.getElementById('pdv-qtd').max = estoque;
            }
            document.getElementById('pdv-qtd').value = 1;

            // Verifica se o termo 'camiseta' existe no nome do produto
            if (grupoTamanho && selectTamanho && nomeProduto.toLowerCase().includes('camiseta')) {
                grupoTamanho.style.display = 'block';
                selectTamanho.required = true;
            } else if (grupoTamanho && selectTamanho) {
                grupoTamanho.style.display = 'none';
                selectTamanho.required = false;
                selectTamanho.value = '';
            }
        });
    }

    // 2. Controla a inserção do item no carrinho local
    if (formAddItem) {
        formAddItem.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!selectProd || !selectProd.value) return;

            const option = selectProd.options[selectProd.selectedIndex];
            if (!selectProd.value) return;

            const pId = parseInt(selectProd.value);
            const nome = option.getAttribute('data-nome');
            const preco = parseFloat(option.getAttribute('data-preco'));
            const estoqueMax = parseInt(option.getAttribute('data-estoque'));
            const qtd = parseInt(document.getElementById('pdv-qtd').value);
            const tamanho = grupoTamanho && grupoTamanho.style.display === 'block'
                ? selectTamanho.value
                : null;

            if (grupoTamanho && grupoTamanho.style.display === 'block' && !tamanho) {
                selectTamanho.reportValidity();
                return;
            }

            // Evita duplicados idênticos (mesmo ID e mesmo Tamanho)
            const itemExistente = carrinho.find(item => item.produto_id === pId && item.tamanho === tamanho);

            if (itemExistente) {
                if (itemExistente.quantidade + qtd > estoqueMax) {
                    alert("A quantidade total excede o estoque disponível!");
                    return;
                }
                itemExistente.quantidade += qtd;
            } else {
                if (qtd > estoqueMax) {
                    alert("A quantidade inserida excede o estoque disponível!");
                    return;
                }
                carrinho.push({
                    produto_id: pId,
                    nome: nome,
                    preco: preco,
                    quantidade: qtd,
                    tamanho: tamanho
                });
            }

            atualizarTabelaCarrinho();

            // Reseta os campos do formulário para o próximo item
            selectProd.value = "";
            document.getElementById('pdv-estoque').value = "--";
            document.getElementById('pdv-preco').value = "R$ 0,00";
            document.getElementById('pdv-qtd').value = 1;
            if (grupoTamanho && selectTamanho) {
                grupoTamanho.style.display = 'none';
                selectTamanho.required = false;
                selectTamanho.value = '';
            }
        });
    }

    if (selectCliente) {
        selectCliente.addEventListener('change', function () {
            atualizarTabelaCarrinho();
        });
    }
});

// 3. Atualiza a exibição da tabela do carrinho e do input serializado
function atualizarTabelaCarrinho() {
    const corpo = document.getElementById('corpo-carrinho-pdv');
    const totalBrutoTxt = document.getElementById('pdv-total-bruto');
    const totalTxt = document.getElementById('pdv-total-geral');
    const descontoTxt = document.getElementById('pdv-desconto');
    const linhaDesconto = document.getElementById('pdv-linha-desconto');
    const btnFinalizar = document.getElementById('btn-salvar-venda-banco');
    const hiddenInput = document.getElementById('carrinho_json_input');
    const selectCliente = document.getElementById('select-cliente');

    if (!corpo) return;
    corpo.innerHTML = "";
    let totalGeral = 0;

    carrinho.forEach((item, idx) => {
        const subtotal = item.preco * item.quantidade;
        totalGeral += subtotal;

        corpo.innerHTML += `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${item.nome}${item.tamanho ? ` (Tam: ${item.tamanho})` : ''}</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.quantidade}x</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">R$ ${subtotal.toFixed(2).replace('.', ',')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                    <button type="button" onclick="removerDoCarrinho(${idx})" style="color: #dc2626; background: none; border: none; cursor: pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    const clienteSelecionado = selectCliente ? selectCliente.options[selectCliente.selectedIndex] : null;
    const associado = clienteSelecionado && clienteSelecionado.getAttribute('data-associado') === 'true';
    const descontoPadrao = selectCliente ? parseFloat(selectCliente.getAttribute('data-desconto-associado') || '10') : 10;
    const descontoPercentual = associado ? descontoPadrao : 0;
    const descontoValor = totalGeral * (descontoPercentual / 100);
    const totalFinal = totalGeral - descontoValor;

    if (totalBrutoTxt) totalBrutoTxt.textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    if (descontoTxt) descontoTxt.textContent = `- R$ ${descontoValor.toFixed(2).replace('.', ',')}`;
    if (linhaDesconto) linhaDesconto.style.display = associado && totalGeral > 0 ? "flex" : "none";
    if (totalTxt) totalTxt.textContent = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
    if (hiddenInput) hiddenInput.value = JSON.stringify(carrinho);

    if (btnFinalizar) {
        btnFinalizar.disabled = carrinho.length === 0;
    }
}

// 4. Função global para deletar itens de dentro do carrinho
window.removerDoCarrinho = function (idx) {
    carrinho.splice(idx, 1);
    atualizarTabelaCarrinho();
};
