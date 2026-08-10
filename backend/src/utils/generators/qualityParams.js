import mongoose from 'mongoose';
import { randomFloat, randomInt } from './random.js';

export function generateQualityParams(products, prng) {
  const qualityParams = [];

  // Generate realistic ranges based on the product
  for (const product of products) {
    let brixMin, brixMax, firmnessMin, firmnessMax, defectPct, colorDesc;
    
    switch(product.name) {
      case 'Tomatoes':
        brixMin = 3.5; brixMax = 5.5; firmnessMin = 2; firmnessMax = 4; defectPct = 5; colorDesc = 'USDA Light Red to Red'; break;
      case 'Bananas':
        brixMin = 18; brixMax = 22; firmnessMin = 1; firmnessMax = 3; defectPct = 2; colorDesc = 'Yellow with green tips'; break;
      case 'Mangoes':
        brixMin = 14; brixMax = 20; firmnessMin = 2; firmnessMax = 5; defectPct = 4; colorDesc = 'Orange-yellow blush'; break;
      case 'Spinach':
        brixMin = 0; brixMax = 0; firmnessMin = 0; firmnessMax = 0; defectPct = 10; colorDesc = 'Dark green, no yellowing'; break; // Leafy greens don't really use brix/firmness in same way
      case 'Apples':
        brixMin = 12; brixMax = 16; firmnessMin = 6; firmnessMax = 9; defectPct = 3; colorDesc = 'Uniform red/green depending on variety'; break;
      case 'Grapes':
        brixMin = 15; brixMax = 20; firmnessMin = 2; firmnessMax = 4; defectPct = 3; colorDesc = 'Uniform color, firm attachment'; break;
      case 'Onions':
        brixMin = 5; brixMax = 10; firmnessMin = 8; firmnessMax = 10; defectPct = 5; colorDesc = 'Dry, paper-like skin'; break;
      case 'Potatoes':
        brixMin = 4; brixMax = 6; firmnessMin = 8; firmnessMax = 10; defectPct = 5; colorDesc = 'Earthy brown, no greening'; break;
      default:
        brixMin = 5; brixMax = 10; firmnessMin = 1; firmnessMax = 5; defectPct = 5; colorDesc = 'Standard grade';
    }

    qualityParams.push({
      _id: new mongoose.Types.ObjectId(),
      productRef: product._id,
      brixRangeMin: brixMin,
      brixRangeMax: brixMax,
      firmnessIndexRange: { min: firmnessMin, max: firmnessMax },
      acceptableDefectPct: defectPct,
      colorGradeDescription: colorDesc
    });
  }

  return qualityParams;
}
