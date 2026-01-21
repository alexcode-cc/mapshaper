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

### Help

View all available options:

```bash
node bin/shp2geojson --help
```

## Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-v, --version` | Show version number |
| `--prettify` | Format output JSON for readability |

## Examples

```bash
# Convert a single .shp file
node bin/shp2geojson data/counties.shp

# Convert a ZIP archive
node bin/shp2geojson data/counties.zip

# Convert with pretty formatting
node bin/shp2geojson data/counties.shp --prettify

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
