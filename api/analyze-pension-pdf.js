import pdfParse from "pdf-parse";

function extractNumber(str) {
  if (!str) return 0;
  return Number(String(str).replace(/[^\d]/g, "")) || 0;
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractSection(text, startPhrase, endPhrases = []) {
  const start = text.indexOf(startPhrase);
  if (start === -1) return "";

  let end = text.length;
  for (const phrase of endPhrases) {
    const idx = text.indexOf(phrase, start + startPhrase.length);
    if (idx !== -1 && idx < end) end = idx;
  }

  return text.slice(start, end);
}

function findNumbers(text, min = 0) {
  return (String(text || "").match(/[\d,]+/g) || [])
    .map(extractNumber)
    .filter((n) => n >= min);
}

function findFirstLineContaining(lines, phrase) {
  return lines.find((line) => line.includes(phrase)) || "";
}

function splitLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseProductsFromBlock(block) {
  const lines = splitLines(block);
  const products = [];

  for (const line of lines) {
    const nums = findNumbers(line, 1);
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

function parsePage1Block(rawText) {
  const block = extractSection(rawText, "סוג המוצר", [
    "חלוקה לפי מוצר",
    "חלוקה לפי חברה",
    "כמה כסף מופקד עבורי?",
  ]);

  const products = parseProductsFromBlock(block);
  const totalAssets = products.reduce((sum, p) => sum + p.value, 0);

  return {
    totalAssets,
    products,
  };
}

function parseDepositBlock(rawText) {
  const block = extractSection(rawText, "כמה כסף מופקד עבורי?", [
    "כמה כסף יהיה לי בגיל הפרישה?",
  ]);

  const lines = splitLines(block);
  const depositLine = findFirstLineContaining(lines, "הופקדו");
  const depositNums = findNumbers(depositLine, 1000);

  return {
    monthlyDeposit: depositNums[0] || 0,
    rawBlock: block,
  };
}

function parseRetirementBlock(rawText) {
  const block = extractSection(rawText, "כמה כסף יהיה לי בגיל הפרישה?", [
    "כמה כסף יהיה לי אם לא אוכל לעבוד?",
    "עכשיו... בואו נדבר",
    "מה יקרה אם",
  ]);

  const nums = findNumbers(block, 1000);

  return {
    lumpSumWithoutDeposits: nums[0] || 0,
    monthlyPensionWithoutDeposits: nums[1] || 0,
    lumpSumWithDeposits: nums[2] || 0,
    monthlyPensionWithDeposits: nums[3] || 0,
  };
}

function parseDisabilityAndDeath(rawText) {
  const disabilityBlock = extractSection(rawText, "כמה כסף יהיה לי אם לא אוכל לעבוד?", [
    "כמה כסף יהיה למשפחתי אם אמות?",
  ]);

  const disabilityNums = findNumbers(disabilityBlock, 1000);
  const percentMatch = disabilityBlock.match(/(\d{1,3})%/);

  const deathBlock = extractSection(rawText, "כמה כסף יהיה למשפחתי אם אמות?", [
    "בנוסף לסכום ההוני",
    "רוצה לשמוע על התשואות שלך?",
    "אז כמה כל זה עולה לי?",
  ]);

  const deathNums = findNumbers(deathBlock, 1000);

  return {
    disabilityValue: disabilityNums[0] || 0,
    disabilityPercent: percentMatch ? extractNumber(percentMatch[1]) : 0,
    deathCoverage: deathNums[0] || 0,
  };
}

function parseFamilyCoverage(rawText) {
  const block = extractSection(rawText, "בנוסף לסכום ההוני", [
    "רוצה לשמוע על התשואות שלך?",
    "אז כמה כל זה עולה לי?",
  ]);

  const lines = splitLines(block);

  let spouseCoverageMonthly = 0;
  let childCoverageMonthly = 0;

  for (const line of lines) {
    if (line.includes("לאישה / הבעל")) {
      const nums = findNumbers(line, 1000);
      spouseCoverageMonthly = nums[0] || spouseCoverageMonthly;
    }

    if (line.includes("לכל ילד")) {
      const nums = findNumbers(line, 1000);
      childCoverageMonthly = nums[0] || childCoverageMonthly;
    }
  }

  if (!spouseCoverageMonthly || !childCoverageMonthly) {
    const nums = findNumbers(block, 1000);
    if (nums.length >= 2) {
      spouseCoverageMonthly ||= Math.max(nums[0], nums[1]);
      childCoverageMonthly ||= Math.min(nums[0], nums[1]);
    }
  }

  return {
    spouseCoverageMonthly,
    childCoverageMonthly,
  };
}

function parseCostsAndFees(rawText) {
  const costsBlock = extractSection(rawText, "אז כמה כל זה עולה לי?", [
    "היות וסוגיית דמי הניהול",
    "ישנם מספר סוגים של דמי ניהול",
  ]);

  const lines = splitLines(costsBlock);

  let insuranceCostMonthly = 0;
  let lifeInsuranceCostMonthly = 0;
  let annualManagementFees = 0;

  for (const line of lines) {
    if (line.includes("עלות חודשית אבדן כושר עבודה")) {
      const nums = findNumbers(line, 1);
      insuranceCostMonthly = nums[nums.length - 1] || 0;
    }

    if (line.includes("עלות חודשית ביטוח חיים")) {
      const nums = findNumbers(line, 1);
      lifeInsuranceCostMonthly = nums[nums.length - 1] || 0;
    }

    if (
      line.includes("החודשים האחרונים שילמת") ||
      line.includes("החודשים האחרונים שילם")
    ) {
      const nums = findNumbers(line, 1);
      annualManagementFees = nums[nums.length - 1] || 0;
    }
  }

  const feeDetailBlock = extractSection(rawText, "דמי ניהול מצבירה", []);

  const percents = (feeDetailBlock.match(/\d+(?:\.\d+)?%/g) || []).map((p) =>
    Number(p.replace("%", ""))
  );

  return {
    insuranceCostMonthly,
    lifeInsuranceCostMonthly,
    annualManagementFees,
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
    const rawText = normalizeText(pdfData.text || "");

    const page1 = parsePage1Block(rawText);
    const deposit = parseDepositBlock(rawText);
    const retirement = parseRetirementBlock(rawText);
    const disabilityDeath = parseDisabilityAndDeath(rawText);
    const familyCoverage = parseFamilyCoverage(rawText);
    const costsFees = parseCostsAndFees(rawText);

    const parsedData = {
      owner: owner || "self",
      fileName: fileName || "",
      fullName: owner === "self" ? "בן זוג" : "בת זוג",
      provider: "מסלקה פנסיונית",
      productType: page1.products[0]?.name || "פנסיה",
      balance: page1.totalAssets || 0,
      monthlyDeposit: deposit.monthlyDeposit || 0,
      monthlyPensionWithDeposits: retirement.monthlyPensionWithDeposits || 0,
      monthlyPensionWithoutDeposits: retirement.monthlyPensionWithoutDeposits || 0,
      lumpSumWithDeposits: retirement.lumpSumWithDeposits || 0,
      lumpSumWithoutDeposits: retirement.lumpSumWithoutDeposits || 0,
      managementFeeBalance: costsFees.managementFeeBalance || 0,
      managementFeeDeposit: costsFees.managementFeeDeposit || 0,
      managementFeeProfit: costsFees.managementFeeProfit || 0,
      annualManagementFees: costsFees.annualManagementFees || 0,
      disabilityValue: disabilityDeath.disabilityValue || 0,
      disabilityPercent: disabilityDeath.disabilityPercent || 0,
      lifeCoverage: disabilityDeath.deathCoverage || 0,
      deathCoverage: disabilityDeath.deathCoverage || 0,
      spouseCoverageMonthly: familyCoverage.spouseCoverageMonthly || 0,
      childCoverageMonthly: familyCoverage.childCoverageMonthly || 0,
      insuranceCostMonthly: costsFees.insuranceCostMonthly || 0,
      lifeInsuranceCostMonthly: costsFees.lifeInsuranceCostMonthly || 0,
      trackName: "כללי",
      equityPercent: 45,
      extractedProducts: page1.products || [],
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