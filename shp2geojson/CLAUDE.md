# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

shp2geojson is a CLI tool that converts Shapefiles (.shp) and ZIP archives containing Shapefiles to GeoJSON format. It is a subproject of [mapshaper](https://github.com/mbloch/mapshaper), using mapshaper as a local dependency (`file:..`).

## Commands

```bash
# Install dependencies
npm install

# Run the CLI
node bin/shp2geojson <input-files> [--prettify] [--json]

# Run via npm scripts
npm run shp2geojson -- input.shp
npm run convert -- input.shp

# Test (runs --help as a sanity check; no automated test suite)
npm test

# Test data is available in the parent project
node bin/shp2geojson ../test/data/three_points.shp
node bin/shp2geojson ../test/data/two_states.shp
```

## Architecture

The codebase has only two source files:

- **`bin/shp2geojson`** — CLI entry point. Parses `process.argv`, extracts flags (`--help`, `--version`, `--prettify`, `--json`), filters remaining args as input file paths, and calls `convert()`.
- **`src/index.mjs`** — Core logic. `convert(files, options)` iterates files; `convertFile()` validates each file (must exist, must be `.shp` or `.zip`), constructs a mapshaper command array (`-i`, `-o`, `format=geojson`), and executes it via `mapshaper.runCommands()`.

The actual Shapefile parsing, ZIP extraction, and GeoJSON export are all handled by the parent mapshaper library.

## Git Commit 規範

遵循 AngularJS Git Commit Message Conventions，所有提交訊息使用**繁體中文**。

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（類型）

- **feat**: 新功能
- **fix**: 修復 bug
- **docs**: 文件變更
- **style**: 不影響程式邏輯的格式調整（空白、分號等）
- **refactor**: 重構（非新功能、非修復 bug）
- **perf**: 效能改善
- **test**: 新增或修改測試
- **chore**: 建置流程或輔助工具變更

### 規則

- **subject**: 簡短描述變更內容，不超過 50 字元，使用繁體中文，不加句號
- **scope**（可選）: 影響範圍，例如 `cli`、`convert`、`config`
- **body**（可選）: 詳細說明變更動機與前後差異，使用繁體中文
- **footer**（可選）: 記錄 Breaking Changes 或關聯的 issue 編號

### 範例

```
feat(cli): 新增 --prettify 選項支援格式化輸出
fix(convert): 修正 ZIP 檔案路徑解析錯誤
docs: 新增 CLAUDE.md 專案指引文件
chore: 更新 npm scripts 設定
```

## Key Details

- **ES Modules** — `"type": "module"` in package.json; source files use `.mjs` extension.
- **mapshaper dependency** — Linked via `"mapshaper": "file:.."`. After changes to the parent mapshaper project, run `npm install` here to pick them up.
- **Output files** are written to the same directory as input, replacing the extension with `.geojson` (or `.json` with `--json`).
- **DEVELOPMENT.md** contains detailed technical documentation in Traditional Chinese, including mapshaper internals, data structures, and extension guidance.
