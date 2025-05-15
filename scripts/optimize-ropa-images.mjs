// scripts/optimize-ropa-images.mjs
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Determinar el directorio base del proyecto de forma más robusta
const PROJECT_ROOT = process.cwd();
const ROPA_DIR = path.join(PROJECT_ROOT, 'public', 'ropa');
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

async function optimizeImage(filePath) {
  try {
    const extension = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      console.log(`\x1b[33mSkipping non-JPEG/PNG file:\x1b[0m ${path.basename(filePath)}`);
      return;
    }

    const originalBuffer = await fs.readFile(filePath);
    let optimizedBuffer;

    if (extension === '.png') {
      optimizedBuffer = await sharp(originalBuffer)
        .png({ quality: 80, compressionLevel: 8, adaptiveFiltering: true })
        .toBuffer();
    } else { // .jpg, .jpeg
      optimizedBuffer = await sharp(originalBuffer)
        .jpeg({ quality: 80, progressive: true, optimizeScans: true })
        .toBuffer();
    }

    const originalSize = originalBuffer.length;
    const optimizedSize = optimizedBuffer.length;

    if (optimizedSize < originalSize) {
      await fs.writeFile(filePath, optimizedBuffer);
      const savedBytes = originalSize - optimizedSize;
      const savedKB = (savedBytes / 1024).toFixed(2);
      console.log(`\x1b[32mOptimized:\x1b[0m ${path.basename(filePath)} (saved ${savedKB} KB)`);
    } else {
      console.log(`\x1b[36mSkipped (already optimized or optimization would increase size):\x1b[0m ${path.basename(filePath)}`);
    }

  } catch (err) {
    console.error(`\x1b[31mError optimizing ${path.basename(filePath)}:\x1b[0m`, err.message);
  }
}

async function main() {
  console.log(`\x1b[1mStarting optimization for images in ${ROPA_DIR}\x1b[0m`);
  try {
    await fs.access(ROPA_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`\x1b[31mError: Directory not found: ${ROPA_DIR}\x1b[0m`);
      console.error('Please make sure the public/ropa directory exists and contains images.');
      process.exit(1); // Salir si el directorio no existe
    }
    console.error(`\x1b[31mError accessing directory ${ROPA_DIR}:\x1b[0m`, err);
    process.exit(1);
  }

  try {
    const files = await fs.readdir(ROPA_DIR);
    if (files.length === 0) {
        console.log(`\x1b[33mNo files found in ${ROPA_DIR}. Nothing to optimize.\x1b[0m`);
        return;
    }

    console.log(`Found ${files.length} file(s)/folder(s). Processing images...`);
    let imagesProcessed = 0;
    for (const file of files) {
      const filePath = path.join(ROPA_DIR, file);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          await optimizeImage(filePath);
          imagesProcessed++;
        } else {
          console.log(`\x1b[33mSkipping directory:\x1b[0m ${file}`);
        }
      } catch (statError) {
        console.error(`\x1b[31mError getting stats for ${file}:\x1b[0m`, statError.message);
      }
    }
    
    if (imagesProcessed > 0) {
        console.log(`\n\x1b[1mImage optimization attempt complete for ${imagesProcessed} image(s) in public/ropa.\x1b[0m`);
    } else if (files.length > 0) {
        console.log(`\n\x1b[33mNo compatible images were processed in public/ropa.\x1b[0m`);
    }
    console.log('Please review the console output for details on each file.');

  } catch (err) {
    console.error('\x1b[31mError reading ropa directory or processing files:\x1b[0m', err);
  }
}

// Crear el directorio 'scripts' si no existe
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');
fs.mkdir(SCRIPTS_DIR, { recursive: true })
  .then(() => {
    main().catch(err => {
      console.error("\x1b[31mUnhandled error in main execution:\x1b[0m", err);
      process.exit(1);
    });
  })
  .catch(err => {
    console.error(`\x1b[31mFailed to create scripts directory ${SCRIPTS_DIR}:\x1b[0m`, err);
    process.exit(1);
  });
