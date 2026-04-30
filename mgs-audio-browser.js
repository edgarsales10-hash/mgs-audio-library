const MODULE_ID = "mgs-audio-library";
const MODULE_TITLE = "MGS Audio Library";
const INDEX_PATH = `modules/${MODULE_ID}/data/audio-index.json`;
const ROOT_FOLDER_NAME = "MGS Audio";

async function loadIndex() {
  const response = await fetch(INDEX_PATH, { cache: "no-store" });
  if (!response.ok) throw new Error(`Nao foi possivel carregar ${INDEX_PATH}`);
  return response.json();
}

function getPlaylistSegments(track) {
  const parts = String(track.relativePath ?? "")
    .split("/")
    .filter(Boolean);

  if (parts.length < 2) {
    return {
      folders: [],
      playlistName: track.category || "Outros"
    };
  }

  const folders = parts.slice(0, -2);
  const playlistName = parts.at(-2);
  return { folders, playlistName };
}

async function ensureFolder(name, parentFolder) {
  const existing = game.folders.find((folder) => {
    return folder.type === "Playlist" &&
      folder.name === name &&
      (folder.folder?._id ?? folder.folder) === (parentFolder?._id ?? parentFolder ?? null);
  });

  if (existing) return existing;

  return Folder.create({
    name,
    type: "Playlist",
    folder: parentFolder?._id ?? parentFolder ?? null,
    color: "#5f7392"
  });
}

function buildPlaylistMap(index) {
  const buckets = new Map();

  for (const category of index.categories ?? []) {
    for (const track of category.tracks ?? []) {
      const { folders, playlistName } = getPlaylistSegments(track);
      const key = `${folders.join("/") }::${playlistName}`;

      if (!buckets.has(key)) {
        buckets.set(key, {
          folders,
          playlistName,
          tracks: []
        });
      }

      buckets.get(key).tracks.push(track);
    }
  }

  return [...buckets.values()].sort((a, b) => {
    const pathA = `${a.folders.join("/")}/${a.playlistName}`;
    const pathB = `${b.folders.join("/")}/${b.playlistName}`;
    return pathA.localeCompare(pathB);
  });
}

async function createPlaylistTree() {
  const index = await loadIndex();
  const buckets = buildPlaylistMap(index);

  let createdFolders = 0;
  let createdPlaylists = 0;
  let updatedPlaylists = 0;

  const rootFolder = await ensureFolder(ROOT_FOLDER_NAME, null);
  const folderCache = new Map([[`root`, rootFolder]]);

  for (const bucket of buckets) {
    let parent = rootFolder;
    let folderKey = "root";

    for (const folderName of bucket.folders) {
      folderKey = `${folderKey}/${folderName}`;
      if (!folderCache.has(folderKey)) {
        const created = await ensureFolder(folderName, parent);
        folderCache.set(folderKey, created);
        createdFolders += 1;
      }
      parent = folderCache.get(folderKey);
    }

    const existing = game.playlists.find((playlist) => {
      return playlist.name === bucket.playlistName &&
        (playlist.folder?._id ?? playlist.folder) === parent.id;
    });

    const sounds = bucket.tracks.map((track, index) => ({
      name: track.name,
      path: track.url,
      volume: 0.5,
      repeat: false,
      sort: index
    }));

    if (existing) {
      await existing.update({
        folder: parent.id,
        sounds
      });
      updatedPlaylists += 1;
      continue;
    }

    await Playlist.create({
      name: bucket.playlistName,
      folder: parent.id,
      mode: CONST.PLAYLIST_MODES?.DISABLED ?? 0,
      sorting: "m",
      sounds
    });
    createdPlaylists += 1;
  }

  await game.settings.set(MODULE_ID, "importedVersion", game.modules.get(MODULE_ID)?.version ?? "unknown");

  ui.notifications.info(`MGS Audio: ${createdPlaylists} playlists criadas, ${updatedPlaylists} atualizadas.`);

  return { createdFolders, createdPlaylists, updatedPlaylists };
}

async function maybePromptImport() {
  if (!game.user?.isGM) return;

  const moduleVersion = game.modules.get(MODULE_ID)?.version ?? "unknown";
  const importedVersion = game.settings.get(MODULE_ID, "importedVersion");
  if (importedVersion === moduleVersion) return;

  new Dialog({
    title: MODULE_TITLE,
    content: `
      <p>Este modulo pode gerar as playlists da biblioteca de audio dentro do mundo atual.</p>
      <p>As playlists serao criadas sob a pasta <strong>${ROOT_FOLDER_NAME}</strong>, preservando a organizacao original.</p>
      <p>Depois disso, voce podera exportar a pasta para um compendio de Playlist pelo proprio Foundry.</p>
    `,
    buttons: {
      import: {
        label: "Gerar Playlists",
        callback: async () => {
          try {
            await createPlaylistTree();
          } catch (error) {
            console.error(error);
            ui.notifications.error("MGS Audio: erro ao gerar playlists. Veja o console.");
          }
        }
      },
      later: {
        label: "Depois"
      }
    },
    default: "import"
  }).render(true);
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "importedVersion", {
    name: "Imported Version",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
});

Hooks.once("ready", () => {
  game.modules.get(MODULE_ID).api = {
    createPlaylistTree
  };

  maybePromptImport().catch((error) => {
    console.error(error);
    ui.notifications.error("MGS Audio: erro ao inicializar importador.");
  });
});
