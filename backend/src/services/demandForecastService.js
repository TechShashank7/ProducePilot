import SalesRecord from '../models/SalesRecord.js';

export async function forecastDemand({ productId, warehouseId, horizonDays = 7 }) {
  const today = new Date();
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Pull last 60 days
  const records = await SalesRecord.find({
    productRef: productId,
    warehouseRef: warehouseId,
    date: { $gte: sixtyDaysAgo }
  }).sort({ date: 1 });

  // Group by date (YYYY-MM-DD)
  const dailyData = {};
  for (const r of records) {
    const dStr = r.date.toISOString().split('T')[0];
    if (!dailyData[dStr]) dailyData[dStr] = 0;
    dailyData[dStr] += r.quantitySoldKg;
  }

  const sortedDates = Object.keys(dailyData).sort();
  const numDays = sortedDates.length;

  if (numDays < 14) {
    return {
      lowConfidence: true,
      confidenceNote: `Insufficient data: based on only ${numDays} days of history. Need at least 14.`
    };
  }

  // Calculate 7-day moving average to smooth noise before regression
  const smoothedQty = [];
  for (let i = 0; i < numDays; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - 6); j <= i; j++) {
      sum += dailyData[sortedDates[j]];
      count++;
    }
    smoothedQty.push(sum / count);
  }

  // Linear Regression (Least Squares) on smoothed data
  // Using the most recent 21 days (if available) for the regression
  // Reasoning: A short-horizon (7-day) forecast should weight recent behavior more heavily 
  // than distant history (60 days), which could overpower emerging recent trends.
  const regressionDays = Math.min(21, numDays);
  const startIndex = numDays - regressionDays;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = startIndex; i < numDays; i++) {
    const x = i; // keep original x index for projection continuity
    const y = smoothedQty[i];
    sumX += x;
    sumY += y;
    sumXY += (x * y);
    sumX2 += (x * x);
  }

  const m = (regressionDays * sumXY - sumX * sumY) / (regressionDays * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / regressionDays;

  // Seasonality factors by Day of Week (still use full history for robust seasonality)
  const dowSums = [0, 0, 0, 0, 0, 0, 0];
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const dStr of sortedDates) {
    const dow = new Date(dStr).getDay();
    dowSums[dow] += dailyData[dStr];
    dowCounts[dow]++;
  }

  // Raw mean for seasonality over full history
  let rawSum = 0;
  for (const q of Object.values(dailyData)) rawSum += q;
  const rawMean = rawSum / numDays;

  const seasonalityFactors = dowSums.map((sum, dow) => {
    if (dowCounts[dow] === 0 || rawMean === 0) return 1;
    const dowMean = sum / dowCounts[dow];
    return dowMean / rawMean;
  });

  // Calculate avg daily sales last 14 days, prior week, and last week
  const last14Dates = sortedDates.slice(-14);
  let sum14 = 0;
  let sumPriorWeek = 0;
  let sumLastWeek = 0;

  for (let i = 0; i < last14Dates.length; i++) {
    const dStr = last14Dates[i];
    const qty = dailyData[dStr];
    sum14 += qty;
    if (i < 7) { // days -14 to -8 (0 to 6 in array)
      sumPriorWeek += qty;
    } else {     // days -7 to -1 (7 to 13 in array)
      sumLastWeek += qty;
    }
  }

  const avgDailySalesLast14Days = Number((sum14 / last14Dates.length).toFixed(2));
  const avgDailySalesPriorWeek = Number((sumPriorWeek / 7).toFixed(2));
  const avgDailySalesLastWeek = Number((sumLastWeek / 7).toFixed(2));

  let percentChange = 0;
  if (avgDailySalesPriorWeek > 0) {
    percentChange = ((avgDailySalesLastWeek - avgDailySalesPriorWeek) / avgDailySalesPriorWeek) * 100;
  }
  
  let trendDirection = "stable";
  if (percentChange >= 8) {
    trendDirection = "rising";
  } else if (percentChange <= -8) {
    trendDirection = "falling";
  }

  // Project forward
  const dailyForecast = [];
  let totalForecastedQtyKg = 0;

  for (let i = 1; i <= horizonDays; i++) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + i);
    const dow = targetDate.getDay();
    
    // approx offset from the last date in sortedDates
    const lastDateObj = new Date(sortedDates[numDays - 1]);
    const diffDays = Math.round((targetDate - lastDateObj) / (1000 * 60 * 60 * 24));
    const targetX = (numDays - 1) + diffDays;

    let baseTrendValue = (m * targetX) + b;
    if (baseTrendValue < 0) baseTrendValue = 0;

    const projectedQty = baseTrendValue * seasonalityFactors[dow];
    const qtyFixed = Number(projectedQty.toFixed(1));

    dailyForecast.push({
      date: targetDate.toISOString().split('T')[0],
      projectedQtyKg: qtyFixed
    });
    totalForecastedQtyKg += qtyFixed;
  }

  return {
    dailyForecast,
    totalForecastedQtyKg: Number(totalForecastedQtyKg.toFixed(1)),
    trendDirection,
    avgDailySalesLast14Days,
    avgDailySalesPriorWeek,
    avgDailySalesLastWeek,
    confidenceNote: `Based on ${numDays} days of history`
  };
}
