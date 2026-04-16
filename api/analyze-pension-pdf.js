import pdf from "pdf-parse";

function cleanText(text) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[|]/g, " ")
    .trim();
}

function parseMoney(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, "").replace(/[^\d]/g, "");
  return Number(cleaned || 0);
}

function uniqMax(values) {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0);
  return clean.length ? Math.max(...clean) : 0;
}

function findMatches(text, patterns) {
  const results = [];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        const value = parseMoney(match[1]);
        if (value > 0) results.push(value);
      }
    }
  }

  return results;
}

function extractTotalAssets(text) {
  const totals = findMatches(text, [
    /([\d,]{5,})\s*₪?\s*צברת/gi,
    /צברת\s*([\d,]{5,})\s*₪?/gi,
    /הסכום\s*המצטבר\s*([\d,]{5,})\s*₪?/gi,
    /סך\s*צבירה\s*([\d,]{5,})\s*₪?/gi,
  ]);

  return uniqMax(totals);
}

function extractProductValue(text, productName, extraPatterns = []) {
  const basePatterns = [
    new RegExp(`([\\d,]{3,})\\s*₪?[^\\n]{0,40}${productName}`, "gi"),
    new RegExp(`${productName}[^\\n]{0,40}([\\d,]{3,})\\s*₪?`, "gi"),
  ];

  const values = findMatches(text, [...basePatterns, ...extraPatterns]);
  return uniqMax(values);
}

function extractProducts(text) {
  const pensionValue = extractProductValue(" " + text + " ", "פנסיה", [
    /([\d,]{3,})\s*₪?[^]{0,20}מקיפה\s+חדשה\s+פנסיה/gi,
    /מקיפה\s+חדשה\s+פנסיה[^]{0,20}([\d,]{3,})\s*₪?/gi,
    /([\d,]{3,})\s*₪?[^]{0,20}פנסיה\s+כללית/gi,
    /פנסיה\s+כללית[^]{0,20}([\d,]{3,})\s*₪?/gi,
  ]);

  const gemelValue = extractProductValue(" " + text + " ", "גמל", [
    /([\d,]{3,})\s*₪?[^]{0,20}גמל/gi,
    /גמל[^]{0,20}([\d,]{3,})\s*₪?/gi,
  ]);

  const hishtalmutValue = extractProductValue(" " + text + " ", "השתלמות", [
    /([\d,]{3,})\s*₪?[^]{0,20}השתלמות/gi,
    /השתלמות[^]{0,20}([\d,]{3,})\s*₪?/gi,
  ]);

  const products = [
    { name: "פנסיה", value: pensionValue },
    { name: "קופות גמל", value: gemelValue },
    { name: "קרנות השתלמות", value: hishtalmutValue },
  ].filter((item) => item.value > 0);

  return products;
}

function extractMonthlyDeposit(text) {
  const values = findMatches(text, [
    /מפקיד\s+כסף\s+כמה\s*([\d,]{2,})\s*₪?/gi,
    /בסך\s*חודשי\s*([\d,]{2,})\s*₪?/gi,
    /הפקדה\s+חודשית\s*([\d,]{2,})\s*₪?/gi,
    /מפקידים\s+עבורי\s*([\d,]{2,})\s*₪?/gi,
  ]);

  return uniqMax(values);
}

function extractName(text) {
  const patterns = [
    /שלום[, ]+([א-ת"'\- ]{2,40})/i,
    /עבור\s+([א-ת"'\- ]{2,40})/i,
    /לכבוד\s+([א-ת"'\- ]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/\s+/g, " ");
    }
  }

  return "לא זוהה";
}

function inferProductsFallback(totalAssets, products) {
  if (products.length > 0) return products;

  return totalAssets > 0 ? [{ name: "פנסיה", value: totalAssets }] : [];
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
    const rawText = pdfData.text || "";
    const text = cleanText(rawText);

    const totalAssets = extractTotalAssets(text);
    const monthlyDeposit = extractMonthlyDeposit(text);
    const fullName = extractName(text);
    const extractedProducts = inferProductsFallback(totalAssets, extractProducts(text));

    return res.status(200).json({
      success: true,
      parsedData: {
        fullName,
        provider: "מסלקה פנסיונית",
        productType: extractedProducts[0]?.name || "פנסיה",
        balance: totalAssets,
        monthlyDeposit,
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
        trackName: "כללי",
        equityPercent: 45,
        extractedProducts,
        rawTextPreview: text.slice(0, 4000),
      },
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