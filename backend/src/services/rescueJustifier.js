export async function getRecommendationNarrative({ batch, product, riskResult, candidates }) {
  if (!candidates || candidates.length === 0) {
    return {
      recommendedCandidateIndex: -1,
      justification: "No action needed. Batch is healthy.",
      urgencyStatement: "Monitor standard conditions."
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY missing. Falling back to top deterministic candidate.");
    return buildFallback(candidates, "fallback_error");
  }

  // Shuffle/sort candidates for Gemini to prevent ordering bias. 
  // We sort by distance ascending for the AI.
  const geminiCandidates = [...candidates].sort((a, b) => a.destination.distanceKm - b.destination.distanceKm);

  console.log("Gemini input order (neutral, distance-sorted):", geminiCandidates.map(c => c.destination.name));

  const promptText = `
You are an AI assistant for ProducePilot, an agricultural supply chain platform.
We have a batch of ${product.name} (Batch Code: ${batch.batchCode}) that needs rescue routing due to spoilage risk.

Context:
- Risk Percentage: ${riskResult.riskPct}% (Category: ${riskResult.riskCategory})
- Estimated Days Remaining: ${riskResult.estimatedDaysRemaining}
- Days Since Harvest: ${riskResult.breakdown.daysSinceHarvest}
- Current Storage Temp: ${batch.currentStorageTempC}°C (Deviation: ${riskResult.breakdown.tempDeviationC}°C)

We have deterministically computed the following rescue candidates (array index 0 to ${geminiCandidates.length - 1}):
${JSON.stringify(geminiCandidates, null, 2)}

Task:
Select the single best candidate from the array above to rescue this batch.
Provide a structured JSON output with:
- "recommendedCandidateIndex": The integer index (0, 1, or 2) of your selected candidate from the array provided.
- "justification": A 2-3 sentence business-appropriate justification for WHY this candidate is the best choice. You MUST explicitly weigh the expected recovered value AND transit risk (projectedRiskPctOnArrival) AND distance against each other. State the trade-off that drove your choice. Do NOT use terms like "Candidate 0" or refer to the array index in the text; just use the destination name.
- "urgencyStatement": A 1-sentence statement on urgency.
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: {
            type: "OBJECT",
            properties: {
              recommendedCandidateIndex: { type: "INTEGER" },
              justification: { type: "STRING" },
              urgencyStatement: { type: "STRING" }
            },
            required: ["recommendedCandidateIndex", "justification", "urgencyStatement"]
          }
        }
      })
    });
    
    clearTimeout(timeoutId);

    const data = await res.json();
    
    if (data.error) {
      console.warn("Gemini API Error:", data.error.message);
      return buildFallback(candidates, "fallback_error");
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(textResponse);

    if (
      typeof parsed.recommendedCandidateIndex !== 'number' || 
      parsed.recommendedCandidateIndex < 0 || 
      parsed.recommendedCandidateIndex >= geminiCandidates.length
    ) {
      console.warn("Gemini returned invalid index. Falling back.");
      return buildFallback(candidates, "fallback_error");
    }

    // Map the selected candidate back to its index in the original `candidates` array
    const selectedCandidateId = geminiCandidates[parsed.recommendedCandidateIndex].destination.id;
    const originalIndex = candidates.findIndex(c => c.destination.id === selectedCandidateId);

    parsed.recommendedCandidateIndex = originalIndex;
    parsed.source = "gemini";
    return parsed;

  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    console.warn(`Gemini Justifier Error (${isTimeout ? 'Timeout' : 'Error'}):`, error.message);
    return buildFallback(candidates, isTimeout ? "fallback_timeout" : "fallback_error");
  }
}

function buildFallback(candidates, reason = "fallback_error") {
  return {
    recommendedCandidateIndex: 0,
    justification: "System fallback to highest-revenue or nearest viable candidate.",
    urgencyStatement: "Action recommended based on deterministic ranking.",
    source: reason
  };
}
