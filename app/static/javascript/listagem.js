/* Componente reutilizável: busca, ordenação, paginação e estado vazio para tabelas. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-listagem]").forEach((tabela) => {
    const corpo = tabela.tBodies[0];
    if (!corpo) return;
    const linhas = Array.from(corpo.rows).filter(linha => !linha.querySelector("[colspan]"));
    const porPagina = Number(tabela.dataset.porPagina || 8);
    const busca = document.querySelector(tabela.dataset.busca || "");
    const ordem = document.querySelector(tabela.dataset.ordem || "");
    let pagina = 1;

    const controles = document.createElement("div");
    controles.className = "paginacao";
    tabela.closest(".tabela-container, .table-shell, .card-historico")?.append(controles);
    const normalizar = valor => (valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const renderizar = () => {
      const termo = normalizar(busca?.value);
      let visiveis = linhas.filter(linha => {
        if (!normalizar(linha.textContent).includes(termo)) return false;
        const categoria = document.getElementById("select-categoria");
        const baixo = document.getElementById("check-estoque-baixo");
        if (categoria?.value) {
          const nomeCategoria = normalizar(categoria.options[categoria.selectedIndex]?.textContent);
          if (normalizar(linha.cells[2]?.textContent) !== nomeCategoria) return false;
        }
        if (baixo && baixo.checked && Number(linha.cells[3]?.textContent.trim()) > 5) return false;
        const perfil = document.getElementById("selectPerfil");
        const ativos = document.getElementById("checkAtivos");
        if (perfil?.value && normalizar(linha.cells[2]?.textContent) !== normalizar(perfil.value)) return false;
        if (ativos?.checked && normalizar(linha.cells[3]?.textContent).includes("inativo")) return false;
        const somenteAssociados = document.querySelector('input[name="apenas_associados"]');
        if (somenteAssociados?.checked && !normalizar(linha.cells[3]?.textContent).includes("10%")) return false;
        return true;
      });
      const tipoOrdem = ordem?.value || "";
      if (tipoOrdem) visiveis.sort((a, b) => normalizar(a.cells[0]?.textContent).localeCompare(normalizar(b.cells[0]?.textContent)) * (tipoOrdem === "desc" ? -1 : 1));
      const totalPaginas = Math.max(1, Math.ceil(visiveis.length / porPagina));
      pagina = Math.min(pagina, totalPaginas);
      linhas.forEach(linha => { linha.hidden = true; });
      visiveis.slice((pagina - 1) * porPagina, pagina * porPagina).forEach(linha => { linha.hidden = false; });
      controles.innerHTML = `<span>${visiveis.length} registro(s)</span><div><button type="button" ${pagina === 1 ? "disabled" : ""} data-pagina="anterior">Anterior</button><span>Página ${pagina} de ${totalPaginas}</span><button type="button" ${pagina === totalPaginas ? "disabled" : ""} data-pagina="proxima">Próxima</button></div>`;
      controles.querySelectorAll("button").forEach(botao => botao.onclick = () => { pagina += botao.dataset.pagina === "anterior" ? -1 : 1; renderizar(); });
    };
    busca?.addEventListener("input", () => { pagina = 1; renderizar(); });
    ordem?.addEventListener("change", () => { pagina = 1; renderizar(); });
    ["select-categoria", "check-estoque-baixo", "selectPerfil", "checkAtivos"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", () => { pagina = 1; renderizar(); });
    });
    document.querySelector('input[name="apenas_associados"]')?.addEventListener("change", () => { pagina = 1; renderizar(); });
    renderizar();
  });

  document.querySelectorAll("form[data-confirm]").forEach(form => form.addEventListener("submit", event => {
    if (!confirm(form.dataset.confirm)) event.preventDefault();
  }));
});
