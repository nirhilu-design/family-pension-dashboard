import pdf from "pdf-parse";

function cleanText(text) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMoney(value) {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").replace(/[^\d]/g, "");
  return Number(cleaned || 0);
}

function findFirstMoney(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseMoney(match[1]);
    }
  }
  return 0;
}

function extractSummaryFromText(text) {
  const normalized = cleanText(text);

  const totalAssets = findFirstMoney(normalized, [
    /פנסיוני\s+מסלקה\s+([\d,]+)\s*₪?\s*צברת/i,
    /מסלקה\s+([\d,]+)\s*₪?\s*צברת/i,
    /צברת.*?([\d,]+)\s*₪/i,
  ]);

  const pensionValue = findFirstMoney(normalized, [
    /מקיפה\s+חדשה\s+פנסיה\s+([\d,]+)\s*₪/i,
    /פנסיה\s+([\d,]+)\s*₪/i,
  ]);

  const gemelValue = findFirstMoney(normalized, [
    /גמל\s+([\d,]+)\s*₪/i,
  ]);

  const hishtalmutValue = findFirstMoney(normalized, [
    /השתלמות\s+([\d,]+)\s*₪/i,
  ]);

  const otherProducts = [
    { name: "פנסיה", value: pensionValue },
    { name: "קופות גמל", value: gemelValue },
    { name: "קרנות השתלמות", value: hishtalmutValue },
  ].filter((item) => item.value > 0);

  return {
    totalAssets,
    products: otherProducts,
    rawTextPreview: normalized.slice(0, 4000),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const pdfData = await pdf(buffer);
    const text = pdfData.text || "";

    const summary = extractSummaryFromText(text);

    const parsedData = {
      fullName: "נבדק מתוך PDF",
      provider: "מסלקה פנסיונית",
      productType: "פנסיה",
      balance: summary.totalAssets || 0,
      monthlyDeposit: 0,
      monthlyPensionWithDeposits: 0,
      monthlyPensionWithoutDeposits: 0,
      lumpSumWithDeposits: 0,
      lumpSumWithoutDeposits: 0,
      managementFeeBalance: 0,
      managementFeeDeposit: 0,
      disabilityValue: 0,
      disabilityPercent: 0,
      lifeCoverage: 0,
      deathCoverage: 0,
      trackName: "כללי / פנסיה",
      equityPercent: 45,
      extractedProducts: summary.products,
      rawTextPreview: summary.rawTextPreview,
    };

    return res.status(200).json({
      success: true,
      parsedData,
    });
  } catch (error) {
    console.error("PDF parse error:", error);

    return res.status(500).json({
      success: false,
      error: "שגיאה בקריאת PDF",
      details: error.message,
    });
  }
}