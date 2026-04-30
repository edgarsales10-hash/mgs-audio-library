# MGS Audio Library

Modulo privado para Foundry VTT que gera playlists no mundo a partir de uma biblioteca de audios hospedada fora do GitHub.

## Arquitetura recomendada

- GitHub hospeda o codigo do modulo, `module.json` e os artefatos de release.
- Cloudflare R2 hospeda os arquivos de audio.
- O Foundry baixa o modulo pela `Manifest URL`.
- As playlists ou catalogos do modulo apontam para URLs publicas do R2.

## Estrutura do repositorio

```text
module.json
README.md
scripts/
  generate-audio-index.ps1
data/
  audio-index.example.json
```

## Fluxo de publicacao

1. Crie um bucket no Cloudflare R2.
2. Publique os audios mantendo a hierarquia atual:

```text
MGS Audio/
  Ambience/
  Music/
  SFX/
```

3. Escolha um dominio publico para o bucket, por exemplo:

```text
https://audio.seudominio.com/MGS%20Audio/...
```

4. Execute o script `scripts/generate-audio-index.ps1` para gerar um catalogo JSON com URLs remotas usando a URL publica real do bucket.
5. Gere ou atualize as playlists no Foundry a partir desse catalogo.
6. Exporte a pasta `MGS Audio` para um compendio de `Playlist` desbloqueado com `Keep Folder Structure`.
7. Opcional: execute `scripts/package-module-pack.ps1` se quiser transformar esse compendio do mundo em um pack nativo do modulo.
8. Atualize o `module.json` com seu usuario do GitHub e a versao correta.
9. Execute `scripts/build-release.ps1` para gerar o `module.zip`.
10. Publique `module.json` e `module.zip` como assets de uma GitHub Release.
11. Compartilhe a URL:

```text
https://github.com/edgarsales10-hash/mgs-audio-library/releases/latest/download/module.json
```

## Como instalar no Foundry

1. Abra `Add-on Modules`.
2. Clique em `Install Module`.
3. Cole a `Manifest URL`.
4. Instale e ative o modulo no mundo desejado.
5. Entre no mundo como GM e aceite o prompt para gerar as playlists dentro da pasta `MGS Audio`.
6. Opcional: na aba de `Playlists`, clique com o botao direito na pasta `MGS Audio` e exporte para um compendio de `Playlist` com `Keep Folder Structure` ativado.

## Observacoes importantes

- Nao coloque os 25 GB de audio dentro do repositorio Git.
- Nao use Google Drive como origem primaria dos audios.
- Se quiser privacidade forte, use bucket com camada de acesso controlada no nivel do site ou do servidor. URLs publicas nao sao privacidade forte.
- Antes de redistribuir, confirme a licenca dos audios.

## Comandos uteis

Gerar o catalogo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-audio-index.ps1 `
  -SourceRoot "C:\Users\DS-4\AppData\Local\FoundryVTT\Data\MGS Audio" `
  -BaseUrl "https://SUA-URL-PUBLICA-REAL/MGS%20Audio"
```

Copiar o compendio exportado pelo Foundry para dentro do modulo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\package-module-pack.ps1 `
  -WorldPackPath "C:\Users\DS-4\AppData\Local\FoundryVTT\Data\worlds\SEU_MUNDO\packs\mgs-audio"
```

Gerar o zip da release:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-release.ps1
```

Exemplo de upload para R2 com AWS CLI:

```powershell
aws s3 sync "C:\Users\DS-4\AppData\Local\FoundryVTT\Data\MGS Audio" `
  "s3://SEU_BUCKET/MGS Audio" `
  --endpoint-url https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
```

## Proximo passo sugerido

Depois de subir os arquivos para o R2, podemos gerar:

- um `audio-index.json` completo
- playlists do Foundry por categoria
- um script para montar compendios a partir desse catalogo

## Comportamento atual do modulo

Esta versao do modulo:

- le o `data/audio-index.json`
- cria ou atualiza a arvore de playlists `MGS Audio` no mundo atual
- preserva a hierarquia de pastas original
- permite que voce exporte essa arvore para um compendio de `Playlist` pelo Foundry

## Observacao critica sobre os audios

Se os audios nao tocarem, quase sempre o problema e o `data/audio-index.json` ter sido gerado com uma URL placeholder como `audio.example.com`.

Antes de exportar o compendio final:

1. gere o `audio-index.json` com a URL publica real do bucket
2. regenere as playlists no Foundry
3. reexporte o compendio
4. recopie o pack para `packs/mgs-audio`
