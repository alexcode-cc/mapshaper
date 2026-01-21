import mapshaper from 'mapshaper';
import path from 'path';
import fs from 'fs';

// Supported input file extensions
const SUPPORTED_EXTENSIONS = ['.shp', '.zip'];

/**
 * Convert Shapefile(s) to GeoJSON format
 * @param {string[]} files - Array of input file paths
 * @param {Object} options - Conversion options
 * @param {boolean} options.prettify - Format output JSON for readability
 * @param {boolean} options.json - Use .json extension instead of .geojson
 */
export async function convert(files, options = {}) {
  const { prettify = false, json = false } = options;

  mapshaper.enableLogging();

  for (const inputFile of files) {
    await convertFile(inputFile, { prettify, json });
  }
}

/**
 * Convert a single Shapefile or ZIP to GeoJSON
 * @param {string} inputFile - Input .shp or .zip file path
 * @param {Object} options - Conversion options
 */
async function convertFile(inputFile, options = {}) {
  const { prettify = false, json = false } = options;

  // Resolve absolute path
  const absoluteInput = path.resolve(inputFile);

  // Check if file exists
  if (!fs.existsSync(absoluteInput)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  // Check if it's a supported file type
  const ext = path.extname(absoluteInput).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Input file must be a .shp or .zip file: ${inputFile}`);
  }

  // Generate output filename (use .json or .geojson based on option)
  const outputExt = json ? '.json' : '.geojson';
  const outputFile = absoluteInput.replace(/\.(shp|zip)$/i, outputExt);

  // Build mapshaper command
  const commands = [
    '-i', absoluteInput,
    '-o', outputFile, 'format=geojson'
  ];

  if (prettify) {
    commands.push('prettify');
  }

  return new Promise((resolve, reject) => {
    mapshaper.runCommands(commands, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Converted: ${path.basename(inputFile)} -> ${path.basename(outputFile)}`);
        resolve(outputFile);
      }
    });
  });
}

export default { convert };
