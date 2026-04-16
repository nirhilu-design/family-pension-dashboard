import pdfParse from "pdf-parse";

function extractNumber(str) {
  if (!str) return 0;
  return Number(String(str).replace(/[^\d]/g, "")) || 0;
}

function splitLines(text) {
  return String(text || "")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function numbersInLine(line) {
  return (line.match(/[\d,]+/g) || []).map(extractNumber).filter(Boolean);
}

function sectionBetween(lines, startPhrase, endPhrases = [], maxLines = 40) {
  const start = lines.findIndex((l) => l.includes(startPhrase));
  if (start === -1) return [];

  let end = Math.min(lines.length, start + maxLines);
  for (let i = start + 1; i < Math.min(lines.length, start + maxLines); i++) {
    if (endPhrases.some((p) => lines[i].includes(p))) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end);
}

function parseTotalAssets(lines) {
  const line = lines.find((l) => l.includes("צברת"));
  if (!line) return 0;

  const nums = numbersInLine(line).filter((n) => n >= 100000);
  return nums.length ? nums[0] : 0;
}

function parseProducts(lines) {
  const section = sectionBetween(
    lines,
    "סוג המוצר",
    ["חלוקה לפי מוצר", "חלוקה לפי חברה", "כמה כסף מופקד עבורי?"],
    20
  );

  const products = [];

  for (const line of section) {
    const nums = numbersInLine(line);
    if (!nums.length) continue;
    const value = nums[nums.length - 1];

    if (line.includes("פנסיה חדשה מקיפה")) {
      products.push({ name: "פנסיה חדשה מקיפה", value });
    } else if (line.includes("פנסיה כללית מקיפה")) {
      products.push({ name: "פנסיה כללית מקיפה", value });
    } else if (line.includes("קופת גמל")) {
      products.push({ name: "קופות גמל", value });
    } else if (line.includes("קרן השתלמות")) {
      products.push({ name: "קרנות השתלמות", value });
    } else if (line.includes("גמל להשקעה")) {
      products.push({ name: "גמל להשקעה", value });
    }
  }

  return products.filter((p) => p.value > 0);
}

function parseMonthlyDeposit(lines) {
  const line = lines.find((l) => l.includes("הופקדו"));
  if (!line) return 0;

  const nums = numbersInLine(line).filter((n) => n >= 1000);
  return nums.length ? nums[0] : 0;
}

function parseRetirement(lines) {
  const section = sectionBetween(
    lines,
    "כמה כסף יהיה לי בגיל הפרישה?",
    ["עכשיו... בואו נדבר", "מה יקרה אם", "כמה כסף יהיה לי אם לא אוכל לעבוד?"],
    25
  );

  const nums = section
    .flatMap(numbersInLine)
    .filter((n) => n >= 1000);

  return {
    lumpSumWithoutDeposits: nums[0] || 0,
    monthlyPensionWithoutDeposits: nums[1] || 0,
    lumpSumWithDeposits: nums[2] || 0,
    monthlyPensionWithDeposits: nums[3] || 0,
  };
}

function parseDisability(lines) {
  const section = sectionBetween(
    lines,
    "כמה כסף יהיה לי אם לא אוכל לעבוד?",
    ["כמה כסף יהיה למשפחתי אם אמות?", "בנוסף לסכום ההוני"],
    20
  );

  const nums = section
    .flatMap(numbersInLine)
    .filter((n) => n >= 1000);

  const joined = section.join(" ");
  const percentMatch = joined.match(/(\d{1,3})%/);

  return {
    disabilityValue: nums[0] || 0,
    disabilityPercent: percentMatch ? extractNumber(percentMatch[1]) : 0,
  };
}

function parseDeathCoverage(lines) {
  const section = sectionBetween(
    lines,
    "כמה כסף יהיה למשפחתי אם אמות?",
    ["בנוסף לסכום ההוני", "רוצה לשמוע על התשואות שלך?", "אז כמה כל זה עולה לי?"],
    25
  );

  const nums = section
    .flatMap(numbersInLine)
    .filter((n) => n >= 1000);

  return nums[0] || 0;
}

function parseFamilyCoverage(lines) {
  const section = sectionBetween(
    lines,
    "בנוסף לסכום ההוני",
    ["רוצה לשמוע על התשואות שלך?", "אז כמה כל זה עולה לי?"],
    20
  );

  let spouseCoverageMonthly = 0;
  let childCoverageMonthly = 0;

  for (const line of section) {
    if (line.includes("לאישה / הבעל")) {
      spouseCoverageMonthly = numbersInLine(line).find((n) => n >= 1000) || 0;
    }
    if (line.includes("לכל ילד")) {
      childCoverageMonthly = numbersInLine(line).find((n) => n >= 1000) || 0;
    }
  }

  if (!spouseCoverageMonthly || !childCoverageMonthly) {
    const nums = section.flatMap(numbersInLine).filter((n) => n >= 1000);
    if (nums.length >= 2) {
      spouseCoverageMonthly ||= Math.max(nums[0], nums[1]);
      childCoverageMonthly ||= Math.min(nums[0], nums[1]);
    }
  }

  return { spouseCoverageMonthly, childCoverageMonthly };
}

function parseInsuranceCosts(lines) {
  const section = sectionBetween(
    lines,
    "אז כמה כל זה עולה לי?",
    ["כמה דמי ניהול אני משלם?", "כמה דמי ניהול אני משלמת?"],
    40
  );

  let insuranceCostMonthly = 0;
  let lifeInsuranceCostMonthly = 0;

  for (const line of section) {
    if (line.includes("עלות חודשית אבדן כושר עבודה")) {
      const nums = numbersInLine(line);
      insuranceCostMonthly = nums[nums.length - 1] || 0;
    }
    if (line.includes("עלות חודשית ביטוח חיים")) {
      const nums = numbersInLine(line);
      lifeInsuranceCostMonthly = nums[nums.length - 1] || 0;
    }
  }

  return { insuranceCostMonthly, lifeInsuranceCostMonthly };
}

function parseAnnualManagementFees(lines) {
  const line =
    lines.find((l) => l.includes("החודשים האחרונים שילמת")) ||
    lines.find((l) => l.includes("החודשים האחרונים שילם"));

  if (!line) return 0;
  const nums = numbersInLine(line);
  return nums[nums.length - 1] || 0;
}

function parseManagementFeeRates(lines) {
  const section = sectionBetween(lines, "דמי ניהול מצבירה", [], 30);
  const percents = (section.join(" ").match(/\d+(?:\.\d+)?%/g) || []).map((p) =>
    Number(p.replace("%", ""))
  );

  return {
    managementFeeBalance: percents[0] || 0,
    managementFeeDeposit: percents[1] || 0,
    managementFeeProfit: percents[2] || 0,
  };
}

function detectLoans(rawText) {
  return /הלוואה|הלוואות/.test(rawText);
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
    const rawText = String(pdfData.text || "");
    const lines = splitLines(rawText);

    const balance = parseTotalAssets(lines);
    const extractedProducts = parseProducts(lines);
    const monthlyDeposit = parseMonthlyDeposit(lines);
    const retirement = parseRetirement(lines);
    const disability = parseDisability(lines);
    const deathCoverage = parseDeathCoverage(lines);
    const familyCoverage = parseFamilyCoverage(lines);
    const insuranceCosts = parseInsuranceCosts(lines);
    const annualManagementFees = parseAnnualManagementFees(lines);
    const feeRates = parseManagementFeeRates(lines);

    const parsedData = {
      owner: owner || "self",
      fileName: fileName || "",
      fullName: owner === "self" ? "בן זוג" : "בת זוג",
      provider: "מסלקה פנסיונית",
      productType: extractedProducts[0]?.name || "פנסיה",
      balance,
      monthlyDeposit,
      monthlyPensionWithDeposits: retirement.monthlyPensionWithDeposits,
      monthlyPensionWithoutDeposits: retirement.monthlyPensionWithoutDeposits,
      lumpSumWithDeposits: retirement.lumpSumWithDeposits,
      lumpSumWithoutDeposits: retirement.lumpSumWithoutDeposits,
      managementFeeBalance: feeRates.managementFeeBalance,
      managementFeeDeposit: feeRates.managementFeeDeposit,
      managementFeeProfit: feeRates.managementFeeProfit,
      annualManagementFees,
      disabilityValue: disability.disabilityValue,
      disabilityPercent: disability.disabilityPercent,
      lifeCoverage: deathCoverage,
      deathCoverage,
      spouseCoverageMonthly: familyCoverage.spouseCoverageMonthly,
      childCoverageMonthly: familyCoverage.childCoverageMonthly,
      insuranceCostMonthly: insuranceCosts.insuranceCostMonthly,
      lifeInsuranceCostMonthly: insuranceCosts.lifeInsuranceCostMonthly,
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