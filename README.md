# Obtero

Obtero 是一个 Obsidian 插件，用于管理学术论文、追踪阅读状态、搜索论文来源，并通过 Excalidraw 可视化论文关系。

- 仓库：`DaveBraid/obtero`
- 插件名：`Obtero`
- 插件 ID：`obtero`
- 发布方式：GitHub Release + BRAT

## QuickStart：用 BRAT 部署

这是普通用户和主力 vault 推荐使用的安装方式。

1. 在 Obsidian 中安装并启用 BRAT。
2. 打开 BRAT 设置。
3. 选择 `Add Beta plugin`。
4. 输入仓库：`DaveBraid/obtero`。
5. 选择最新 release，安装并启用 `Obtero`。

BRAT 会从 GitHub Release 下载插件资产。每个 release 必须包含：

- `manifest.json`
- `main.js`
- `styles.css`

首次安装时，Obtero 会使用插件自己的默认配置。用户本地配置保存在：

```text
.obsidian/plugins/obtero/data.json
```

`data.json` 是本地配置文件，不应提交到仓库，也不应上传到 release。

## 从旧插件迁移到 Obtero

如果你以前使用过旧插件 `obsidian-mypaper-plugin`，迁移时按下面步骤操作。

1. 备份旧配置：

   ```text
   .obsidian/plugins/obsidian-mypaper-plugin/data.json
   ```

2. 用 BRAT 安装新插件：

   ```text
   DaveBraid/obtero
   ```

3. 确认只启用新插件 `obtero`，不要同时启用旧插件 `obsidian-mypaper-plugin`。

4. 把旧配置复制到新插件目录：

   ```text
   .obsidian/plugins/obtero/data.json
   ```

5. 完全重启 Obsidian。

重点：旧插件和 Obtero 不要同时启用，因为内部 view type 仍然是 `paper-plugin-view`，同时启用容易冲突。

## 开发部署

不要在正式 Obsidian vault 的 `.obsidian/plugins/obtero` 目录下开发和编译。该目录应交给 BRAT 管理，避免影响 Obsidian 配置同步、插件版本管理和主力 vault 稳定性。

推荐使用独立开发目录和测试 vault：

```bash
git clone git@github.com:DaveBraid/obtero.git ~/Developer/obtero
cd ~/Developer/obtero
npm install
npm run dev
```

测试 vault 中可以使用 symlink 指向开发目录：

```bash
mkdir -p "<TestVault>/.obsidian/plugins"
ln -s ~/Developer/obtero "<TestVault>/.obsidian/plugins/obtero"
```

然后在测试 vault 中启用 `Obtero`。开发时保持 `npm run dev` 运行，修改后在测试 vault 中重载插件即可。主力 vault 继续使用 BRAT 安装的稳定 release。

生产构建：

```bash
npm run build
```

## 发布流程

发布用于 BRAT 安装和更新的版本时，使用 GitHub Release 资产，不把 `main.js` 作为普通源码提交。

1. 更新版本号：

   - `manifest.json`
   - `package.json`
   - `versions.json`

2. 构建：

   ```bash
   npm run build
   ```

3. 提交并推送源码，commit message 使用中文：

   ```bash
   git add manifest.json package.json versions.json README.md AGENTS.md
   git commit -m "更新 Obtero 发布文档"
   git push
   ```

4. 创建 GitHub Release，并上传 BRAT 所需资产：

   ```bash
   gh release create 1.0.1 manifest.json main.js styles.css \
     --repo DaveBraid/obtero \
     --title "Obtero 1.0.1" \
     --notes "发布说明"
   ```

如果 release 已存在，需要覆盖资产：

```bash
gh release upload 1.0.1 manifest.json main.js styles.css \
  --repo DaveBraid/obtero \
  --clobber
```

注意：

- tag 必须与 `manifest.json` 的 `version` 完全一致，例如 `1.0.1`。
- 不要使用 `v1.0.1` 这种带 `v` 的 tag。
- release 资产必须是单独文件，不要只上传源码压缩包。
- 如果 `gh auth status` 显示未登录或 token 失效，先运行 `gh auth login`。

## 常见问题

### BRAT 安装后第三方插件页空白或无法启用

先确认 release 资产是否齐全：

- `manifest.json`
- `main.js`
- `styles.css`

再确认 `.obsidian/community-plugins.json` 中启用的是 `obtero`，而不是旧的 `obsidian-mypaper-plugin`。迁移旧配置后需要完全重启 Obsidian。

### 可以直接删除旧插件目录吗

确认以下条件都满足后可以删除旧目录：

- `obtero` 已安装并启用。
- `.obsidian/plugins/obtero/data.json` 已存在。
- `obsidian-mypaper-plugin` 不再启用。
- 旧配置已经备份。

旧目录删除不会影响 Obtero 运行，但删除前务必备份旧 `data.json`。
