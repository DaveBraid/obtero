# AGENTS.md

本文件是 Codex 在 `DaveBraid/obtero` 仓库中的入口级约束。保持简明，具体实现以代码和 `README.md` 为准。

## 仓库身份

- 远端仓库：`DaveBraid/obtero`
- 插件名称：`Obtero`
- 插件 ID：`obtero`
- 插件类型：Obsidian Community Plugin
- 发布方式：GitHub Release 资产供 BRAT 下载和更新

## 工作边界

- 不要在正式 Obsidian vault 的 `.obsidian/plugins/obtero` 下开发、编译或提交代码；该目录视为 BRAT 管理的安装目录。
- 开发、构建和调试只在独立测试目录或独立开发 clone 中进行。
- 不提交 `node_modules/`、`main.js`、`data.json`、`*.map`、`.DS_Store`。
- `data.json` 是用户本地配置，不属于仓库内容。
- 旧插件 ID `obsidian-mypaper-plugin` 仅用于迁移说明，不应重新作为发布 ID 使用。

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run lint
```

- `npm run dev` 用于本地 watch 构建。
- `npm run build` 是发布前必须运行的构建检查。
- `npm run lint` 若存在既有问题，应如实记录，不要声称通过。

## Release 与 BRAT

- 每次发布前同步更新 `manifest.json`、`package.json`、`versions.json` 中的版本信息。
- GitHub tag 必须与 `manifest.json` 的 `version` 完全一致，不加 `v` 前缀。
- Release 必须上传独立资产：`manifest.json`、`main.js`、`styles.css`。
- 使用 `gh` 命令行创建或更新 release，便于 BRAT 从正式仓库安装和更新。

示例：

```bash
gh release create 1.0.1 manifest.json main.js styles.css \
  --repo DaveBraid/obtero \
  --title "Obtero 1.0.1" \
  --notes "发布说明"
```

## Git 约束

- 每次修改都需要提交并推送。
- commit message 使用中文，简明说明本次修改。
- 只暂存本次任务相关文件，避免带入本地测试目录、构建产物或用户配置。

## 验证要求

- 文档修改至少检查 diff 和 git 状态。
- 涉及源码、构建、manifest 或 release 资产时，运行 `npm run build`。
- 对失败命令要保留真实结果，不要为了完成任务而跳过说明。
