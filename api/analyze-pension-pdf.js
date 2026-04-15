export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    return res.status(200).json({
      success: true,
      message: "API is working",
      parsedData: {
        fullName: "נבדק מה-API",
        provider: "מנורה",
        productType: "פנסיה",
        balance: 123456,
        monthlyDeposit: 2500,
        monthlyPensionWithDeposits: 18000,
        monthlyPensionWithoutDeposits: 11000,
        lumpSumWithDeposits: 900000,
        lumpSumWithoutDeposits: 550000,
        managementFeeBalance: 0.49,
        managementFeeDeposit: 2.1,
        disabilityValue: 12000,
        disabilityPercent: 75,
        lifeCoverage: 400000,
        deathCoverage: 400000,
        trackName: "כללי / פנסיה",
        equityPercent: 45,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message,
    });
  }
}