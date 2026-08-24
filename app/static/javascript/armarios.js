document.addEventListener("DOMContentLoaded", function () {
    const cards = Array.from(document.querySelectorAll("[data-armario-card]"));
    const botoesFiltro = Array.from(document.querySelectorAll("[data-filtro]"));
    const modal = document.getElementById("modal-armario");
    const form = document.getElementById("form-armario");
    const modalTitulo = document.getElementById("modal-titulo");
    const modalSubtitulo = document.getElementById("modal-subtitulo");
    const modalInfo = document.getElementById("modal-info");
    const inputArmarioId = document.getElementById("modal-armario-id");
    const selectStatus = document.getElementById("modal-status");
    const selectUsuario = document.getElementById("modal-usuario");
    const inputObservacoes = document.getElementById("modal-observacoes");
    const campoUsuario = document.querySelector(".campo-usuario");
    const campoObservacao = document.querySelector(".campo-observacao");
    const btnFechar = document.getElementById("btn-fechar-modal");
    const btnCancelar = document.getElementById("btn-cancelar");

    function aplicarFiltro(status) {
        cards.forEach(function (card) {
            const statusCard = card.getAttribute("data-status");
            card.style.display = !status || statusCard === status ? "" : "none";
        });
    }

    function atualizarCamposModal() {
        const status = selectStatus ? selectStatus.value : "";

        if (campoUsuario) {
            campoUsuario.style.display = status === "ocupado" ? "" : "none";
        }

        if (selectUsuario) {
            selectUsuario.required = status === "ocupado";
        }

        if (campoObservacao) {
            campoObservacao.style.display = status === "manutencao" ? "" : "none";
        }

        if (inputObservacoes) {
            inputObservacoes.required = status === "manutencao";
        }
    }

    function abrirModal(card) {
        const numero = card.getAttribute("data-numero") || "";
        const status = card.getAttribute("data-status") || "disponivel";
        const associadoId = card.getAttribute("data-associado-id") || "0";
        const observacoes = card.getAttribute("data-observacoes") || "";
        const nome = card.getAttribute("data-nome") || "";
        const matricula = card.getAttribute("data-matricula") || "";

        if (modalTitulo) modalTitulo.textContent = "Armario #" + numero;
        if (modalSubtitulo) modalSubtitulo.textContent = "Status atual: " + status;
        if (modalInfo) {
            modalInfo.textContent = nome ? (nome + (matricula ? " - " + matricula : "")) : "Sem associado vinculado.";
        }
        if (inputArmarioId) inputArmarioId.value = card.getAttribute("data-id") || "";
        if (selectStatus) selectStatus.value = status;
        if (selectUsuario) selectUsuario.value = associadoId;
        if (inputObservacoes) inputObservacoes.value = observacoes;

        atualizarCamposModal();

        if (modal) {
            modal.classList.add("open");
            modal.setAttribute("aria-hidden", "false");
        }
    }

    function fecharModal() {
        if (modal) {
            modal.classList.remove("open");
            modal.setAttribute("aria-hidden", "true");
        }
    }

    botoesFiltro.forEach(function (botao) {
        botao.addEventListener("click", function () {
            botoesFiltro.forEach(function (item) {
                item.classList.remove("active");
            });
            botao.classList.add("active");
            aplicarFiltro(botao.getAttribute("data-filtro") || "");
        });
    });

    cards.forEach(function (card) {
        card.addEventListener("click", function () {
            abrirModal(card);
        });
    });

    if (selectStatus) {
        selectStatus.addEventListener("change", atualizarCamposModal);
    }

    if (form) {
        form.addEventListener("submit", function (event) {
            if (selectStatus && selectStatus.value === "ocupado" && selectUsuario && selectUsuario.value === "0") {
                event.preventDefault();
                alert("Selecione um associado cadastrado para ocupar o armario.");
            }
        });
    }

    if (btnFechar) btnFechar.addEventListener("click", fecharModal);
    if (btnCancelar) btnCancelar.addEventListener("click", fecharModal);
    if (modal) {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) fecharModal();
        });
    }
});
