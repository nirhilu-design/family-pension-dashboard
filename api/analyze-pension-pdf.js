import pdf from "pdf-parse";

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

    return res.status(200).json({
      success: true,
      parsedData: {
        fullName: "נבדק מתוך PDF",
        provider: "לא זוהה",
        productType: "פנסיה",
        balance: 100000,
        monthlyDeposit: 2000,
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