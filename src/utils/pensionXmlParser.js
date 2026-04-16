// src/utils/pensionXmlParser.js

function sanitizeXml(rawXml) {
  let text = rawXml;
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  text = text.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;");
  return text;
}

function parseXmlDocument(rawXml) {
  const sanitized = sanitizeXml(rawXml);
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, "application/xml");
  const parserError = doc.querySelector("parsererror");

  if (parserError) {
    throw new Error("XML parse error: " + parserError.textContent);
  }

  return doc;
}

function getFirst(root, tag) {
  return root.querySelector(tag);
}

function getText(root, tag) {
  return getFirst(root, tag)?.textContent?.trim() || "";
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "").trim();
}

function normalizeText(value) {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

function extractBirthDate(value) {
  const clean = normalizeText(value);
  const match = clean.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
  return match ? match[0] : null;
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;

  const clean = normalizeText(value)
    .replace(/₪/g, "")
    .replace(/%/g, "")
    .replace(/,/g, "")
    .trim();

  if (!clean || clean === "-" || clean === "לא פעילה") return null;

  const num = Number(clean);
  return Number.isFinite(num) ? num : null;
}

function parseIntSafe(value) {
  const num = parseNumber(value);
  return num === null ? null : Math.round(num);
}

function sumNullable(values) {
  return values.reduce((acc, val) => acc + (val ?? 0), 0);
}

function pickFirstText(sectionRoots, tag) {
  for (const section of sectionRoots) {
    if (!section) continue;
    const value = getText(section, tag);
    if (value) return value;
  }
  return "";
}

function parseInvestProperties(root, selector) {
  if (!root) return [];

  return Array.from(root.querySelectorAll(selector)).map((node) => ({
    id: getText(node, "PropertyID"),
    name: getText(node, "PropertyName"),
    rate: parseNumber(getText(node, "rate")),
  }));
}

function parseInvestPlans(policyNode) {
  const plansRoot = policyNode.querySelector("InvestPlans");
  if (!plansRoot) return [];

  const planNodes = Array.from(plansRoot.querySelectorAll("InvestPlan"));

  return planNodes.map((plan) => ({
    mofid: getText(plan, "MOFID"),
    proposeType: getText(plan, "ProposeType"),
    planName: getText(plan, "PlanName"),
    trackName: getText(plan, "PlanNameAfik"),
    avgRate12: parseNumber(getText(plan, "AvgRate12")),
    avgRate36: parseNumber(getText(plan, "AvgRate36")),
    avgRate60: parseNumber(getText(plan, "AvgRate60")),
    totalRate12: parseNumber(getText(plan, "RateTotal12Months")),
    totalRate36: parseNumber(getText(plan, "RateTotal36Months")),
    totalRate60: parseNumber(getText(plan, "RateTotal60Months")),
    standardDeviation36: parseNumber(getText(plan, "ST36Months")),
    sharp: parseNumber(getText(plan, "SharpAnaf")),
    directExpenses: parseNumber(getText(plan, "DirectExpences")),
    totalExpenses: parseNumber(getText(plan, "TotalExpenses")),
    mainGroups: parseInvestProperties(plan, "Properties > MainGroups > Property"),
    exposures: parseInvestProperties(plan, "Properties > Exposures > Property"),
  }));
}

function parsePolicy(policyNode) {
  const budgets = policyNode.querySelector("Budgets");
  const covers = policyNode.querySelector("Covers");
  const save = policyNode.querySelector("Save");
  const details = policyNode.querySelector("PolicyDetails");

  const sectionRoots = [budgets, covers, save, details];
  const productType = pickFirstText(sectionRoots, "ProposeName2");

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
      totalInsurance: parseNumber(getText(covers || policyNode, "TotalBituah")),
      totalRisk: parseNumber(getText(covers || policyNode, "TotalRisk")),
      disabilityPension: parseNumber(getText(covers || policyNode, "PensionDisability")),
      disabilityCost: parseNumber(getText(covers || policyNode, "CostForDisability")),
      orphanPension: parseNumber(getText(covers || policyNode, "PensionOrphan")),
      widowPension: parseNumber(getText(covers || policyNode, "PensionAlmana")),
      relativesPension: parseNumber(getText(covers || policyNode, "PensionRelatives")),
      totalMonthlyCoverCost: parseNumber(getText(covers || policyNode, "TotalSum")),
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

function parseSummary(doc) {
  const budget = doc.querySelector("Summary > Budget");
  const cover = doc.querySelector("Summary > Cover");
  const brutoSave = doc.querySelector("Summary > Save > Bruto");

  return {
    budget: {
      worker: parseNumber(getText(budget || doc, "TotalTagWorker")),
      employer: parseNumber(getText(budget || doc, "TotalTagEmployer")),
      compensation: parseNumber(getText(budget || doc, "TotalCompensetion")),
      sumCost: parseNumber(getText(budget || doc, "SumCost")),
      disabilityWorkerCost: parseNumber(getText(budget || doc, "DisCost1")),
      disabilityEmployerCost: parseNumber(getText(budget || doc, "DisCostEmployer1")),
    },
    cover: {
      totalInsurance: parseNumber(getText(cover || doc, "TotalBituah")),
      totalRisk: parseNumber(getText(cover || doc, "TotalRisk")),
      disabilityPension: parseNumber(getText(cover || doc, "PensionDisability")),
      disabilityCost: parseNumber(getText(cover || doc, "CostForDisability")),
      orphanPension: parseNumber(getText(cover || doc, "PensionOrphan")),
      widowPension: parseNumber(getText(cover || doc, "PensionAlmana")),
      relativesPension: parseNumber(getText(cover || doc, "PensionRelatives")),
      totalMonthlyCoverCost: parseNumber(getText(cover || doc, "TotalSum")),
    },
    save: {
      totalAccumulated: parseNumber(getText(brutoSave || doc, "TotalItraZvura")),
      projectedRetirementBalance: parseNumber(getText(brutoSave || doc, "RetireCurrBalance")),
      projectedMonthlyPension: parseNumber(getText(brutoSave || doc, "PensionRetire")),
      totalRedemptions: parseNumber(getText(brutoSave || doc, "TotalPidions")),
      retireCurrBalancePension: parseNumber(getText(brutoSave || doc, "RetireCurrBalancePension")),
      before2000: parseNumber(getText(brutoSave || doc, "ItraZvuraTotalTagBefore2000")),
      after2000: parseNumber(getText(brutoSave || doc, "ItraZvuraTotalTagAfter2000")),
      compensation: parseNumber(getText(brutoSave || doc, "ItraZvuraCompensetion")),
    },
  };
}

export function parsePensionXml(rawXml) {
  const doc = parseXmlDocument(rawXml);

  const memberNode = doc.querySelector("MemberDetails");
  if (!memberNode) {
    throw new Error("MemberDetails not found in XML");
  }

  const firstName = normalizeText(getText(memberNode, "FirstName"));
  const lastName = normalizeText(getText(memberNode, "FamilyName"));

  const member = {
    id: normalizeText(getText(memberNode, "ID")),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    birthDate: extractBirthDate(getText(memberNode, "BirthDate")),
    familyStatus: normalizeText(getText(memberNode, "FamilyStatus")),
    gender: normalizeText(getText(memberNode, "Gender")),
    isSmoking: normalizeText(getText(memberNode, "IsSmoking")),
    companyName: normalizeText(getText(memberNode, "CompanyName")),
    income: parseNumber(getText(memberNode, "Income")),
  };

  const policyNodes = Array.from(doc.querySelectorAll("Policies > Policy"));
  const policies = policyNodes.map(parsePolicy).sort((a, b) => a.rowNum - b.rowNum);

  const summary = parseSummary(doc);

  return {
    member,
    policies,
    summary,
  };
}

export async function parsePensionXmlFile(file) {
  const rawXml = await file.text();
  return parsePensionXml(rawXml);
}

export async function parseMultiplePensionXmlFiles(files) {
  return Promise.all(files.map(parsePensionXmlFile));
}

export function buildFamilyDashboardData(members) {
  const flatPolicies = members.flatMap((memberFile) =>
    memberFile.policies.map((policy) => ({
      ...policy,
      ownerName: memberFile.member.fullName,
      ownerId: memberFile.member.id,
    }))
  );

  const insuranceLikePolicies = flatPolicies.filter((policy) => {
    const coeff = policy?.savings?.hCoeff;
    const noCoeff = coeff === null || coeff === undefined || coeff === 0;
    const isLifeInsurance = (policy.productType || "").trim() === "ביטוח חיים";
    return noCoeff || isLifeInsurance;
  });

  const totals = {
    totalAccumulated: sumNullable(members.map((m) => m.summary.save.totalAccumulated)),
    totalProjectedRetirementBalance: sumNullable(
      members.map((m) => m.summary.save.projectedRetirementBalance)
    ),
    totalProjectedMonthlyPension: sumNullable(
      members.map((m) => m.summary.save.projectedMonthlyPension)
    ),
    totalInsurance: sumNullable(
      insuranceLikePolicies.map((p) => p.savings.totalAccumulated)
    ),
    totalMonthlyDeposits: sumNullable(members.map((m) => m.summary.budget.sumCost)),
    totalWorkerDeposits: sumNullable(members.map((m) => m.summary.budget.worker)),
    totalEmployerDeposits: sumNullable(members.map((m) => m.summary.budget.employer)),
    totalCompensationDeposits: sumNullable(members.map((m) => m.summary.budget.compensation)),
    totalRiskCost: sumNullable(flatPolicies.map((p) => p.coverage.totalRisk)),
    totalCoverMonthlyCost: sumNullable(
      flatPolicies.map((p) => p.coverage.totalMonthlyCoverCost)
    ),
  };

  return {
    members,
    totals,
    policies: flatPolicies,
  };
}