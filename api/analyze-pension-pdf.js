import pdf from "pdf-parse";

function cleanText(text) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMoney(str) {
  if (!str) return 0;
  return Number(str.replace(/,/g, "").replace(/[^\d]/g, ""));
}

function extractAllNumbers(text) {
  return [...text.matchAll(/([\d,]{3,})/g)].map((m) => ({
    value: parseMoney(m[1]),
    index: m.index,
  }));
}

function findClosestKeyword(text, index) {
  const window = text.slice(Math.max(0, index - 40), index + 40);

  if (/פנסיה/.test(window)) return "פנסיה";
  if (/גמל/.test(window)) return "קופות גמל";
  if (/השתלמות/.test(window)) return "קרנות השתלמות";

  return null;
}

function extractProducts(text) {
  const numbers = extractAllNumbers(text);

  const result = {
    "פנסיה": 0,
    "קופות גמל": 0,
    "קרנות השתלמות": 0,
  };

  numbers.forEach((num) => {
    const type = findClosestKeyword(text, num.index);

    if (type && num.value > 1000) {
      result[type] += num.value;
    }
  });

  return Object.entries(result)
    .filter(([_, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

function extractTotal(text) {
  const match = text.match(/([\d,]{5,})\s*₪?\s*צברת/);

  if (match) {
    return parseMoney(match[1]);
  }

  // fallback - הכי גדול במסמך
  const numbers = extractAllNumbers(text).map((n) => n.value);
  return Math.max(...numbers, 0);
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
    const text = cleanText(pdfData.text || "");

    const products = extractProducts(text);
    const totalAssets = extractTotal(text);

    return res.status(200).json({
      success: true,
      parsedData: {
        fullName: "מזוהה מהדוח",
        provider: "מסלקה פנסיונית",
        productType: "פנסיה",
        balance: totalAssets,
        monthlyDeposit: 0,
        extractedProducts: products,
        trackName: "כללי",
        equityPercent: 45,
        rawTextPreview: text.slice(0, 4000),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "שגיאה בקריאת PDF",
    });
  }
}