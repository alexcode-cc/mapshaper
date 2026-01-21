import mapshaper from 'mapshaper';
import path from 'path';
import fs from 'fs';

/**
 * Convert Shapefile(s) to GeoJSON format
 * @param {string[]} files - Array of input file paths
 * @param {Object} options - Conversion options
 * @param {boolean} options.prettify - Format output JSON for readability
 */
export async function convert(files, options = {}) {
  const { prettify = false } = options;

  mapshaper.enableLogging();

  for (const inputFile of files) {
    await convertFile(inputFile, { prettify });
  }
}

/**
 * Convert a single Shapefile to GeoJSON
 * @param {string} inputFile - Input .shp file path
 * @param {Object} options - Conversion options
 */
async function convertFile(inputFile, options = {}) {
  const { prettify = false } = options;

  // Resolve absolute path
  const absoluteInput = path.resolve(inputFile);

  // Check if file exists
  if (!fs.existsSync(absoluteInput)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  // Check if it's a .shp file
  const ext = path.extname(absoluteInput).toLowerCase();
  if (ext !== '.shp') {
    throw new Error(`Input file must be a .shp file: ${inputFile}`);
  }

  // Generate output filename (same name with .geojson extension)
  const outputFile = absoluteInput.replace(/\.shp$/i, '.geojson');

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
