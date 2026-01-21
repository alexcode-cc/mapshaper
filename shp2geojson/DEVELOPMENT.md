# shp2geojson 開發文件

本文件記錄 shp2geojson 子專案的實作細節與技術資訊，供後續開發參考。

## 專案架構

```
shp2geojson/
├── bin/
│   └── shp2geojson       # CLI 入口點（ES Module）
├── src/
│   └── index.mjs         # 核心轉換邏輯
├── package.json          # 專案配置
├── package-lock.json     # 依賴鎖定檔
├── README.md             # 使用說明
└── DEVELOPMENT.md        # 本文件
```

## 技術棧

| 項目 | 說明 |
|------|------|
| 執行環境 | Node.js >= 12.0.0 |
| 模組系統 | ES Modules (ESM) |
| 核心依賴 | mapshaper (本地連結至父專案) |
| 授權 | MPL-2.0 |

## 核心模組說明

### bin/shp2geojson

CLI 入口點，負責：

1. **參數解析**：處理命令列參數
2. **選項處理**：`--help`、`--version`、`--prettify`
3. **檔案過濾**：篩選出非選項參數作為輸入檔案
4. **錯誤處理**：捕獲並顯示錯誤訊息

```javascript
#!/usr/bin/env node

import { convert } from '../src/index.mjs';

const args = process.argv.slice(2);
// ... 參數處理邏輯
```

### src/index.mjs

核心轉換邏輯，主要函式：

#### `convert(files, options)`

批量轉換多個檔案的入口函式。

| 參數 | 類型 | 說明 |
|------|------|------|
| `files` | `string[]` | 輸入檔案路徑陣列 |
| `options.prettify` | `boolean` | 是否美化輸出 JSON |

```javascript
export async function convert(files, options = {}) {
  const { prettify = false } = options;
  mapshaper.enableLogging();
  for (const inputFile of files) {
    await convertFile(inputFile, { prettify });
  }
}
```

#### `convertFile(inputFile, options)`

轉換單一檔案的內部函式。

**處理流程：**

1. 解析絕對路徑
2. 檢查檔案是否存在
3. 驗證副檔名為 `.shp`
4. 產生輸出檔名（`.shp` → `.geojson`）
5. 建構 mapshaper 命令
6. 執行轉換並回傳 Promise

## 與 mapshaper 的整合

### 依賴關係

```json
{
  "dependencies": {
    "mapshaper": "file:.."
  }
}
```

透過本地連結方式依賴父專案的 mapshaper，確保使用相同版本。

### mapshaper API 使用

本專案使用 mapshaper 的公開 API：

```javascript
import mapshaper from 'mapshaper';

// 啟用日誌輸出
mapshaper.enableLogging();

// 執行命令
mapshaper.runCommands(commands, callback);
```

### 命令建構

轉換命令對應的 mapshaper CLI：

```bash
mapshaper -i input.shp -o output.geojson format=geojson [prettify]
```

程式碼實作：

```javascript
const commands = [
  '-i', absoluteInput,
  '-o', outputFile, 'format=geojson'
];

if (prettify) {
  commands.push('prettify');
}
```

## Shapefile 轉換原理

### Shapefile 組成

一個完整的 Shapefile 包含多個檔案：

| 檔案 | 必要性 | 說明 |
|------|--------|------|
| `.shp` | 必要 | 幾何資料（點、線、多邊形座標） |
| `.shx` | 必要 | 空間索引 |
| `.dbf` | 必要 | 屬性資料（dBASE 格式） |
| `.prj` | 選用 | 座標系統定義 |
| `.cpg` | 選用 | 字元編碼資訊 |

### mapshaper 內部處理流程

```
輸入 .shp 檔案
    ↓
ShpReader 解析二進位格式
    ↓
DbfReader 解析屬性資料
    ↓
建立內部資料結構 (Dataset)
    ↓
exportGeoJSON() 轉換
    ↓
輸出 .geojson 檔案
```

### 內部資料結構

mapshaper 使用的內部資料模型：

```javascript
Dataset = {
  info: {},                    // 中繼資料
  arcs: ArcCollection,         // 共享座標弧段
  layers: [
    {
      name: string,
      geometry_type: 'point' | 'polyline' | 'polygon',
      shapes: [...],           // 幾何參照
      data: DataTable          // 屬性資料
    }
  ]
}
```

### GeoJSON 輸出格式

```javascript
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point" | "LineString" | "Polygon" | ...,
        "coordinates": [...]
      },
      "properties": {
        "field1": "value1",
        ...
      }
    }
  ]
}
```

## 擴展開發指南

### 新增命令列選項

1. 在 `bin/shp2geojson` 中新增選項解析：

```javascript
const newOption = args.includes('--new-option');
```

2. 將選項傳遞給 `convert()` 函式：

```javascript
await convert(files, { prettify, newOption });
```

3. 在 `src/index.mjs` 中處理選項：

```javascript
export async function convert(files, options = {}) {
  const { prettify = false, newOption = false } = options;
  // ...
}
```

### 支援更多輸出格式

可透過修改 mapshaper 命令來支援其他格式：

```javascript
// TopoJSON
const commands = ['-i', input, '-o', output, 'format=topojson'];

// CSV (僅屬性)
const commands = ['-i', input, '-o', output, 'format=csv'];
```

### 新增資料處理功能

利用 mapshaper 的命令鏈：

```javascript
const commands = [
  '-i', input,
  '-simplify', '10%',           // 簡化幾何
  '-filter', 'population > 0',  // 過濾資料
  '-proj', 'wgs84',             // 座標轉換
  '-o', output, 'format=geojson'
];
```

## 測試方式

### 手動測試

```bash
# 基本轉換
node bin/shp2geojson ../test/data/three_points.shp

# 美化輸出
node bin/shp2geojson ../test/data/two_states.shp --prettify

# 批量轉換
node bin/shp2geojson ../test/data/*.shp
```

### 測試資料位置

父專案提供的測試資料：

```
../test/data/
├── three_points.shp      # 點資料
├── two_states.shp        # 多邊形資料
├── six_counties.shp      # 多邊形資料
└── geo_lines.shp         # 線資料
```

## 相關檔案參考

### mapshaper 核心模組

| 檔案路徑 | 說明 |
|----------|------|
| `src/shapefile/shp-import.mjs` | SHP 讀取入口 |
| `src/shapefile/shp-reader.mjs` | SHP 二進位解析 |
| `src/shapefile/shp-record.mjs` | SHP 記錄解碼 |
| `src/shapefile/dbf-import.mjs` | DBF 屬性讀取 |
| `src/geojson/geojson-export.mjs` | GeoJSON 輸出 |
| `src/cli/mapshaper-run-commands.mjs` | 命令執行器 |

### mapshaper 公開 API

```javascript
// src/mapshaper-api.mjs
var api = {
  runCommands,      // 執行命令（支援回調）
  applyCommands,    // 執行命令（回傳資料）
  runCommandsXL,    // 大檔案處理
  enableLogging     // 啟用日誌
};
```

## 已知限制

1. **輸出路徑**：目前僅支援輸出至與輸入檔案相同的目錄
2. **檔案覆寫**：會自動覆寫同名的輸出檔案
3. **編碼處理**：依賴 mapshaper 的自動編碼偵測
4. **大檔案**：未針對超大檔案進行特別優化

## 未來可能的改進方向

- [ ] 支援指定輸出目錄
- [ ] 支援指定輸出檔名
- [ ] 新增 `--silent` 靜音模式
- [ ] 新增 `--bbox` 輸出邊界框
- [ ] 支援座標系統轉換（`--proj`）
- [ ] 支援幾何簡化（`--simplify`）
- [ ] 新增進度顯示（處理多檔案時）
