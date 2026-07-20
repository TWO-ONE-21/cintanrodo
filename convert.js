const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imgDir = path.join(__dirname, 'public', 'img');

async function processImages() {
  try {
    const files = fs.readdirSync(imgDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    
    let counter = 1;
    
    for (const file of imageFiles) {
      const inputPath = path.join(imgDir, file);
      
      let outputName;
      if (file.toLowerCase().startsWith('first')) {
        outputName = 'first.webp';
      } else {
        outputName = `${counter}.webp`;
        counter++;
      }
      
      const outputPath = path.join(imgDir, outputName);
      
      console.log(`Converting ${file} -> ${outputName}...`);
      
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
        
      // Delete original file
      fs.unlinkSync(inputPath);
    }
    
    console.log('Conversion complete!');
  } catch (err) {
    console.error('Error processing images:', err);
  }
}

processImages();
