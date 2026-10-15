# shp2geojson

A simple command-line tool to convert Shapefile (.shp) or ZIP archives containing Shapefiles to GeoJSON format.

This is a subproject of [mapshaper](https://github.com/mbloch/mapshaper), providing a streamlined CLI interface specifically for Shapefile to GeoJSON conversion.

## Installation

```bash
cd shp2geojson
npm install
```

## Supported Input Formats

| Format | Description |
|--------|-------------|
| `.shp` | Shapefile (requires `.dbf` and `.shx` in same directory) |
| `.zip` | ZIP archive containing complete Shapefile components |
| `<directory>` | Directory containing `.shp` or `.zip` files |

## Usage

### Basic Conversion

Convert a single Shapefile to GeoJSON (output will have the same name with `.geojson` extension):

```bash
node bin/shp2geojson input.shp
# Output: input.geojson
```

### Convert from ZIP Archive

Convert a ZIP file containing Shapefile components:

```bash
node bin/shp2geojson data.zip
# Output: data.geojson
```

### Convert Entire Directory

Convert all Shapefiles or ZIP archives in a directory:

```bash
node bin/shp2geojson data/
node bin/shp2geojson data/ --json
```

### Batch Conversion

Convert multiple files at once:

```bash
node bin/shp2geojson file1.shp file2.zip file3.shp
```

Or use wildcards:

```bash
node bin/shp2geojson *.shp
node bin/shp2geojson *.zip
```

### Pretty Print Output

Format the output JSON for better readability:

```bash
node bin/shp2geojson input.shp --prettify
node bin/shp2geojson input.zip --prettify
```

### Use Custom Extension (.json)

Use `.json` extension instead of the default `.geojson` extension:

```bash
node bin/shp2geojson input.shp --json
node bin/shp2geojson input.zip --json
```

### Help

View all available options:

```bash
node bin/shp2geojson --help
```

## Helper Scripts (目錄批次轉換輔助指令稿)

專案提供了針對目錄批次轉換的跨平台指令稿（將指定目錄下的 `*.zip` 檔案轉換為 `.json` 格式），目錄路徑為**必要參數**：

### 1. Windows Batch (`convert.bat`)

適用於 Windows 命令提示字元 (`cmd.exe`)：

```cmd
# 基本用法（目錄路徑為必要參數）
convert.bat D:\G\2304.W07003

# 支援傳入額外選項（如 --prettify）
convert.bat D:\G\2304.W07003 --prettify
```

### 2. PowerShell (`convert.ps1`)

適用於 PowerShell / Windows PowerShell：

```powershell
# 基本用法
.\convert.ps1 D:\G\2304.W07003

# 具名參數與額外選項
.\convert.ps1 -TargetDir "D:\G\2304.W07003" --prettify
```

### 3. Bash (`convert.sh`)

適用於 Linux / macOS / Git Bash / WSL：

```bash
# 基本用法
./convert.sh D:/G/2304.W07003
# 或 Git Bash / Linux 路徑
./convert.sh /d/G/2304.W07003
```

### 4. npm scripts (`package.json`)

透過 `npm run` 執行跨平台指令：

```bash
# 批次轉換目錄中的所有檔案為 .json（目錄為必要參數）
npm run convert:dir -- D:\G\2304.W07003

# 一般轉換用法（單檔、萬用字元或目錄）
npm run convert -- data.shp
npm run convert -- "D:\G\2304.W07003\*.zip" --json
```

## Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-v, --version` | Show version number |
| `--prettify` | Format output JSON for readability |
| `--json` | Use `.json` extension instead of `.geojson` |

## Examples

```bash
# Convert a single .shp file
node bin/shp2geojson data/counties.shp

# Convert a ZIP archive
node bin/shp2geojson data/counties.zip

# Convert with pretty formatting
node bin/shp2geojson data/counties.shp --prettify

# Convert with custom extension (.json)
node bin/shp2geojson data/counties.shp --json

# Batch convert all shapefiles in a directory
node bin/shp2geojson data/*.shp

# Batch convert all ZIP files
node bin/shp2geojson data/*.zip
```

## Requirements

- Node.js >= 12.0.0
- Parent mapshaper project must be built (`npm run build` in the parent directory)

## Notes

- For `.shp` files: the tool expects the associated `.dbf` and `.shx` files to be in the same directory
- For `.zip` files: the archive should contain complete Shapefile components (`.shp`, `.dbf`, `.shx`, and optionally `.prj`, `.cpg`)
- Output files are saved in the same directory as the input files
- Existing output files will be overwritten

## License

MPL-2.0 (same as mapshaper)
