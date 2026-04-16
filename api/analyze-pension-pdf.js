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

function pageBlocks(lines) {
  const pages = [];
  let current = [];

  for (const line of lines) {
    if (/^\d+$/.test(line) && current.length > 0) {
      pages.push(current);
      current = [];
      continue;
    }
    current.push(line);
  }

  if (current.length) pages.push(current);
  return pages;
}

function firstLineContaining(lines, phrase) {
  return lines.find((line) => line.includes(phrase)) || "";
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

// ✅ עמוד 1: לוקחים רק את טבלת המוצרים, וסוכמים אותה
function parsePage1(page1) {
  const products = [];

  for (const line of page1) {
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

  const cleanProducts = products.filter((p) => p.value > 0);
  const totalAssets = cleanProducts.reduce((sum, p) => sum + p.value, 0);

  return {
    totalAssets,
    products: cleanProducts,
  };
}

function parsePage3(page3) {
  const depositLine = firstLineContaining(page3, "הופקדו");
  const depositNums = numbersInLine(depositLine).filter((n) => n >= 1000);
  const monthlyDeposit = depositNums[0] || 0;

  const retirementSection = sectionBetween(
    page3,
    "כמה כסף יהיה לי בגיל הפרישה?",
    ["עכשיו... בואו נדבר", "מה יקרה אם", "כמה כסף יהיה לי אם לא אוכל לעבוד?"],
    25
  );

  const retirementNums = retirementSection
    .flatMap(numbersInLine)
    .filter((n) => n >= 1000);

  return {
    monthlyDeposit,
    lumpSumWithoutDeposits: retirementNums[0] || 0,
    monthlyPensionWithoutDeposits: retirementNums[1] || 0,
    lumpSumWithDeposits: retirementNums[2] || 0,
    monthlyPensionWithDeposits: retirementNums[3] || 0,
  };
}

function parsePage4(page4) {
  const disabilitySection = sectionBetween(
    page4,
    "כמה כסף יהיה לי אם לא אוכל לעבוד?",
    ["כמה כסף יהיה למשפחתי אם אמות?"],
    20
  );

  const disabilityNums = disabilitySection
    .flatMap(numbersInLine)
    .filter((n) => n >= 1000);

  const disabilityJoined = disabilitySection.join(" ");
  const percentMatch = disabilityJoined.match(/(\d{1,3})%/);

  const deathSection = sectionBetween(
    page4,
    "כמה כסף יהיה למשפחתי אם אמות?",
    [],
    25
  );

  const deathNums = deathSection
    .flatMap(numbersInLine)
    .filter((n) => n >= 1000);

  return {
    disabilityValue: disabilityNums[0] || 0,
    disabilityPercent: percentMatch ? extractNumber(percentMatch[1]) : 0,
    deathCoverage: deathNums[0] || 0,
  };
}

function parsePage5(page5) {
  let spouseCoverageMonthly = 0;
  let childCoverageMonthly = 0;

  for (const line of page5) {
    if (line.includes("לאישה / הבעל")) {
      const nums = numbersInLine(line).filter((n) => n >= 1000);
      spouseCoverageMonthly = nums[0] || spouseCoverageMonthly;
    }

    if (line.includes("לכל ילד")) {
      const nums = numbersInLine(line).filter((n) => n >= 1000);
      childCoverageMonthly = nums[0] || childCoverageMonthly;
    }
  }

  if (!spouseCoverageMonthly || !childCoverageMonthly) {
    const nums = page5.flatMap(numbersInLine).filter((n) => n >= 1000);
    if (nums.length >= 2) {
      spouseCoverageMonthly ||= Math.max(nums[0], nums[1]);
      childCoverageMonthly ||= Math.min(nums[0], nums[1]);
    }
  }

  return { spouseCoverageMonthly, childCoverageMonthly };
}

function parsePage7(page7) {
  let insuranceCostMonthly = 0;
  let lifeInsuranceCostMonthly = 0;
  let annualManagementFees = 0;

  for (const line of page7) {
    if (line.includes("עלות חודשית אבדן כושר עבודה")) {
      const nums = numbersInLine(line);
      insuranceCostMonthly = nums[nums.length - 1] || 0;
    }

    if (line.includes("עלות חודשית ביטוח חיים")) {
      const nums = numbersInLine(line);
      lifeInsuranceCostMonthly = nums[nums.length - 1] || 0;
    }

    if (
      line.includes("החודשים האחרונים שילמת") ||
      line.includes("החודשים האחרונים שילם")
    ) {
      const nums = numbersInLine(line);
      annualManagementFees = nums[nums.length - 1] || 0;
    }
  }

  return {
    insuranceCostMonthly,
    lifeInsuranceCostMonthly,
    annualManagementFees,
  };
}

function parsePage8(page8) {
  const joined = page8.join(" ");
  const percents = (joined.match(/\d+(?:\.\d+)?%/g) || []).map((p) =>
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
    const pages = pageBlocks(lines);

    const page1 = pages[0] || [];
    const page3 = pages[2] || [];
    const page4 = pages[3] || [];
    const page5 = pages[4] || [];
    const page7 = pages[6] || [];
    const page8 = pages[7] || [];

    const p1 = parsePage1(page1);
    const p3 = parsePage3(page3);
    const p4 = parsePage4(page4);
    const p5 = parsePage5(page5);
    const p7 = parsePage7(page7);
    const p8 = parsePage8(page8);

    const parsedData = {
      owner: owner || "self",
      fileName: fileName || "",
      fullName: owner === "self" ? "בן זוג" : "בת זוג",
      provider: "מסלקה פנסיונית",
      productType: p1.products[0]?.name || "פנסיה",
      balance: p1.totalAssets || 0,
      monthlyDeposit: p3.monthlyDeposit || 0,
      monthlyPensionWithDeposits: p3.monthlyPensionWithDeposits || 0,
      monthlyPensionWithoutDeposits: p3.monthlyPensionWithoutDeposits || 0,
      lumpSumWithDeposits: p3.lumpSumWithDeposits || 0,
      lumpSumWithoutDeposits: p3.lumpSumWithoutDeposits || 0,
      managementFeeBalance: p8.managementFeeBalance || 0,
      managementFeeDeposit: p8.managementFeeDeposit || 0,
      managementFeeProfit: p8.managementFeeProfit || 0,
      annualManagementFees: p7.annualManagementFees || 0,
      disabilityValue: p4.disabilityValue || 0,
      disabilityPercent: p4.disabilityPercent || 0,
      lifeCoverage: p4.deathCoverage || 0,
      deathCoverage: p4.deathCoverage || 0,
      spouseCoverageMonthly: p5.spouseCoverageMonthly || 0,
      childCoverageMonthly: p5.childCoverageMonthly || 0,
      insuranceCostMonthly: p7.insuranceCostMonthly || 0,
      lifeInsuranceCostMonthly: p7.lifeInsuranceCostMonthly || 0,
      trackName: "כללי",
      equityPercent: 45,
      extractedProducts: p1.products || [],
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