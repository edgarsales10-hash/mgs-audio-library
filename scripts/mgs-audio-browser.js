const MODULE_ID = "mgs-audio-library";
const MODULE_TITLE = "MGS Audio";
const INDEX_PATH = `modules/${MODULE_ID}/data/audio-index.json`;

class MGSAudioBrowser extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "mgs-audio-browser",
      title: MODULE_TITLE,
      template: `modules/${MODULE_ID}/templates/audio-browser.hbs`,
      width: 960,
      height: 720,
      resizable: true,
      classes: ["mgs-audio-browser"]
    });
  }

  constructor(options = {}) {
    super(options);
    this.index = null;
    this.filter = "";
  }

  async loadIndex() {
    if (this.index) return this.index;

    const response = await fetch(INDEX_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Nao foi possivel carregar ${INDEX_PATH}`);
    }

    this.index = await response.json();
    return this.index;
  }

  async getData() {
    const index = await this.loadIndex();
    const search = this.filter.trim().toLowerCase();
    const categories = (index.categories ?? [])
      .map((category) => {
        const tracks = (category.tracks ?? []).filter((track) => {
          if (!search) return true;
          const haystack = `${track.name} ${track.relativePath}`.toLowerCase();
          return haystack.includes(search);
        });

        return {
          name: category.name,
          total: tracks.length,
          tracks
        };
      })
      .filter((category) => category.tracks.length > 0);

    return {
      baseUrl: index.baseUrl,
      generatedAt: index.generatedAt,
      total: categories.reduce((sum, category) => sum + category.total, 0),
      hasTracks: categories.length > 0,
      search: this.filter,
      categories
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='search']").on("input", (event) => {
      this.filter = event.currentTarget.value ?? "";
      this.render(false);
    });

    html.find("[data-action='copy']").on("click", async (event) => {
      const url = event.currentTarget.dataset.url;
      if (!url) return;

      try {
        await navigator.clipboard.writeText(url);
        ui.notifications.info("URL do audio copiada.");
      } catch (error) {
        console.error(error);
        ui.notifications.error("Nao foi possivel copiar a URL.");
      }
    });
  }
}

function openBrowser() {
  new MGSAudioBrowser().render(true);
}

function buildLauncherButton() {
  return $(`
    <button type="button" class="mgs-audio-launcher">
      <i class="fas fa-music"></i> ${MODULE_TITLE}
    </button>
  `).on("click", openBrowser);
}

Hooks.once("ready", () => {
  game.modules.get(MODULE_ID)?.api = { openBrowser };
});

Hooks.on("renderPlaylistDirectory", (_app, html) => {
  if (html.find(".mgs-audio-launcher").length) return;

  const headerActions = html.find(".directory-header .header-actions");
  if (headerActions.length) {
    headerActions.first().append(buildLauncherButton());
    return;
  }

  const directoryHeader = html.find(".directory-header");
  if (directoryHeader.length) {
    directoryHeader.first().append(buildLauncherButton());
  }
});

Hooks.on("renderSettings", (_app, html) => {
  if (html.find(".mgs-audio-settings-launch").length) return;

  const button = $(`
    <button type="button" class="mgs-audio-settings-launch">
      <i class="fas fa-music"></i> Abrir ${MODULE_TITLE}
    </button>
  `).on("click", openBrowser);

  const moduleHeader = html.find("#settings-documentation, .settings-sidebar, #settings-game").first();
  if (moduleHeader.length) {
    moduleHeader.prepend(button);
  }
});
