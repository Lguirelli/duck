async function includeSections() {
  const targets = document.querySelectorAll("[data-section]");
  const root = document.body?.dataset.root || "";

  await Promise.all([...targets].map(async (target) => {
    const path = target.getAttribute("data-section");

    try {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Erro ao carregar ${path}`);
      }

      const html = await response.text();
      target.innerHTML = html.replaceAll("{{root}}", root);
    } catch (error) {
      target.innerHTML = `
        <section class="section">
          <div class="container">
            <div class="card">
              <strong>Seção não carregada:</strong> ${path}
            </div>
          </div>
        </section>
      `;

      console.error(error);
    }
  }));

  document.dispatchEvent(new Event("sectionsLoaded"));
}

includeSections();
