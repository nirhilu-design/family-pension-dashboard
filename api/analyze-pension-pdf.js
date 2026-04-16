import pdfParse from "pdf-parse";

function extractNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, "");
  return Number(cleaned) || 0;
}

function lineMatches(line, phrase) {
  return line.includes(phrase);
}

function findLineValue(lines, phrase) {
  const line = lines.find((l) => lineMatches(l, phrase));
  if (!line) return 0;

  const nums = line.match(/[\d,]+/g);
  if (!nums?.length) return 0;

  return extractNumber(nums[nums.length - 1]);
}

function findSectionAfter(lines, phrase, count = 10) {
  const idx = lines.findIndex((l) => l.includes(phrase));
  if (idx === -1) return [];
  return lines.slice(idx, idx + count);
}

function parseProducts(lines) {
  const section = findSectionAfter(lines, "סוג המוצר", 12);
  const products = [];

  section.forEach((line) => {
    if (line.includes("פנסיה חדשה מקיפה")) {
      products.push({
        name: "פנסיה חדשה מקיפה",
        value: findLineValue([line], "פנסיה חדשה מקיפה"),
      });
    }

    if (line.includes("פנסיה כללית מקיפה")) {
      products.push({
        name: "פנסיה כללית מקיפה",
        value: findLineValue([line], "פנסיה כללית מקיפה"),
      });
    }

    if (line.includes("קופת גמל")) {
      products.push({
        name: "קופות גמל",
        value: findLineValue([line], "קופת גמל"),
      });
    }

    if (line.includes("קרן השתלמות")) {
      products.push({
        name: "קרנות השתלמות",
        value: findLineValue([line], "קרן השתלמות"),
      });
    }

    if (line.includes("גמל להשקעה")) {
      products.push({
        name: "גמל להשקעה",
        value: findLineValue([line], "גמל להשקעה"),
      });
    }
  });

  return products.filter((p) => p.value > 0);
}

function findValueNearPhrase(text, phrase, window = 250) {
  const idx = text.indexOf(phrase);
  if (idx === -1) return 0;
  const slice = text.slice(idx, idx + window);
  const nums = slice.match(/[\d,]+/g);
  if (!nums?.length) return 0;
  return extractNumber(nums[0]);
}

function findAllNumbersNearPhrase(text, phrase, window = 500) {
  const idx = text.indexOf(phrase);
  if (idx === -1) return [];
  const slice = text.slice(idx, idx + window);
  const nums = slice.match(/[\d,]+/g);
  return nums ? nums.map(extractNumber).filter(Boolean) : [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { owner, fileName, fileBase64 } = req.body || {};

    if (!fileBase64) {
      return res.status(400).json({
        success: false,
        error: "לא התקבל קובץ לניתוח",
      });
    }

    const buffer = Buffer.from(fileBase64, "base64");
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text || "";
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const totalAssets =
      findValueNearPhrase(rawText, "צברת") ||
      findValueNearPhrase(rawText, "חיסכון פנסיוני");

    const monthlyDeposit = findValueNearPhrase(rawText, "הופקדו");
    const retirementNums = findAllNumbersNearPhrase(
      rawText,
      "כמה כסף יהיה לי בגיל הפרישה",
      800
    );

    const disabilityValue = findValueNearPhrase(rawText, "לא אוכל לעבוד");
    const deathCoverage = findValueNearPhrase(rawText, "אם אמות");
    const spouseCoverageMonthly = findValueNearPhrase(rawText, "לאישה / הבעל");
    const childCoverageMonthly = findValueNearPhrase(rawText, "לכל ילד");
    const insuranceCostMonthly = findValueNearPhrase(rawText, "אבדן כושר עבודה");
    const lifeInsuranceCostMonthly = findValueNearPhrase(rawText, "ביטוח חיים");
    const annualManagementFees = findValueNearPhrase(rawText, "דמי ניהול");

    const extractedProducts = parseProducts(lines);

    const parsedData = {
      owner: owner || "self",
      fileName: fileName || "",
      fullName: owner === "self" ? "בן זוג" : "בת זוג",
      provider: "מסלקה פנסיונית",
      productType: extractedProducts[0]?.name || "פנסיה",
      balance: totalAssets || 0,
      monthlyDeposit: monthlyDeposit || 0,
      monthlyPensionWithDeposits: retirementNums[3] || 0,
      monthlyPensionWithoutDeposits: retirementNums[1] || 0,
      lumpSumWithDeposits: retirementNums[2] || 0,
      lumpSumWithoutDeposits: retirementNums[0] || 0,
      managementFeeBalance: 0,
      managementFeeDeposit: 0,
      disabilityValue: disabilityValue || 0,
      disabilityPercent: 0,
      lifeCoverage: deathCoverage || 0,
      deathCoverage: deathCoverage || 0,
      spouseCoverageMonthly: spouseCoverageMonthly || 0,
      childCoverageMonthly: childCoverageMonthly || 0,
      insuranceCostMonthly: insuranceCostMonthly || 0,
      lifeInsuranceCostMonthly: lifeInsuranceCostMonthly || 0,
      annualManagementFees: annualManagementFees || 0,
      trackName: "כללי",
      equityPercent: 45,
      extractedProducts,
      rawTextPreview: rawText.slice(0, 4000),
    };

    return res.status(200).json({
      success: true,
      parsedData,
    });
  } catch (error) {
    console.error("PDF parse error:", error);

    return res.status(500).json({
      success: false,
      error: "שגיאה בניתוח PDF",
      details: error.message,
    });
  }
}