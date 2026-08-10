export function getDeterministicCandidates({ batch, product, riskResult, destinations, recentAvgPriceINR, demandForecast }) {
  let urgencyTier = 'monitor';
  
  // a) Determine urgency tier
  if (riskResult.riskCategory === 'critical' || riskResult.estimatedDaysRemaining <= 1) {
    urgencyTier = 'immediate';
  } else if (riskResult.riskCategory === 'high') {
    urgencyTier = 'urgent';
  } else if (riskResult.riskCategory === 'medium') {
    urgencyTier = 'monitor_discount';
  } else if (riskResult.riskCategory === 'low') {
    urgencyTier = 'monitor';
  }

  if (urgencyTier === 'monitor') {
    return { tier: urgencyTier, candidates: [], reason: 'batch healthy' };
  }

  const candidates = [];
  const baselineShelfLifeDays = riskResult.breakdown.baselineShelfLifeDays;
  const tempRateMult = riskResult.breakdown.tempRateMultiplier;
  const humidityStressMult = riskResult.breakdown.humidityStressMultiplier;
  const currentEffectiveDays = riskResult.breakdown.effectiveElapsedDays;

  // b) Transit-adjusted viability
  for (const dest of destinations) {
    if (!dest.distanceFromWarehouseKm || !dest.durationFromWarehouseMinutes) continue;

    const transitDays = dest.durationFromWarehouseMinutes / (24 * 60);
    // Assume transit conditions match current storage conditions
    const transitEffectiveDays = transitDays * tempRateMult * humidityStressMult;
    const projectedEffectiveDays = currentEffectiveDays + transitEffectiveDays;
    
    const projectedRiskRatio = projectedEffectiveDays / baselineShelfLifeDays;
    const projectedRiskPctOnArrival = Number((projectedRiskRatio * 100).toFixed(1));

    if (projectedRiskPctOnArrival >= 100) {
        continue; // Not a valid candidate, would spoil in transit
    }

    // c) Suggested discount pct
    let discountPct = 0;
    if (urgencyTier === 'immediate') {
      discountPct = dest.type === 'ngo' ? 100 : 50;
    } else if (urgencyTier === 'urgent') {
      discountPct = Math.round(20 + (riskResult.riskPct - 60) * 0.5);
      if (discountPct < 20) discountPct = 20;
      if (discountPct > 45) discountPct = 45;
    } else if (urgencyTier === 'monitor_discount') {
      discountPct = Math.round((riskResult.riskPct - 30) * 0.4);
      if (discountPct < 0) discountPct = 0;
      if (discountPct > 20) discountPct = 20;
    }

    // d) Expected recovered value & demand adjustment
    const typicalCapacityKgPerWeek = dest.typicalCapacityKgPerWeek;
    let demandAdjustedCapacityKgPerWeek = typicalCapacityKgPerWeek;

    if (demandForecast && !demandForecast.lowConfidence) {
      if (demandForecast.trendDirection === 'rising') {
        demandAdjustedCapacityKgPerWeek = Math.round(typicalCapacityKgPerWeek * 1.15);
      } else if (demandForecast.trendDirection === 'falling') {
        demandAdjustedCapacityKgPerWeek = Math.round(typicalCapacityKgPerWeek * 0.85);
      }
    }

    const divertableKg = Math.min(batch.quantityKg, demandAdjustedCapacityKgPerWeek);
    let expectedRecoveredValueINR = 0;
    let divertedKg = 0;

    if (dest.type === 'ngo' || discountPct === 100) {
      divertedKg = divertableKg; // write-off / donation
    } else {
      expectedRecoveredValueINR = divertableKg * recentAvgPriceINR * (1 - (discountPct / 100));
    }

    candidates.push({
      destination: {
        id: dest._id,
        name: dest.name,
        type: dest.type,
        distanceKm: dest.distanceFromWarehouseKm,
        durationMinutes: dest.durationFromWarehouseMinutes
      },
      projectedRiskPctOnArrival,
      discountPct,
      quantityKgUsed: divertableKg,
      typicalCapacityKgPerWeek,
      demandAdjustedCapacityKgPerWeek,
      recentAvgPriceINR: Number(recentAvgPriceINR.toFixed(2)),
      expectedRecoveredValueINR: Number(expectedRecoveredValueINR.toFixed(2)),
      kgDivertedFromLandfill: divertedKg
    });
  }

  // e) Sort candidates
  candidates.sort((a, b) => {
    // If both are donations (no revenue), sort by distance ascending
    if (a.expectedRecoveredValueINR === 0 && b.expectedRecoveredValueINR === 0) {
      return a.destination.distanceKm - b.destination.distanceKm;
    }
    // Otherwise sort by revenue descending
    return b.expectedRecoveredValueINR - a.expectedRecoveredValueINR;
  });

  if (candidates.length === 0 && urgencyTier !== 'monitor') {
    return { tier: urgencyTier, candidates: [], unsalvageable: true, reason: 'no destination reachable before spoilage' };
  }

  return { tier: urgencyTier, candidates: candidates.slice(0, 3) };
}
