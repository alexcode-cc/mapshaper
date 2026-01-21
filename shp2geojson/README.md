# shp2geojson

A simple command-line tool to convert Shapefile (.shp) to GeoJSON format.

This is a subproject of [mapshaper](https://github.com/mbloch/mapshaper), providing a streamlined CLI interface specifically for Shapefile to GeoJSON conversion.

## Installation

```bash
cd shp2geojson
npm install
```

## Usage

### Basic Conversion

Convert a single Shapefile to GeoJSON (output will have the same name with `.geojson` extension):

```bash
node bin/shp2geojson input.shp
# Output: input.geojson
```

### Batch Conversion

Convert multiple Shapefiles at once:

```bash
node bin/shp2geojson file1.shp file2.shp file3.shp
```

Or use wildcards:

```bash
node bin/shp2geojson *.shp
```

### Pretty Print Output

Format the output JSON for better readability:

```bash
node bin/shp2geojson input.shp --prettify
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
# Convert a single file
node bin/shp2geojson data/counties.shp

# Convert with pretty formatting
node bin/shp2geojson data/counties.shp --prettify

# Batch convert all shapefiles in a directory
node bin/shp2geojson data/*.shp
```

## Requirements

- Node.js >= 12.0.0
- Parent mapshaper project must be built (`npm run build` in the parent directory)

## Notes

- The tool expects the associated `.dbf` and `.shx` files to be in the same directory as the `.shp` file
- Output files are saved in the same directory as the input files
- Existing output files will be overwritten

## License

MPL-2.0 (same as mapshaper)
