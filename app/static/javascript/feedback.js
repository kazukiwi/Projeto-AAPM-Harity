document.addEventListener('DOMContentLoaded', () => {
    const boasVindas = document.getElementById('feedback-bem-vindo');

    if (!boasVindas) return;

    boasVindas.classList.add('feedback-bem-vindo');

    window.setTimeout(() => {
        boasVindas.classList.add('feedback-bem-vindo-saindo');
        window.setTimeout(() => boasVindas.remove(), 350);
    }, 2200);
});
