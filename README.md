# Obtero

Obtero is an Obsidian plugin for managing academic papers, tracking reading status, searching paper sources, and visualizing paper relationships with Excalidraw.

## Installation With BRAT

1. Install and enable the BRAT plugin in Obsidian.
2. Open BRAT settings.
3. Choose `Add Beta plugin`.
4. Enter `DaveBraid/obtero`.
5. Select the latest release and enable the plugin.

BRAT installs the plugin from GitHub release assets. Each release should include:

- `manifest.json`
- `main.js`
- `styles.css`

## Configuration Migration

The plugin id is `obtero`. If you previously used the plugin as `obsidian-mypaper-plugin`, Obsidian will treat Obtero as a new plugin and store its settings in:

```text
.obsidian/plugins/obtero/data.json
```

Your old settings are not deleted automatically. To migrate existing settings, copy:

```text
.obsidian/plugins/obsidian-mypaper-plugin/data.json
```

to:

```text
.obsidian/plugins/obtero/data.json
```

## Development

```bash
npm install
npm run build
```

## Release

1. Update `manifest.json`, `package.json`, and `versions.json` when changing versions.
2. Run `npm run build`.
3. Create a GitHub release whose tag matches the plugin version, for example `1.0.0`.
4. Upload `manifest.json`, `main.js`, and `styles.css` as release assets.
