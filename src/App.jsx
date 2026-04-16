import pdfParse from "pdf-parse";

function extractNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, "");
  return Number(cleaned) || 0;
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function splitLines(text) {
  return normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function findIndex(lines, phrase) {
  return lines.findIndex((line) => line.includes(phrase));
}

function findSection(lines, startPhrase, endPhrases = [], maxLines = 30) {
  const start = findIndex(lines, startPhrase);
  if (start === -1) return [];

  let end = Math.min(lines.length, start + maxLines);

  for (let i = start + 1; i < Math.min(lines.length, start + maxLines); i++) {
    if (endPhrases.some((phrase) => lines[i].includes(phrase))) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end);
}

function firstNumberInLine(line) {
  const match = line.match(/[\d,]+/);
  return match ? extractNumber(match[0]) : 0;
}

function lastNumberInLine(line) {
  const matches = line.match(/[\d,]+/g);
  return matches && matches.length ? extractNumber(matches[matches.length - 1]) : 0;
}

function largestNumberInTextBlock(text) {
  const matches = String(text || "").match(/[\d,]+/g) || [];
  const nums = matches.map(extractNumber).filter((n) => n > 0);
  return nums.length ? Math.max(...nums) : 0;
}

function parseTotalAssets(lines, rawText) {
  // הכי יציב: שורה עם "צברת"
  for (const line of lines) {
    if (line.includes("צברת")) {
      const nums = line.match(/[\d,]+/g) || [];
      const big = nums.map(extractNumber).filter((n) => n >= 100000);
      if (big.length) return big[big.length - 1];
    }
  }

  // fallback: בלוק סביב "חיסכון פנסיוני"
  const section = findSection(lines, "חיסכון פנסיוני", ["חלוקה לפי מוצר", "כמה כסף מופקד עבורי?"], 20);
  const joined = section.join(" ");
  return largestNumberInTextBlock(joined || rawText);
}

function parseProducts(lines) {
  const section = findSection(
    lines,
    "סוג המוצר",
    ["חלוקה לפי מוצר", "חלוקה לפי חברה", "כמה כסף מופקד עבורי?"],
    20
  );

  const products = [];
  const seen = new Set();

  for (const line of section) {
    const value = lastNumberInLine(line);
    if (!value) continue;

    if (line.includes("פנסיה חדשה מקיפה")) {
      const key = `pension-new-${value}`;
      if (!seen.has(key)) {
        products.push({ name: "פנסיה חדשה מקיפה", value });
        seen.add(key);
      }
    } else if (line.includes("פנסיה כללית מקיפה")) {
      const key = `pension-general-${value}`;
      if (!seen.has(key)) {
        products.push({ name: "פנסיה כללית מקיפה", value });
        seen.add(key);
      }
    } else if (line.includes("קופת גמל")) {
      const key = `gemel-${value}`;
      if (!seen.has(key)) {
        products.push({ name: "קופות גמל", value });
        seen.add(key);
      }
    } else if (line.includes("קרן השתלמות")) {
      const key = `hishtalmut-${value}`;
      if (!seen.has(key)) {
        products.push({ name: "קרנות השתלמות", value });
        seen.add(key);
      }
    } else if (line.includes("גמל להשקעה")) {
      const key = `invest-gemel-${value}`;
      if (!seen.has(key)) {
        products.push({ name: "גמל להשקעה", value });
        seen.add(key);
      }
    }
  }

  return products;
}

function parseMonthlyDeposit(lines) {
  for (const line of lines) {
    if (line.includes("הופקדו")) {
      const nums = line.match(/[\d,]+/g) || [];
      const big = nums.map(extractNumber).filter((n) => n >= 1000);
      if (big.length) return big[0];
    }
  }

  const section = findSection(lines, "כמה כסף מופקד עבורי?", ["כמה כסף יהיה לי בגיל הפרישה?"], 20);
  const joined = section.join(" ");
  const nums = joined.match(/[\d,]+/g) || [];
  const values = nums.map(extractNumber).filter((n) => n >= 1000);
  return values.length ? values[0] : 0;
}

function parseRetirement(lines) {
  const section = findSection(
    lines,
    "כמה כסף יהיה לי בגיל הפרישה?",
    ["עכשיו... בואו נדבר", "מה יקרה אם", "כמה כסף יהיה לי אם לא אוכל לעבוד?"],
    25
  );

  const joined = section.join(" ");
  const nums = (joined.match(/[\d,]+/g) || [])
    .map(extractNumber)
    .filter((n) => n >= 1000);

  // במבנה של הדוח:
  // ללא הפקדות: סכום חד פעמי, קצבה חודשית
  // עם הפקדות: סכום חד פעמי, קצבה חודשית
  return {
    lumpSumWithoutDeposits: nums[0] || 0,
    monthlyPensionWithoutDeposits: nums[1] || 0,
    lumpSumWithDeposits: nums[2] || 0,
    monthlyPensionWithDeposits: nums[3] || 0,
  };
}

function parseDisability(lines) {
  const section = findSection(
    lines,
    "כמה כסף יהיה לי אם לא אוכל לעבוד?",
    ["כמה כסף יהיה למשפחתי אם אמות?", "בנוסף לסכום ההוני"],
    20
  );
  const joined = section.join(" ");
  const nums = (joined.match(/[\d,]+/g) || [])
    .map(extractNumber)
    .filter((n) => n >= 1000);

  return nums.length ? nums[0] : 0;
}

function parseDisabilityPercent(lines) {
  const section = findSection(
    lines,
    "כמה כסף יהיה לי אם לא אוכל לעבוד?",
    ["כמה כסף יהיה למשפחתי אם אמות?", "בנוסף לסכום ההוני"],
    20
  );
  const joined = section.join(" ");
  const match = joined.match(/(\d{1,3})%/);
  return match ? extractNumber(match[1]) : 0;
}

function parseDeathCoverage(lines) {
  const section = findSection(
    lines,
    "כמה כסף יהיה למשפחתי אם אמות?",
    ["בנוסף לסכום ההוני", "רוצה לשמוע על התשואות שלך?", "אז כמה כל זה עולה לי?"],
    25
  );
  const joined = section.join(" ");
  const nums = (joined.match(/[\d,]+/g) || [])
    .map(extractNumber)
    .filter((n) => n >= 1000);

  return nums.length ? nums[0] : 0;
}

function parseSpouseChildCoverage(lines) {
  const section = findSection(
    lines,
    "בנוסף לסכום ההוני",
    ["רוצה לשמוע על התשואות שלך?", "אז כמה כל זה עולה לי?"],
    20
  );

  let spouseCoverageMonthly = 0;
  let childCoverageMonthly = 0;

  for (const line of section) {
    if (line.includes("לאישה / הבעל")) {
      spouseCoverageMonthly = firstNumberInLine(line) || spouseCoverageMonthly;
    }
    if (line.includes("לכל ילד")) {
      childCoverageMonthly = firstNumberInLine(line) || childCoverageMonthly;
    }
  }

  if (!spouseCoverageMonthly || !childCoverageMonthly) {
    const joined = section.join(" ");
    const nums = (joined.match(/[\d,]+/g) || [])
      .map(extractNumber)
      .filter((n) => n >= 1000);

    // בעמוד 5 לרוב מופיעים קודם 36,180 ואז 24,120 / או בשורה מסכמת 24,120 ואז 36,180
    if (!spouseCoverageMonthly && nums.length >= 2) {
      spouseCoverageMonthly = Math.max(nums[0], nums[1]);
    }
    if (!childCoverageMonthly && nums.length >= 2) {
      childCoverageMonthly = Math.min(nums[0], nums[1]);
    }
  }

  return { spouseCoverageMonthly, childCoverageMonthly };
}

function parseInsuranceCosts(lines) {
  const section = findSection(
    lines,
    "אז כמה כל זה עולה לי?",
    ["כמה דמי ניהול אני משלם?", "כמה דמי ניהול אני משלמת?"],
    40
  );

  let insuranceCostMonthly = 0;
  let lifeInsuranceCostMonthly = 0;

  for (const line of section) {
    if (line.includes("עלות חודשית אבדן כושר עבודה") || line.includes("פנסיית נכות")) {
      const nums = line.match(/[\d,]+/g) || [];
      const values = nums.map(extractNumber).filter((n) => n > 0);
      if (values.length) insuranceCostMonthly = values[values.length - 1];
    }

    if (line.includes("עלות חודשית ביטוח חיים") || line.includes("ביטוח שארים")) {
      const nums = line.match(/[\d,]+/g) || [];
      const values = nums.map(extractNumber).filter((n) => n > 0);
      if (values.length) lifeInsuranceCostMonthly = values[values.length - 1];
    }
  }

  return { insuranceCostMonthly, lifeInsuranceCostMonthly };
}

function parseAnnualManagementFees(lines) {
  for (const line of lines) {
    if (
      line.includes("12- החודשים האחרונים שילמת") ||
      line.includes("12- החודשים האחרונים שילמת") ||
      line.includes("12- החודשים האחרונים שילם")
    ) {
      const nums = line.match(/[\d,]+/g) || [];
      const values = nums.map(extractNumber).filter((n) => n >= 1);
      if (values.length) return values[values.length - 1];
    }
  }

  const section = findSection(
    lines,
    "כמה דמי ניהול אני משלם?",
    ["ממוצע דמי ניהול", "היות וסוגיית דמי הניהול"],
    20
  );
  return largestNumberInTextBlock(section.join(" "));
}

function parseManagementFeeRates(lines) {
  const section = findSection(
    lines,
    "דמי ניהול מצבירה",
    [],
    30
  );

  const rates = {
    managementFeeBalance: 0,
    managementFeeDeposit: 0,
    managementFeeProfit: 0,
  };

  const percents = (section.join(" ").match(/\d+(?:\.\d+)?%/g) || []).map((p) =>
    Number(p.replace("%", ""))
  );

  if (percents.length) {
    rates.managementFeeBalance = percents[0] || 0;
    rates.managementFeeDeposit = percents[1] || 0;
    rates.managementFeeProfit = percents[2] || 0;
  }

  return rates;
}

function detectLoans(rawText) {
  return /הלוואה|הלוואות/.test(rawText);
}

function inferProvider(products) {
  if (!products.length) return "לא זוהה";
  return "מסלקה פנסיונית";
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
    const rawText = normalizeText(pdfData.text || "");
    const lines = splitLines(pdfData.text || "");

    const balance = parseTotalAssets(lines, rawText);
    const monthlyDeposit = parseMonthlyDeposit(lines);
    const retirement = parseRetirement(lines);
    const disabilityValue = parseDisability(lines);
    const disabilityPercent = parseDisabilityPercent(lines);
    const deathCoverage = parseDeathCoverage(lines);
    const { spouseCoverageMonthly, childCoverageMonthly } = parseSpouseChildCoverage(lines);
    const { insuranceCostMonthly, lifeInsuranceCostMonthly } = parseInsuranceCosts(lines);
    const annualManagementFees = parseAnnualManagementFees(lines);
    const feeRates = parseManagementFeeRates(lines);
    const extractedProducts = parseProducts(lines);

    const parsedData = {
      owner: owner || "self",
      fileName: fileName || "",
      fullName: owner === "self" ? "בן זוג" : "בת זוג",
      provider: inferProvider(extractedProducts),
      productType: extractedProducts[0]?.name || "פנסיה",
      balance,
      monthlyDeposit,
      monthlyPensionWithDeposits: retirement.monthlyPensionWithDeposits,
      monthlyPensionWithoutDeposits: retirement.monthlyPensionWithoutDeposits,
      lumpSumWithDeposits: retirement.lumpSumWithDeposits,
      lumpSumWithoutDeposits: retirement.lumpSumWithoutDeposits,
      managementFeeBalance: feeRates.managementFeeBalance || 0,
      managementFeeDeposit: feeRates.managementFeeDeposit || 0,
      managementFeeProfit: feeRates.managementFeeProfit || 0,
      annualManagementFees: annualManagementFees || 0,
      disabilityValue: disabilityValue || 0,
      disabilityPercent: disabilityPercent || 0,
      lifeCoverage: deathCoverage || 0,
      deathCoverage: deathCoverage || 0,
      spouseCoverageMonthly: spouseCoverageMonthly || 0,
      childCoverageMonthly: childCoverageMonthly || 0,
      insuranceCostMonthly: insuranceCostMonthly || 0,
      lifeInsuranceCostMonthly: lifeInsuranceCostMonthly || 0,
      trackName: "כללי",
      equityPercent: 45,
      extractedProducts,
      hasLoans: detectLoans(rawText),
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