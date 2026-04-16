// src/utils/pensionXmlParser.js

function sanitizeXml(rawXml) {
  let text = rawXml;
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  text = text.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;");
  return text;
}

function parseXmlDocument(rawXml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizeXml(rawXml), "application/xml");

  const err = doc.querySelector("parsererror");
  if (err) throw new Error("XML parse error");

  return doc;
}

function getText(root, tag) {
  return root.querySelector(tag)?.textContent?.trim() || "";
}

function parseNumber(val) {
  if (!val) return null;
  const clean = val.replace(/₪|,|%/g, "").trim();
  const num = Number(clean);
  return isNaN(num) ? null : num;
}

function sumNullable(arr) {
  return arr.reduce((sum, v) => sum + (v || 0), 0);
}

function parsePolicy(node) {
  const productType = getText(node, "ProposeName2");

  return {
    productType,

    savings: {
      totalAccumulated: parseNumber(getText(node, "TotalItraZvura")),
      projectedRetirementBalance: parseNumber(getText(node, "RetireCurrBalance")),
      projectedMonthlyPension: parseNumber(getText(node, "PensionRetire")),
      hCoeff: parseNumber(getText(node, "HCoff")),
    },

    coverage: {
      totalRisk: parseNumber(getText(node, "TotalRisk")),
      totalMonthlyCoverCost: parseNumber(getText(node, "TotalSum")),
    },
  };
}

export function parsePensionXml(rawXml) {
  const doc = parseXmlDocument(rawXml);

  const memberNode = doc.querySelector("MemberDetails");

  const member = {
    id: getText(memberNode, "ID"),
    fullName:
      getText(memberNode, "FirstName") +
      " " +
      getText(memberNode, "FamilyName"),
  };

  const policies = Array.from(
    doc.querySelectorAll("Policies > Policy")
  ).map(parsePolicy);

  const summary = {
    save: {
      totalAccumulated: parseNumber(
        getText(doc, "TotalItraZvura")
      ),
      projectedMonthlyPension: parseNumber(
        getText(doc, "PensionRetire")
      ),
    },
    budget: {
      sumCost: parseNumber(getText(doc, "SumCost")),
      worker: parseNumber(getText(doc, "TotalTagWorker")),
      employer: parseNumber(getText(doc, "TotalTagEmployer")),
      compensation: parseNumber(getText(doc, "TotalCompensetion")),
    },
  };

  return { member, policies, summary };
}

export async function parseMultiplePensionXmlFiles(files) {
  return Promise.all(files.map((f) => f.text().then(parsePensionXml)));
}

export function buildFamilyDashboardData(members) {
  const flatPolicies = members.flatMap((m) =>
    m.policies.map((p) => ({
      ...p,
      ownerName: m.member.fullName,
    }))
  );

  // 🔥 ללא מקדם
  const noCoeff = flatPolicies.filter(
    (p) => !p.savings.hCoeff || p.savings.hCoeff === 0
  );

  // 🔥 ביטוח חיים
  const lifeInsurance = flatPolicies.filter((p) =>
    (p.productType || "").includes("חיים")
  );

  const totals = {
    // צבירה רגילה
    totalAccumulated: sumNullable(
      members.map((m) => m.summary.save.totalAccumulated)
    ),

    // 🔥 סכום חד הוני לפרישה
    totalProjectedRetirementBalance: sumNullable(
      noCoeff.map((p) => p.savings.projectedRetirementBalance)
    ),

    // קצבה
    totalProjectedMonthlyPension: sumNullable(
      members.map((m) => m.summary.save.projectedMonthlyPension)
    ),

    // 🔥 סכום ביטוח
    totalInsurance: sumNullable([
      ...noCoeff.map((p) => p.savings.totalAccumulated),
      ...lifeInsurance.map((p) => p.savings.totalAccumulated),
    ]),

    totalMonthlyDeposits: sumNullable(
      members.map((m) => m.summary.budget.sumCost)
    ),
  };

  return {
    members,
    totals,
    policies: flatPolicies,
  };
}