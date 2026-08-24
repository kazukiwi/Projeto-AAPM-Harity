document.addEventListener("DOMContentLoaded", () => {
    const marcarProcessando = (formulario) => {
        const botao = formulario.querySelector('button[type="submit"], input[type="submit"]');
        if (!botao || botao.disabled) return;

        botao.disabled = true;
        botao.classList.add("feedback-processando");
        botao.setAttribute("aria-busy", "true");
        if (botao.tagName === "INPUT") {
            botao.dataset.textoOriginal = botao.value;
            botao.value = "Processando...";
        } else {
            botao.dataset.conteudoOriginal = botao.innerHTML;
            botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Processando...';
        }
    };

    document.querySelectorAll("form").forEach((formulario) => {
        formulario.addEventListener("submit", (evento) => {
            window.setTimeout(() => {
                if (!evento.defaultPrevented) marcarProcessando(formulario);
            }, 0);
        });
    });

    const loginForm = document.querySelector('form[action="/auth/login"]');
    if (loginForm) {
        loginForm.addEventListener("submit", (evento) => {
            evento.preventDefault();
            const botao = loginForm.querySelector('button[type="submit"]');
            if (botao) botao.disabled = true;
            const modal = document.createElement("div");
            modal.className = "feedback-processando-modal";
            modal.innerHTML = '<div class="feedback-processando-card" role="status" aria-live="polite"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><h2>Processando acesso...</h2><p>Verificando seus dados de acesso.</p></div>';
            document.body.appendChild(modal);
            window.setTimeout(() => loginForm.submit(), 4000);
        });
    }

    const boasVindas = document.getElementById("feedback-bem-vindo");
    if (boasVindas) {
        boasVindas.classList.add("feedback-bem-vindo");
        document.body.style.overflow = "hidden";
        const fechar = () => {
            boasVindas.remove();
            document.body.style.overflow = "";
        };
        boasVindas.querySelector(".feedback-bem-vindo-fechar")?.addEventListener("click", fechar);
        boasVindas.addEventListener("click", (evento) => {
            if (evento.target === boasVindas) fechar();
        });
        document.addEventListener("keydown", function escape(evento) {
            if (evento.key !== "Escape") return;
            fechar();
            document.removeEventListener("keydown", escape);
        });
    }

    document.querySelectorAll(".alert-box, .aviso-sucesso").forEach((alerta) => {
        alerta.classList.add("feedback-alert");
        alerta.setAttribute("role", alerta.classList.contains("alert-error") ? "alert" : "status");

        if (!alerta.querySelector(".feedback-fechar")) {
            const fechar = document.createElement("button");
            fechar.type = "button";
            fechar.className = "feedback-fechar";
            fechar.setAttribute("aria-label", "Fechar mensagem");
            fechar.innerHTML = "&times;";
            fechar.addEventListener("click", () => dispensar(alerta));
            alerta.appendChild(fechar);
        }

        window.setTimeout(() => dispensar(alerta), 6000);
    });

    document.querySelectorAll("a.btn-sair").forEach((link) => {
        link.addEventListener("click", (evento) => {
            evento.preventDefault();
            abrirConfirmacaoSaida(link.href);
        });
    });

    function abrirConfirmacaoSaida(url) {
        const modal = document.createElement("div");
        modal.className = "feedback-modal";
        modal.innerHTML = `
            <div class="feedback-modal-card" role="dialog" aria-modal="true" aria-labelledby="feedback-sair-titulo">
                <div class="feedback-modal-icone"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i></div>
                <h2 id="feedback-sair-titulo">Sair da conta?</h2>
                <p>Você precisará entrar novamente para acessar o sistema.</p>
                <div class="feedback-modal-acoes">
                    <button type="button" class="feedback-modal-cancelar">Cancelar</button>
                    <a href="${url}" class="feedback-modal-confirmar">Sair da conta</a>
                </div>
            </div>`;
        document.body.appendChild(modal);
        const cancelar = modal.querySelector(".feedback-modal-cancelar");
        const fechar = () => modal.remove();
        cancelar.focus();
        cancelar.addEventListener("click", fechar);
        modal.addEventListener("click", (evento) => {
            if (evento.target === modal) fechar();
        });
        document.addEventListener("keydown", function escape(evento) {
            if (evento.key !== "Escape") return;
            fechar();
            document.removeEventListener("keydown", escape);
        });
    }

    function dispensar(alerta) {
        if (!alerta.isConnected || alerta.classList.contains("feedback-saindo")) return;
        alerta.classList.add("feedback-saindo");
        window.setTimeout(() => alerta.remove(), 350);
    }
});