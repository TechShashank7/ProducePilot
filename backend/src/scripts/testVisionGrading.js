import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { gradeProduceImage } from '../services/visionGradingService.js';

dotenv.config();

const __dirname = path.resolve();

async function runTests() {
  const imagesDir = path.join(__dirname, 'data', 'sample-images');
  
  if (!fs.existsSync(imagesDir)) {
    console.log(`Directory not found: ${imagesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(imagesDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  if (files.length === 0) {
    console.log(`No images found in ${imagesDir}. Please add 2-3 images.`);
    process.exit(1);
  }

  console.log(`Found ${files.length} images. Running vision grading...`);
  
  const results = [];

  for (const file of files) {
    console.log(`\n--- Processing: ${file} ---`);
    const ext = path.extname(file).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    const filePath = path.join(imagesDir, file);
    const base64Data = fs.readFileSync(filePath, { encoding: 'base64' });

    try {
      // Just passing the filename as product hint to help it if it's named like "fresh_tomato.jpg"
      const result = await gradeProduceImage(base64Data, mimeType, "fresh produce");
      console.log(JSON.stringify(result, null, 2));
      results.push({ file, result });
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  // Cross-check for suspiciously identical outputs
  if (results.length > 1) {
    let duplicateFound = false;
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        if (
          results[i].result.visualConditionScore === results[j].result.visualConditionScore &&
          results[i].result.modelRationale === results[j].result.modelRationale
        ) {
          console.warn(`\nWARNING: Suspiciously identical output detected between ${results[i].file} and ${results[j].file}!`);
          duplicateFound = true;
        }
      }
    }
    if (!duplicateFound) {
      console.log(`\nVerification passed: No suspiciously identical outputs between different images.`);
    }
  }
}

runTests();
