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

    // 🔥 כרגע רק נחזיר טקסט (בדיקה ראשונית)
    return res.status(200).json({
      success: true,
      parsedData: {
        fullName: "נבדק מתוך PDF",
        provider: "לא זוהה",
        productType: "פנסיה",
        balance: 100000,
        monthlyDeposit: 2000,
        rawTextPreview: text.slice(0, 1000),
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