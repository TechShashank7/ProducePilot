import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from '../models/Batch.js';
import SalesRecord from '../models/SalesRecord.js';
import { forecastDemand } from '../services/demandForecastService.js';

dotenv.config();

async function checkDemandForecast() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Pick 3 distinct product/warehouse pairs from SalesRecord
    const records = await SalesRecord.aggregate([
      { $group: { _id: { p: "$productRef", w: "$warehouseRef" } } },
      { $limit: 3 }
    ]);

    for (let i = 0; i < records.length; i++) {
      const pId = records[i]._id.p;
      const wId = records[i]._id.w;

      console.log(`\n======================================================`);
      console.log(`Forecast for Product ${pId} / Warehouse ${wId}`);
      
      const forecast = await forecastDemand({ productId: pId, warehouseId: wId, horizonDays: 7 });
      
      console.log(`Trend Direction: ${forecast.trendDirection}`);
      console.log(`Avg Daily Sales (Last 14 days): ${forecast.avgDailySalesLast14Days} kg`);
      console.log(`Avg Daily Sales (Prior Week): ${forecast.avgDailySalesPriorWeek} kg`);
      console.log(`Avg Daily Sales (Last Week): ${forecast.avgDailySalesLastWeek} kg`);
      console.log(`Forecast Confidence: ${forecast.confidenceNote}`);
      console.log(`Daily Forecast (Next 7 days):`);
      console.table(forecast.dailyForecast);

      // Raw sales cross-check for the very first pair
      if (i === 0) {
        console.log(`\n--- Raw Sales Cross-Check (Last 14 Days) ---`);
        const today = new Date();
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(today.getDate() - 14);

        const recentSales = await SalesRecord.find({
          productRef: pId,
          warehouseRef: wId,
          date: { $gte: fourteenDaysAgo }
        }).sort({ date: -1 }).limit(14); // We just grab some recent records to eyeball

        const tableData = recentSales.map(r => ({
          Date: r.date.toISOString().split('T')[0],
          QuantitySoldKg: r.quantitySoldKg
        }));
        
        console.table(tableData);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkDemandForecast();
