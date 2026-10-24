/* =========================================================
   ESPAÇO MAUÁ — script.js
   Sem dependências. Comentado por bloco.
   ========================================================= */
(function () {
  "use strict";

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Placeholder exibido no lightbox enquanto estamos em modo-demo.
     SVG embutido em data URI (não requer arquivo). */
  const PLACEHOLDER_LIGHTBOX =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">' +
        '<rect width="800" height="600" fill="#FAF3EC"/>' +
        '<rect x="24" y="24" width="752" height="552" rx="16" fill="none" stroke="#D4B89E" stroke-width="4" stroke-dasharray="16 12"/>' +
        '<g fill="#8B6F4E" font-family="system-ui,-apple-system,sans-serif" text-anchor="middle">' +
          '<text x="400" y="290" font-size="34" font-weight="700">Adicionar foto aqui</text>' +
          '<text x="400" y="335" font-size="20">A foto real será inserida nesta área</text>' +
        '</g>' +
      '</svg>'
    );

  /* ---------- 1. MENU MOBILE ---------- */
  const botaoMenu = document.querySelector(".menu-toggle");
  const menu      = document.getElementById("menu-principal");

  function fecharMenu() {
    if (!menu || !botaoMenu) return;
    botaoMenu.setAttribute("aria-expanded", "false");
    botaoMenu.setAttribute("aria-label", "Abrir menu");
    menu.classList.remove("is-open");
  }

  if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", function () {
      const aberto = botaoMenu.getAttribute("aria-expanded") === "true";
      botaoMenu.setAttribute("aria-expanded", String(!aberto));
      botaoMenu.setAttribute("aria-label", aberto ? "Abrir menu" : "Fechar menu");
      menu.classList.toggle("is-open", !aberto);
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", fecharMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        fecharMenu();
        botaoMenu.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) fecharMenu();
    });
  }

  /* ---------- 2. HEADER COM SOMBRA AO ROLAR ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const atualizarHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    atualizarHeader();
    window.addEventListener("scroll", atualizarHeader, { passive: true });
  }

  /* ---------- 3. REVELAR AO ROLAR ---------- */
  const alvos = document.querySelectorAll(".reveal");

  document.querySelectorAll(".eventos-grid > *, .passos-lista > *, .insta-grid > *, .destaques-lista > *")
    .forEach(function (el) { el.classList.add("stagger-item"); });

  if (reduzirMovimento || !("IntersectionObserver" in window)) {
    alvos.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    const observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("is-visible");
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    alvos.forEach(function (el) { observador.observe(el); });
  }

  /* ---------- 4. NAV ATIVA ---------- */
  const secoes = document.querySelectorAll("main section[id]");
  const linksNav = document.querySelectorAll(".main-nav a[href^='#']");

  if ("IntersectionObserver" in window && secoes.length && linksNav.length) {
    const mapaSecao = {};
    linksNav.forEach(function (a) {
      const id = a.getAttribute("href").slice(1);
      if (id) mapaSecao[id] = a;
    });

    const observadorNav = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          const link = mapaSecao[entrada.target.id];
          if (!link) return;
          linksNav.forEach(function (a) { a.classList.remove("ativo"); });
          link.classList.add("ativo");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    secoes.forEach(function (s) { observadorNav.observe(s); });
  }

  /* ---------- 5. GALERIA — FILTRO ---------- */
  const filtros = document.querySelectorAll(".filtro");
  const itens   = Array.from(document.querySelectorAll(".galeria-item"));
  const status  = document.getElementById("galeria-status");

  function aplicarFiltro(categoria) {
    let visiveis = 0;
    itens.forEach(function (item) {
      const mostrar = categoria === "todos" || item.dataset.categoria === categoria;
      item.hidden = !mostrar;
      if (mostrar) visiveis++;
    });
    if (status) {
      status.textContent = visiveis + (visiveis === 1 ? " imagem exibida." : " imagens exibidas.");
    }
  }

  filtros.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filtros.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      aplicarFiltro(btn.dataset.filtro);
    });
  });

  /* ---------- 6. LIGHTBOX ---------- */
  const dialog    = document.getElementById("lightbox");
  const imgLight  = document.getElementById("lightbox-img");
  const legenda   = document.getElementById("lightbox-legenda");
  const btnPrev   = document.getElementById("lightbox-prev");
  const btnNext   = document.getElementById("lightbox-next");
  const btnFechar = document.getElementById("lightbox-fechar");

  let visiveisLight = [];
  let indiceAtual = 0;

  function atualizarLightbox() {
    const item = visiveisLight[indiceAtual];
    if (!item) return;

    const emDemo = document.body.classList.contains("modo-demo");
    legenda.textContent = item.dataset.legenda || "";

    if (emDemo) {
      // Em modo-demo: sempre exibe o placeholder do lightbox
      imgLight.onerror = null;
      imgLight.src = PLACEHOLDER_LIGHTBOX;
      imgLight.alt = "Espaço reservado para foto: " + (item.dataset.legenda || "");
    } else {
      // Em produção: tenta carregar a foto real; fallback para placeholder se faltar
      imgLight.onerror = function () {
        this.onerror = null;
        this.src = PLACEHOLDER_LIGHTBOX;
        this.alt = "Imagem será adicionada em breve";
      };
      imgLight.src = item.dataset.full;
      imgLight.alt = item.dataset.legenda || "";
    }
  }

  function abrirLightbox(item) {
    visiveisLight = itens.filter(function (i) { return !i.hidden; });
    indiceAtual = visiveisLight.indexOf(item);
    atualizarLightbox();
    document.documentElement.classList.add("sem-rolagem");
    dialog.showModal();
  }

  function navegar(passo) {
    if (!visiveisLight.length) return;
    indiceAtual = (indiceAtual + passo + visiveisLight.length) % visiveisLight.length;
    atualizarLightbox();
  }

  if (dialog && imgLight) {
    itens.forEach(function (item) {
      item.addEventListener("click", function () { abrirLightbox(item); });
    });

    btnPrev.addEventListener("click", function () { navegar(-1); });
    btnNext.addEventListener("click", function () { navegar(1); });
    btnFechar.addEventListener("click", function () { dialog.close(); });

    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); navegar(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); navegar(1); }
    });

    dialog.addEventListener("close", function () {
      document.documentElement.classList.remove("sem-rolagem");
    });

    // Swipe horizontal no celular
    let toqueInicialX = 0;
    let toqueInicialY = 0;
    const limiar = 50;

    dialog.addEventListener("touchstart", function (e) {
      if (!e.touches.length) return;
      toqueInicialX = e.touches[0].clientX;
      toqueInicialY = e.touches[0].clientY;
    }, { passive: true });

    dialog.addEventListener("touchend", function (e) {
      if (!e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - toqueInicialX;
      const dy = e.changedTouches[0].clientY - toqueInicialY;
      if (Math.abs(dx) > limiar && Math.abs(dx) > Math.abs(dy)) {
        navegar(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  /* ---------- 7. VOLTAR AO TOPO ---------- */
  const voltarTopo = document.getElementById("voltar-topo");
  if (voltarTopo) {
    const atualizarBotao = function () {
      const deveMostrar = window.scrollY > 600;
      voltarTopo.hidden = !deveMostrar;
    };
    atualizarBotao();
    window.addEventListener("scroll", atualizarBotao, { passive: true });
    voltarTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduzirMovimento ? "auto" : "smooth" });
    });
  }

  /* ---------- 8. ANO ATUAL NO RODAPÉ ---------- */
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

})();