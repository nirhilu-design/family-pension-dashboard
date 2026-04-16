import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false,
  },
};

function extractNumber(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d]/g, "");
  return Number(cleaned) || 0;
}

function extractFirstNumberAfter(text, keyword) {
  const index = text.indexOf(keyword);
  if (index === -1) return 0;

  const slice = text.slice(index, index + 200);
  const match = slice.match(/[\d,]+/);

  return match ? extractNumber(match[0]) : 0;
}

function extractAllNumbersAfter(text, keyword) {
  const index = text.indexOf(keyword);
  if (index === -1) return [];

  const slice = text.slice(index, index + 400);
  const matches = slice.match(/[\d,]+/g);

  return matches ? matches.map(extractNumber) : [];
}

function parseProducts(text) {
  const sectionStart = text.indexOf("סוג המוצר");
  if (sectionStart === -1) return [];

  const slice = text.slice(sectionStart, sectionStart + 800);

  const lines = slice.split("\n");
  const products = [];

  lines.forEach((line) => {
    if (line.includes("₪")) {
      const parts = line.split("₪");
      const value = extractNumber(parts[0]);

      if (value > 0) {
        products.push({
          name: line.trim(),
          value,
        });
      }
    }
  });

  return products;
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

    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    console.log("PDF TEXT:", text);

    // =========================
    // 🧠 PARSING לפי מבנה קבוע
    // =========================

    const totalAssets = extractFirstNumberAfter(
      text,
      "חיסכון פנסיוני"
    );

    const monthlyDeposit = extractFirstNumberAfter(
      text,
      "הופקדו"
    );

    const retirementNumbers = extractAllNumbersAfter(
      text,
      "כמה כסף יהיה לי בגיל הפרישה"
    );

    const lumpSumWithoutDeposits = retirementNumbers[0] || 0;
    const monthlyPensionWithoutDeposits = retirementNumbers[1] || 0;
    const lumpSumWithDeposits = retirementNumbers[2] || 0;
    const monthlyPensionWithDeposits = retirementNumbers[3] || 0;

    const disabilityValue = extractFirstNumberAfter(
      text,
      "לא אוכל לעבוד"
    );

    const deathCoverage = extractFirstNumberAfter(
      text,
      "אם חלילה תמות"
    );

    const spouseCoverageMonthly = extractFirstNumberAfter(
      text,
      "לאישה / הבעל"
    );

    const childCoverageMonthly = extractFirstNumberAfter(
      text,
      "לכל ילד"
    );

    const insuranceCostMonthly = extractFirstNumberAfter(
      text,
      "אבדן כושר עבודה"
    );

    const lifeInsuranceCostMonthly = extractFirstNumberAfter(
      text,
      "ביטוח חיים"
    );

    const annualManagementFees = extractFirstNumberAfter(
      text,
      "דמי ניהול"
    );

    const products = parseProducts(text);

    // הלוואות (אופציונלי)
    const hasLoans =
      text.includes("הלוואה") || text.includes("הלוואות");

    const result = {
      totalAssets,
      monthlyDeposit,

      retirement: {
        lumpSumWithoutDeposits,
        monthlyPensionWithoutDeposits,
        lumpSumWithDeposits,
        monthlyPensionWithDeposits,
      },

      insurance: {
        disabilityValue,
        deathCoverage,
        spouseCoverageMonthly,
        childCoverageMonthly,
        insuranceCostMonthly,
        lifeInsuranceCostMonthly,
      },

      fees: {
        annualManagementFees,
      },

      products,

      loans: {
        hasLoans,
      },
    };

    return res.status(200).json({
      success: true,
      parsedData: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "שגיאה בניתוח PDF",
    });
  }
}