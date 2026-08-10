export async function gradeProduceImage(imageBase64, mimeType, productHint) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const promptText = `
Act as an expert agricultural quality inspector. Analyze this image of fresh produce.
${productHint ? `Hint: This is expected to be ${productHint}.` : ''}

Evaluate the produce and return a JSON object with the following fields:
- "identifiedProduceType": String. Your best guess at what produce is in the photo, independent of the hint.
- "productMatchesHint": Boolean. Does your identification reasonably match the hint? (e.g. if the hint is "Apples" and the photo is a pear, return false). If no hint was provided, return true.
- "ripenessStage": String. Your assessment of the ripeness (e.g. "underripe", "ripe", "overripe", "spoiled"). Choose the most accurate descriptor.
- "defectsDetected": Array of strings. List any visible defects like "bruising", "mold", "wrinkling", "discoloration", "cuts". Empty array if none.
- "visualConditionScore": Number 0-100. 100 = perfect, pristine condition. 0 = completely inedible/spoiled.
- "confidencePct": Number 0-100. How confident are you in this assessment?
- "modelRationale": String (1-2 sentences). You MUST ground your score and findings in SPECIFIC visual evidence from the image. Reference actual colors, textures, spotting, wrinkling, mold, or firmness cues visible. Generic responses like "The produce looks fresh" will be rejected.

Return only valid JSON matching this schema.
`;

  try {
    // We use gemini-flash-latest which supports multimodal inputs
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    // strip data uri prefix if present
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: {
            type: "OBJECT",
            properties: {
              identifiedProduceType: { type: "STRING" },
              productMatchesHint: { type: "BOOLEAN" },
              ripenessStage: { type: "STRING" },
              defectsDetected: { type: "ARRAY", items: { type: "STRING" } },
              visualConditionScore: { type: "NUMBER" },
              confidencePct: { type: "NUMBER" },
              modelRationale: { type: "STRING" }
            },
            required: ["identifiedProduceType", "productMatchesHint", "ripenessStage", "defectsDetected", "visualConditionScore", "confidencePct", "modelRationale"]
          }
        }
      })
    });

    const data = await res.json();
    
    if (data.error) {
      throw new Error(`Gemini API Error: ${data.error.message}`);
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(textResponse);

    // Light validation on rationale
    if (parsed.modelRationale.length < 20) {
       throw new Error("Rejected: Model rationale was too generic or brief.");
    }

    return parsed;

  } catch (error) {
    throw new Error(`Vision Grading Failed: ${error.message}`);
  }
}
