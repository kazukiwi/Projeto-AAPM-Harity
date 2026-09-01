document.addEventListener("DOMContentLoaded", () => {
    const mostrarProcessamento = (formulario) => {
        if (document.querySelector(".feedback-processando-modal")) return;
        const botao = formulario.querySelector('button[type="submit"], input[type="submit"]');
        if (botao) {
            botao.disabled = true;
            botao.classList.add("feedback-processando");
            botao.setAttribute("aria-busy", "true");
        }
        const modal = document.createElement("div");
        modal.className = "feedback-processando-modal";
        modal.innerHTML = '<div class="feedback-processando-card" role="status" aria-live="polite"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><h2>Processando...</h2><p>Aguarde um momento enquanto concluímos sua solicitação.</p></div>';
        document.body.appendChild(modal);
    };

    document.querySelectorAll('form[method="post"], form[method="POST"]').forEach((formulario) => {
        if (formulario.matches("[data-confirmacao], #form-finalizar-dia")) return;
        formulario.addEventListener("submit", () => mostrarProcessamento(formulario));
    });

    const loginForm = document.querySelector('form[action="/auth/login"]');
    if (loginForm) loginForm.addEventListener("submit", () => mostrarProcessamento(loginForm));

    document.querySelectorAll(".alert-box, .aviso-sucesso").forEach((alerta) => {
        alerta.classList.add("feedback-alert");
        alerta.setAttribute("role", alerta.classList.contains("alert-error") ? "alert" : "status");
        const fechar = document.createElement("button");
        fechar.type = "button";
        fechar.className = "feedback-fechar";
        fechar.setAttribute("aria-label", "Fechar mensagem");
        fechar.innerHTML = "&times;";
        fechar.addEventListener("click", () => dispensar(alerta));
        alerta.appendChild(fechar);
        window.setTimeout(() => dispensar(alerta), 6000);
    });

    document.querySelectorAll("a.btn-sair").forEach((link) => {
        link.addEventListener("click", (evento) => {
            evento.preventDefault();
            const modal = document.createElement("div");
            modal.className = "feedback-modal";
            modal.innerHTML = '<div class="feedback-modal-card" role="dialog" aria-modal="true" aria-labelledby="feedback-sair-titulo"><div class="feedback-modal-icone"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i></div><h2 id="feedback-sair-titulo">Sair da conta?</h2><p>Você precisará entrar novamente para acessar o sistema.</p><div class="feedback-modal-acoes"><button type="button" class="feedback-modal-cancelar">Cancelar</button><a href="' + link.href + '" class="feedback-modal-confirmar">Sair da conta</a></div></div>';
            document.body.appendChild(modal);
            const fechar = () => modal.remove();
            modal.querySelector(".feedback-modal-cancelar").focus();
            modal.querySelector(".feedback-modal-cancelar").addEventListener("click", fechar);
            modal.addEventListener("click", (eventoModal) => { if (eventoModal.target === modal) fechar(); });
            const escape = (eventoEscape) => { if (eventoEscape.key === "Escape") { fechar(); document.removeEventListener("keydown", escape); } };
            document.addEventListener("keydown", escape);
        });
    });

    const boasVindas = document.getElementById("feedback-bem-vindo");
    if (boasVindas) window.setTimeout(() => boasVindas.remove(), 2000);

    function dispensar(alerta) {
        if (!alerta.isConnected || alerta.classList.contains("feedback-saindo")) return;
        alerta.classList.add("feedback-saindo");
        window.setTimeout(() => alerta.remove(), 350);
    }
});
