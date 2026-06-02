let carrinho = [];
let produtosDoBanco = [];

// Carrega os produtos da API e preenche o select do modal
async function carregarProdutosDoBackend() {
    try {
        const res = await fetch("/produtos");
        if (res.ok) {
            produtosDoBanco = await res.json();
            const select = document.getElementById("select-prod");
            if (select) {
                select.innerHTML = '<option value="" disabled selected>Escolha um produto...</option>';
                
                produtosDoBanco.filter(p => p.ativo && (p.estoque_atual > 0 || p.estoque_actual > 0)).forEach(prod => {
                    const opt = document.createElement("option");
                    opt.value = prod.id;
                    opt.textContent = prod.nome;
                    select.appendChild(opt);
                });
            }
        }
    } catch (err) { 
        console.error("Erro ao carregar produtos:", err); 
    }
}

// Executa quando o usuário escolhe um produto no Select do Modal
const selectProd = document.getElementById("select-prod");
if (selectProd) {
    selectProd.addEventListener("change", (e) => {
        const pId = parseInt(e.target.value);
        const prod = produtosDoBanco.find(p => p.id === pId);
        if (prod) {
            const estoqueVal = prod.estoque_atual !== undefined ? prod.estoque_atual : prod.estoque_actual;
            document.getElementById("pdv-estoque").value = `${estoqueVal} un`;
            document.getElementById("pdv-preco").value = `R$ ${parseFloat(prod.preco).toFixed(2)}`;
            document.getElementById("pdv-qtd").max = estoqueVal;
            document.getElementById("pdv-qtd").value = 1;
        }
    });
}

// Executa quando o operador clica em "Adicionar Item"
const formAddItem = document.getElementById("form-add-item-pdv");
if (formAddItem) {
    formAddItem.addEventListener("submit", (e) => {
        e.preventDefault();
        const pId = parseInt(document.getElementById("select-prod").value);
        const qtd = parseInt(document.getElementById("pdv-qtd").value);
        const prod = produtosDoBanco.find(p => p.id === pId);

        if (!prod) return;

        const estoqueVal = prod.estoque_atual !== undefined ? prod.estoque_atual : prod.estoque_actual;
        const noCarrinho = carrinho.find(i => i.produto_id === pId);
        
        if (noCarrinho) {
            if (noCarrinho.quantidade + qtd > estoqueVal) {
                return alert("Sem estoque suficiente para este produto!");
            }
            noCarrinho.quantidade += qtd;
        } else {
            carrinho.push({ 
                produto_id: prod.id, 
                nome: prod.nome, 
                preco: parseFloat(prod.preco), 
                quantidade: qtd 
            });
        }

        atualizarCarrinhoPDV();
        document.getElementById("form-add-item-pdv").reset();
        document.getElementById("pdv-estoque").value = "--";
        document.getElementById("pdv-preco").value = "R$ 0,00";
    });
}

// Atualiza a mini-tabela de itens dentro do modal e calcula o somatório
function atualizarCarrinhoPDV() {
    const corpo = document.getElementById("corpo-carrinho-pdv");
    const totalTxt = document.getElementById("pdv-total-geral");
    const btnFinalizar = document.getElementById("btn-salvar-venda-banco");
    const hiddenInput = document.getElementById("carrinho_json_input");

    if (!corpo) return;

    corpo.innerHTML = "";
    let total = 0;

    carrinho.forEach((item, idx) => {
        const sub = item.preco * item.quantidade;
        total += sub;
        corpo.innerHTML += `
            <tr>
                <td><strong>${item.nome}</strong></td>
                <td>${item.quantidade}x</td>
                <td>R$ ${sub.toFixed(2)}</td>
                <td style="text-align:center;">
                    <button type="button" onclick="removerItemDoCarrinho(${idx})" style="color:#dc2626; background:none; border:none; cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    if (totalTxt) totalTxt.textContent = `R$ ${total.toFixed(2)}`;
    if (hiddenInput) hiddenInput.value = JSON.stringify(carrinho);
    if (btnFinalizar) btnFinalizar.disabled = carrinho.length === 0;
}

// Função global para remover item do carrinho
window.removerItemDoCarrinho = function(idx) {
    carrinho.splice(idx, 1);
    atualizarCarrinhoPDV();
}

// 🟢 Função global que faz o botão 'X' fechar o modal com segurança total
window.fecharModalPDV = function() {
    const modal = document.getElementById('modal-pdv');
    if (modal) {
        modal.style.display = 'none';
    }
    carrinho = [];
    atualizarCarrinhoPDV();
}

// 🛡️ Filtro de busca protegido (Só roda se o input existir na tela)
const inputBusca = document.getElementById("input-busca-venda");
if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
        const txt = e.target.value.toLowerCase();
        const linhas = document.querySelectorAll(".linha-venda-tabela");
        let visiveis = 0;

        linhas.forEach(l => {
            const id = l.getAttribute("data-id").toLowerCase();
            if (id.includes(txt)) {
                l.style.display = "";
                visiveis++;
            } else {
                l.style.display = "none";
            }
        });

        const tabelaContainer = document.querySelector(".tabela-container");
        const estadoVazio = document.getElementById("estado-vazio");

        if (visiveis === 0) {
            if (tabelaContainer) tabelaContainer.style.display = "none";
            if (estadoVazio) estadoVazio.style.display = "flex";
        } else {
            if (tabelaContainer) tabelaContainer.style.display = "block";
            if (estadoVazio) estadoVazio.style.display = "none";
        }
    });
}

// Inicializa os produtos assim que o DOM estiver pronto
document.addEventListener("DOMContentLoaded", carregarProdutosDoBackend);