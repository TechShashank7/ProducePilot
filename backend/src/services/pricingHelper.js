import SalesRecord from '../models/SalesRecord.js';

export async function getRecentAvgPrice(productId, warehouseId) {
  // Find latest record date
  const latestRecord = await SalesRecord.findOne({ productRef: productId, warehouseRef: warehouseId }).sort({ date: -1 });
  if (!latestRecord) {
    // Try without warehouseId filter if no local sales
    const globalLatest = await SalesRecord.findOne({ productRef: productId }).sort({ date: -1 });
    if (!globalLatest) return 0;
    
    // Average all available globally if completely falling back
    const allGlobal = await SalesRecord.aggregate([
      { $match: { productRef: productId } },
      { $group: { _id: null, avgPrice: { $avg: "$unitPriceINR" } } }
    ]);
    console.log(`Fallback: Using global average price for product ${productId}`);
    return allGlobal[0] ? allGlobal[0].avgPrice : 0;
  }

  const latestDate = new Date(latestRecord.date);
  const cutoffDate = new Date(latestDate.getTime() - 14 * 24 * 60 * 60 * 1000);

  const result = await SalesRecord.aggregate([
    { 
      $match: { 
        productRef: productId, 
        warehouseRef: warehouseId,
        date: { $gte: cutoffDate, $lte: latestDate }
      } 
    },
    { 
      $group: { 
        _id: null, 
        avgPrice: { $avg: "$unitPriceINR" } 
      } 
    }
  ]);

  if (result.length > 0 && result[0].avgPrice) {
    return result[0].avgPrice;
  }

  // Wider-window fallback
  const allTime = await SalesRecord.aggregate([
    { $match: { productRef: productId, warehouseRef: warehouseId } },
    { $group: { _id: null, avgPrice: { $avg: "$unitPriceINR" } } }
  ]);
  console.log(`Fallback: Using all-time local average price for product ${productId} at warehouse ${warehouseId}`);
  return allTime[0] ? allTime[0].avgPrice : 0;
}
