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
    const campoStatus = selectStatus ? selectStatus.closest("label") : null;
    const btnFechar = document.getElementById("btn-fechar-modal");
    const btnCancelar = document.getElementById("btn-cancelar");
    const btnDesativar = document.getElementById("btn-desativar-armario");
    const btnAtivar = document.getElementById("btn-ativar-armario");
    const btnSalvar = form ? form.querySelector('button[type="submit"]') : null;
    const modalConfirmacao = document.getElementById("modal-confirmacao");
    const formConfirmacao = document.getElementById("form-confirmacao");
    const btnFecharConfirmacao = document.getElementById("btn-fechar-confirmacao");
    const confirmacaoTitulo = document.getElementById("confirmacao-titulo");
    const confirmacaoTexto = document.getElementById("confirmacao-texto");
    const tabs = Array.from(document.querySelectorAll("[data-armarios-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-armarios-panel]"));
    const buscaReserva = document.getElementById("busca-reserva");
    const filtroSemestre = document.getElementById("filtro-semestre");

    function abrirAba(nome) {
        tabs.forEach(function (tab) { tab.classList.toggle("active", tab.dataset.armariosTab === nome); });
        panels.forEach(function (panel) { panel.hidden = panel.dataset.armariosPanel !== nome; });
    }

    function filtrarReservas() {
        const termo = (buscaReserva ? buscaReserva.value : "").toLocaleLowerCase("pt-BR");
        const semestre = filtroSemestre ? filtroSemestre.value : "";
        document.querySelectorAll("[data-reserva]").forEach(function (linha) {
            const aluno = (linha.dataset.aluno || "").toLocaleLowerCase("pt-BR");
            linha.hidden = !(aluno.includes(termo) && (!semestre || linha.dataset.semestre === semestre));
        });
    }

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

    function configurarArmarioDesativado(estaDesativado) {
        if (campoStatus) campoStatus.hidden = estaDesativado;
        if (campoUsuario) campoUsuario.hidden = estaDesativado;
        if (campoObservacao) campoObservacao.hidden = estaDesativado;
        if (btnDesativar) btnDesativar.hidden = estaDesativado;
        if (btnAtivar) btnAtivar.hidden = !estaDesativado;
        if (btnSalvar) btnSalvar.hidden = estaDesativado;
    }

    function abrirConfirmacao(url, titulo, texto) {
        if (!formConfirmacao || !modalConfirmacao) return;
        formConfirmacao.action = url;
        if (confirmacaoTitulo) confirmacaoTitulo.textContent = titulo;
        if (confirmacaoTexto) confirmacaoTexto.textContent = texto;
        modalConfirmacao.classList.add("open");
        modalConfirmacao.setAttribute("aria-hidden", "false");
    }

    function fecharConfirmacao() {
        if (!modalConfirmacao) return;
        modalConfirmacao.classList.remove("open");
        modalConfirmacao.setAttribute("aria-hidden", "true");
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
        if (selectStatus && status !== "desativado") selectStatus.value = status;
        if (selectUsuario) selectUsuario.value = associadoId;
        if (inputObservacoes) inputObservacoes.value = observacoes;

        configurarArmarioDesativado(status === "desativado");
        if (status !== "desativado") atualizarCamposModal();

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
    if (btnDesativar) btnDesativar.addEventListener("click", function () {
        const id = inputArmarioId ? inputArmarioId.value : "";
        abrirConfirmacao(`/armarios/${id}/desativar`, "Desativar armário?", "O armário ficará indisponível até ser ativado novamente.");
    });
    if (btnAtivar) btnAtivar.addEventListener("click", function () {
        const id = inputArmarioId ? inputArmarioId.value : "";
        abrirConfirmacao(`/armarios/${id}/ativar`, "Ativar armário?", "O armário voltará a ficar disponível para reserva.");
    });
    if (btnFecharConfirmacao) btnFecharConfirmacao.addEventListener("click", fecharConfirmacao);
    if (modalConfirmacao) {
        modalConfirmacao.addEventListener("click", function (event) {
            if (event.target === modalConfirmacao) fecharConfirmacao();
        });
    }
    if (modal) {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) fecharModal();
        });
    }

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () { abrirAba(tab.dataset.armariosTab); });
    });
    if (buscaReserva) buscaReserva.addEventListener("input", filtrarReservas);
    if (filtroSemestre) filtroSemestre.addEventListener("change", filtrarReservas);

    document.querySelectorAll("[data-confirm]").forEach(function (formulario) {
        formulario.addEventListener("submit", function (event) {
            if (!window.confirm(formulario.dataset.confirm)) event.preventDefault();
        });
    });
    document.querySelectorAll("[data-feedback-form]").forEach(function (formulario) {
        formulario.addEventListener("submit", function () {
            const botao = formulario.querySelector("button[type='submit']");
            if (botao) { botao.disabled = true; botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...'; }
        });
    });
});
