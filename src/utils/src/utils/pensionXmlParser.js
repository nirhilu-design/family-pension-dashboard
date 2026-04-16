function parsePolicy(policyNode) {
  const budgets = policyNode.querySelector("Budgets");
  const covers = policyNode.querySelector("Covers");
  const save = policyNode.querySelector("Save");
  const details = policyNode.querySelector("PolicyDetails");

  const sectionRoots = [budgets, covers, save, details];

  const productType = pickFirstText(sectionRoots, "ProposeName2");
  const totalRisk = parseNumber(getText(covers || policyNode, "TotalRisk"));
  const pensionDisability = parseNumber(getText(covers || policyNode, "PensionDisability"));
  const totalMonthlyCoverCost = parseNumber(getText(covers || policyNode, "TotalSum"));
  const rawTotalInsurance = parseNumber(getText(covers || policyNode, "TotalBituah"));

  const isPureSavingsProduct =
    productType === "קופת גמל" ||
    productType === "קרן השתלמות" ||
    productType === "גמל להשקעה";

  const hasRealInsuranceSignals =
    totalRisk !== null ||
    pensionDisability !== null ||
    totalMonthlyCoverCost !== null;

  const normalizedInsurance =
    isPureSavingsProduct && !hasRealInsuranceSignals ? null : rawTotalInsurance;

  return {
    rowNum: Number(policyNode.getAttribute("RowNum") || 0),
    policyNo: pickFirstText(sectionRoots, "PolicyNo"),
    productType,
    planName: pickFirstText(sectionRoots, "PlanName"),
    memberType: pickFirstText([budgets, save], "MemberTypeName"),
    joinDate: pickFirstText(sectionRoots, "JoinDate") || null,
    dateOfRights: pickFirstText(sectionRoots, "DateOfRights") || null,
    salary: parseNumber(getText(budgets || policyNode, "Salary")),

    monthlyDeposits: {
      worker: parseNumber(getText(budgets || policyNode, "TotalTagWorker")),
      employer: parseNumber(getText(budgets || policyNode, "TotalTagEmployer")),
      compensation: parseNumber(getText(budgets || policyNode, "TotalCompensetion")),
      sumCost: parseNumber(getText(budgets || policyNode, "SumCost")),
      disabilityWorkerCost: parseNumber(getText(budgets || policyNode, "DisCost1")),
      disabilityEmployerCost: parseNumber(getText(budgets || policyNode, "DisCostEmployer1")),
      rateWorker: parseNumber(getText(budgets || policyNode, "RateTagWorker")),
      rateEmployer: parseNumber(getText(budgets || policyNode, "RateTagEmployer")),
      rateCompensation: parseNumber(getText(budgets || policyNode, "RateCompensetion")),
    },

    coverage: {
      totalInsurance: normalizedInsurance,
      totalRisk,
      disabilityPension: pensionDisability,
      disabilityCost: parseNumber(getText(covers || policyNode, "CostForDisability")),
      orphanPension: parseNumber(getText(covers || policyNode, "PensionOrphan")),
      widowPension: parseNumber(getText(covers || policyNode, "PensionAlmana")),
      relativesPension: parseNumber(getText(covers || policyNode, "PensionRelatives")),
      totalMonthlyCoverCost,
    },

    savings: {
      before2000: parseNumber(getText(save || policyNode, "ItraZvuraTotalTagBefore2000")),
      after2000: parseNumber(getText(save || policyNode, "ItraZvuraTotalTagAfter2000")),
      compensation: parseNumber(getText(save || policyNode, "ItraZvuraCompensetion")),
      totalAccumulated: parseNumber(getText(save || policyNode, "TotalItraZvura")),
      projectedRetirementBalance: parseNumber(getText(save || policyNode, "RetireCurrBalance")),
      projectedMonthlyPension: parseNumber(getText(save || policyNode, "PensionRetire")),
      totalRedemptions: parseNumber(getText(save || policyNode, "TotalPidions")),
      retireCurrBalancePension: parseNumber(getText(save || policyNode, "RetireCurrBalancePension")),
      hCoeff: parseNumber(getText(save || policyNode, "HCoff")),
    },

    details: {
      proposeName: getText(details || policyNode, "ProposeName"),
      targetPlan: getText(details || policyNode, "TargetPlan"),
      annuityType: getText(details || policyNode, "AnnuityType"),
      retireAge: parseIntSafe(getText(details || policyNode, "RetireAge")),
      agePremiaYear: parseIntSafe(getText(details || policyNode, "AgePremiaYear")),
      managementFeeFromDeposit: parseNumber(getText(details || policyNode, "DNihulPremia")),
      managementFeeFromBalance: parseNumber(getText(details || policyNode, "DNFromHon")),
      expectedReturn: parseNumber(getText(details || policyNode, "GetYield")),
    },

    investPlans: parseInvestPlans(policyNode),
  };
}