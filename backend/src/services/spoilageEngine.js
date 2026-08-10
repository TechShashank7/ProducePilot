/**
 * Pure function to compute spoilage risk of a batch based on environmental factors.
 */
export function computeSpoilageRisk({ batch, product, qualityParam, latestVisualAssessment }) {
  // a) daysSinceHarvest
  const now = new Date();
  const harvestDate = new Date(batch.harvestDate);
  const msInDay = 24 * 60 * 60 * 1000;
  const daysSinceHarvest = (now.getTime() - harvestDate.getTime()) / msInDay;

  // b) Temperature Deviation
  const idealTempMidC = (product.idealStorageTempC.min + product.idealStorageTempC.max) / 2;
  const tempDeviationC = batch.currentStorageTempC - idealTempMidC;
  
  // Q10 = 2.5 (Literature-typical value for fruit/veg respiration rate increase per 10C)
  const Q10 = 2.5; 
  let tempRateMultiplier = Math.pow(Q10, tempDeviationC / 10);
  
  if (tempRateMultiplier < 0.4) {
    tempRateMultiplier = 0.4; // Floor at 0.4
  }

  // c) chillingInjuryWarning
  const chillingSensitiveFruits = ['Mangoes', 'Bananas'];
  const isChillingSensitive = (product.category === 'Fruit' && chillingSensitiveFruits.includes(product.name));
  const chillingInjuryWarning = Boolean(isChillingSensitive && batch.currentStorageTempC < (idealTempMidC - 4));

  // d) Humidity Deviation
  const idealHumidityMidPct = (product.idealHumidityPct.min + product.idealHumidityPct.max) / 2;
  const humidityDeviationPct = Math.abs(batch.currentStorageHumidityPct - idealHumidityMidPct);
  const humidityStressMultiplier = 1 + (humidityDeviationPct / 10) * 0.05;

  // e) Effective Elapsed Days
  let effectiveElapsedDays = daysSinceHarvest * tempRateMultiplier * humidityStressMultiplier;
  if (chillingInjuryWarning) effectiveElapsedDays *= 1.5;

  // f) riskRatio & riskPct
  const baselineShelfLifeDays = product.typicalShelfLifeDays.max;
  const riskRatio = effectiveElapsedDays / baselineShelfLifeDays;
  let riskPct = Math.round(riskRatio * 100);

  // Blend visual assessment if available (30% weight to visual score difference from 100)
  let visualFactored = false;
  if (latestVisualAssessment && typeof latestVisualAssessment.visualConditionScore === 'number') {
    visualFactored = true;
    const visualRiskContribution = 100 - latestVisualAssessment.visualConditionScore;
    riskPct = Math.round((riskPct * 0.7) + (visualRiskContribution * 0.3));
  }

  if (riskPct > 100) riskPct = 100;
  if (riskPct < 0) riskPct = 0;

  // g) estimatedDaysRemaining
  // Calculate remaining days based on the final blended risk percentage
  let estimatedDaysRemaining = (baselineShelfLifeDays * ((100 - riskPct) / 100)) / (tempRateMultiplier * humidityStressMultiplier);
  if (estimatedDaysRemaining < 0) estimatedDaysRemaining = 0;
  estimatedDaysRemaining = Number(estimatedDaysRemaining.toFixed(1));

  // h) riskCategory
  let riskCategory = "low";
  if (riskPct >= 30 && riskPct < 60) riskCategory = "medium";
  else if (riskPct >= 60 && riskPct <= 85) riskCategory = "high";
  else if (riskPct > 85) riskCategory = "critical";

  return {
    riskPct,
    riskCategory,
    estimatedDaysRemaining,
    visualFactored,
    breakdown: {
      daysSinceHarvest: Number(daysSinceHarvest.toFixed(2)),
      baselineShelfLifeDays,
      idealTempMidC,
      tempDeviationC: Number(tempDeviationC.toFixed(2)),
      tempRateMultiplier: Number(tempRateMultiplier.toFixed(2)),
      idealHumidityMidPct,
      humidityDeviationPct: Number(humidityDeviationPct.toFixed(2)),
      humidityStressMultiplier: Number(humidityStressMultiplier.toFixed(2)),
      effectiveElapsedDays: Number(effectiveElapsedDays.toFixed(2)),
      chillingInjuryWarning
    }
  };
}
