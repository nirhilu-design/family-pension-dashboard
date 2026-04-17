// src/utils/pensionXmlParser.js

export async function parseMultiplePensionXmlFiles(files) {
  const results = [];

  for (const file of files) {
    const xmlText = await file.text();
    const json = parseXmlToJson(xmlText);

    results.push({
      fileName: file.name,
      rawXml: xmlText,
      json,
    });
  }

  return results;
}

export function buildLegacyReportData(parsedFiles = []) {
  const memberBuckets = new Map();
  const allProductsRaw = [];
  const allTracksRaw = [];
  const allLoansRaw = [];
  const beneficiariesRaw = [];

  for (const parsedFile of parsedFiles) {
    const reportRoot = getReportRoot(parsedFile.json);

    const memberDetails = extractMemberDetails(reportRoot);
    const ownerFirstName = memberDetails.firstName || "";
    const ownerFamilyName = memberDetails.familyName || "";
    const ownerKey = normalizeNameKey(ownerFirstName, ownerFamilyName);

    const policies = toArray(safeGet(reportRoot, ["Policies", "Policy"]));

    if (!memberBuckets.has(ownerKey)) {
      memberBuckets.set(ownerKey, createEmptyMember(ownerFirstName, ownerFamilyName));
    }

    const memberBucket = memberBuckets.get(ownerKey);

    for (const policy of policies) {
      const normalizedPolicy = normalizePolicy(policy, ownerFirstName, ownerFamilyName);

      memberBucket.assets += normalizedPolicy.assets;
      memberBucket.monthlyDeposits += normalizedPolicy.monthlyDeposits;
      memberBucket.monthlyPensionWithDeposits += normalizedPolicy.monthlyPensionWithDeposits;
      memberBucket.monthlyPensionWithoutDeposits += normalizedPolicy.monthlyPensionWithoutDeposits;
      memberBucket.lumpSumWithDeposits += normalizedPolicy.lumpSumWithDeposits;
      memberBucket.lumpSumWithoutDeposits += normalizedPolicy.lumpSumWithoutDeposits;
      memberBucket.deathCoverage += normalizedPolicy.deathCoverage;
      memberBucket.disabilityValue += normalizedPolicy.disabilityValue;
      memberBucket.disabilityPercent = Math.max(
        memberBucket.disabilityPercent || 0,
        normalizedPolicy.disabilityPercent || 0
      );

      allProductsRaw.push({
        name: normalizedPolicy.productName,
        value: normalizedPolicy.assets,
        managerName: normalizedPolicy.managerName,
      });

      const investPlans = extractInvestPlans(policy);
      for (const track of investPlans) {
        allTracksRaw.push(track);
      }

      const loans = extractLoansFromPolicy(policy, ownerFirstName, ownerFamilyName);
      for (const loan of loans) {
        allLoansRaw.push(loan);
      }
    }

    const beneficiaries = extractBeneficiaries(reportRoot);
    for (const item of beneficiaries) {
      beneficiariesRaw.push(item);
    }
  }

  const members = Array.from(memberBuckets.values()).map((member) => ({
    ...member,
    name: [member.firstName, member.familyName].filter(Boolean).join(" ").trim(),
  }));

  const familyTotalAssets = sumBy(members, (m) => m.assets);
  const familyMonthlyDeposits = sumBy(members, (m) => m.monthlyDeposits);
  const familyMonthlyPensionWithDeposits = sumBy(
    members,
    (m) => m.monthlyPensionWithDeposits
  );
  const familyMonthlyPensionWithoutDeposits = sumBy(
    members,
    (m) => m.monthlyPensionWithoutDeposits
  );
  const familyLumpSumWithDeposits = sumBy(members, (m) => m.lumpSumWithDeposits);
  const familyLumpSumWithoutDeposits = sumBy(
    members,
    (m) => m.lumpSumWithoutDeposits
  );

  const membersWithShare = members.map((member) => ({
    ...member,
    shareOfFamilyAssets:
      familyTotalAssets > 0
        ? round2((member.assets / familyTotalAssets) * 100)
        : 0,
  }));

  const products = aggregateByName(allProductsRaw);
  const managers = aggregateByName(
    allProductsRaw.map((item) => ({
      name: item.managerName || "לא ידוע",
      value: item.value || 0,
    }))
  );

  const tracks = aggregateTracks(allTracksRaw);
  const totalTracks = sumBy(tracks, (t) => t.value);

  const weightedEquityExposure =
    totalTracks > 0
      ? round2(
          tracks.reduce((sum, track) => {
            return sum + (track.value || 0) * ((track.equityPercent || 0) / 100);
          }, 0) / totalTracks
        )
      : 0;

  const beneficiariesCoverageAmount = sumBy(
    beneficiariesRaw,
    (item) => item.coverageAmount || 0
  );

  const loansDetails = uniqueBy(
    allLoansRaw,
    (loan) =>
      [
        normalizeNameKey(loan.firstName, loan.familyName),
        loan.amount || 0,
        loan.balance || 0,
        normalizeString(loan.repaymentFrequency),
        normalizeString(loan.endDate),
      ].join("|")
  );

  return {
    family: {
      lastUpdated: formatToday(),
      totalAssets: familyTotalAssets,
      monthlyDeposits: familyMonthlyDeposits,
      monthlyPensionWithDeposits: familyMonthlyPensionWithDeposits,
      monthlyPensionWithoutDeposits: familyMonthlyPensionWithoutDeposits,
      projectedLumpSumWithDeposits: familyLumpSumWithDeposits,
      projectedLumpSumWithoutDeposits: familyLumpSumWithoutDeposits,
      retirementAgeLabel: "התחזית מחושבת מתוך שדות Save / Budgets בקבצי ה־XML",
    },

    members: membersWithShare.map((member) => ({
      name: member.name || "ללא שם",
      assets: member.assets || 0,
      monthlyDeposits: member.monthlyDeposits || 0,
      monthlyPensionWithDeposits: member.monthlyPensionWithDeposits || 0,
      monthlyPensionWithoutDeposits: member.monthlyPensionWithoutDeposits || 0,
      lumpSumWithDeposits: member.lumpSumWithDeposits || 0,
      lumpSumWithoutDeposits: member.lumpSumWithoutDeposits || 0,
      deathCoverage: member.deathCoverage || 0,
      disabilityValue: member.disabilityValue || 0,
      disabilityPercent: member.disabilityPercent || 0,
      shareOfFamilyAssets: member.shareOfFamilyAssets || 0,
    })),

    products: products.map((item) => ({
      name: item.name,
      value: item.value,
    })),

    managers: managers.map((item) => ({
      name: item.name,
      value: item.value,
    })),

    tracks: tracks.map((track) => ({
      name: track.name,
      value: track.value,
      equityPercent: track.equityPercent,
    })),

    loans: {
      hasData: loansDetails.length > 0,
      details: loansDetails.map((loan, index) => ({
        id:
          loan.id ||
          `${loan.firstName || ""}_${loan.familyName || ""}_${loan.endDate || ""}_${index}`,
        firstName: loan.firstName || "",
        familyName: loan.familyName || "",
        amount: loan.amount || 0,
        repaymentFrequency: loan.repaymentFrequency || "",
        balance: loan.balance || 0,
        endDate: loan.endDate || "",
      })),
    },

    beneficiaries: {
      hasData: beneficiariesRaw.length > 0,
      coverageAmount: beneficiariesCoverageAmount,
      summary:
        beneficiariesRaw.length > 0
          ? "נמצא מידע חלקי על מוטבים / כיסוי"
          : "לא התקבל מידע",
    },

    weightedEquityExposure,
    totalProducts: sumBy(products, (x) => x.value),
    totalManagers: sumBy(managers, (x) => x.value),
    totalTracks: totalTracks,
  };
}

function getReportRoot(json) {
  if (!json || typeof json !== "object") return {};
  const keys = Object.keys(json);
  if (!keys.length) return {};
  return json[keys[0]] || {};
}

function createEmptyMember(firstName, familyName) {
  return {
    firstName: firstName || "",
    familyName: familyName || "",
    assets: 0,
    monthlyDeposits: 0,
    monthlyPensionWithDeposits: 0,
    monthlyPensionWithoutDeposits: 0,
    lumpSumWithDeposits: 0,
    lumpSumWithoutDeposits: 0,
    deathCoverage: 0,
    disabilityValue: 0,
    disabilityPercent: 0,
  };
}

function extractMemberDetails(reportRoot) {
  const memberNode = safeGet(reportRoot, ["MemberDetails"]) || {};

  return {
    id: getText(memberNode.ID),
    firstName: getText(memberNode.FirstName),
    familyName: getText(memberNode.FamilyName),
    companyName: getText(memberNode.CompanyName),
    income: normalizeNumber(memberNode.Income),
  };
}

function normalizePolicy(policy, ownerFirstName, ownerFamilyName) {
  const budgets = safeGet(policy, ["Budgets"]) || {};
  const covers = safeGet(policy, ["Covers"]) || {};
  const policyDetails = safeGet(policy, ["PolicyDetails"]) || {};
  const save = safeGet(policy, ["Save"]) || {};

  const productName =
    getText(budgets.PlanName) ||
    getText(covers.PlanName) ||
    getText(save.PlanName) ||
    getText(budgets.ProposeName2) ||
    getText(covers.ProposeName2) ||
    getText(save.ProposeName2) ||
    "מוצר לא ידוע";

  const managerName =
    inferManagerName(productName) ||
    getText(budgets.CompanyName) ||
    getText(covers.CompanyName) ||
    "לא ידוע";

  const totalTagWorker = normalizeNumber(budgets.TotalTagWorker);
  const totalTagEmployer = normalizeNumber(budgets.TotalTagEmployer);
  const totalCompensetion = normalizeNumber(budgets.TotalCompensetion);
  const sumCost = normalizeNumber(budgets.SumCost);

  const monthlyDeposits =
    sumCost || totalTagWorker + totalTagEmployer + totalCompensetion;

  const assets =
    normalizeNumber(save.TotalItraZvura) ||
    normalizeNumber(save.ItraZvuraTotalTagAfter2000) +
      normalizeNumber(save.ItraZvuraCompensetion) +
      normalizeNumber(save.ItraZvuraTotalTagBefore2000);

  const monthlyPensionWithDeposits =
    normalizeNumber(save.PensionRetire) ||
    normalizeNumber(save.TotalPidionsMonthly) ||
    0;

  const monthlyPensionWithoutDeposits =
    normalizeNumber(save.RetireCurrBalancePension) || 0;

  const lumpSumWithDeposits =
    normalizeNumber(save.TotalPidions) ||
    tryMultiply(
      normalizeNumber(save.PensionRetire),
      normalizeNumber(save.HCoff)
    );

  const lumpSumWithoutDeposits =
    normalizeNumber(save.RetireCurrBalance) ||
    tryMultiply(
      normalizeNumber(save.RetireCurrBalancePension),
      normalizeNumber(save.HCoff)
    );

  const deathCoverage =
    normalizeNumber(covers.TotalBituah) ||
    normalizeNumber(covers.TotalRisk) ||
    0;

  const disabilityValue =
    normalizeNumber(covers.Handicapped) ||
    normalizeNumber(covers.PensionDisability) ||
    0;

  const disabilityPercent =
    extractPercentFromText(getText(policyDetails.ProposeName)) ||
    0;

  return {
    firstName: ownerFirstName,
    familyName: ownerFamilyName,
    productName,
    managerName,
    assets,
    monthlyDeposits,
    monthlyPensionWithDeposits,
    monthlyPensionWithoutDeposits,
    lumpSumWithDeposits,
    lumpSumWithoutDeposits,
    deathCoverage,
    disabilityValue,
    disabilityPercent,
  };
}

function extractInvestPlans(policy) {
  const investPlans = toArray(safeGet(policy, ["InvestPlans", "InvestPlan"]));

  return investPlans
    .map((plan) => {
      const trackName =
        getText(plan.PlanNameAfik) ||
        getText(plan.PlanName) ||
        getText(plan.ProposeType) ||
        "מסלול לא ידוע";

      const equityPercent = extractEquityPercentFromInvestPlan(plan);

      return {
        name: trackName,
        value: 1,
        equityPercent,
      };
    })
    .filter((item) => item.name);
}

function extractEquityPercentFromInvestPlan(plan) {
  const exposures = toArray(
    safeGet(plan, ["Properties", "Exposures", "Property"])
  );

  for (const property of exposures) {
    const propertyName = normalizeString(getText(property.PropertyName));
    if (propertyName.includes("חשיפה למניות")) {
      return normalizeNumber(property.rate);
    }
  }

  const mainGroups = toArray(
    safeGet(plan, ["Properties", "MainGroups", "Property"])
  );

  for (const property of mainGroups) {
    const propertyName = normalizeString(getText(property.PropertyName));
    if (propertyName.includes("מניות")) {
      return normalizeNumber(property.rate);
    }
  }

  return inferEquityPercentFromTrackName(
    getText(plan.PlanNameAfik) || getText(plan.PlanName)
  );
}

function extractLoansFromPolicy(policy, ownerFirstName, ownerFamilyName) {
  const loans = [];
  const loanItems = toArray(safeGet(policy, ["Loans", "Loan"]));

  loanItems.forEach((loan, index) => {
    const amount = normalizeNumber(loan["SCHUM-HALVAA"]);
    const repaymentFrequency = getText(loan["TADIRUT-HECHZER-HALVAA"]);
    const balance = normalizeNumber(loan["YITRAT-HALVAA"]);
    const endDate = getText(loan["TAARICH-SIYUM-HALVAA"]);

    if (!amount && !balance && !repaymentFrequency && !endDate) {
      return;
    }

    loans.push({
      id: `${normalizeNameKey(ownerFirstName, ownerFamilyName)}_${amount}_${balance}_${endDate}_${index}`,
      firstName: ownerFirstName || "",
      familyName: ownerFamilyName || "",
      amount,
      repaymentFrequency,
      balance,
      endDate,
    });
  });

  return loans;
}

function extractBeneficiaries(reportRoot) {
  const policies = toArray(safeGet(reportRoot, ["Policies", "Policy"]));
  const results = [];

  for (const policy of policies) {
    const covers = safeGet(policy, ["Covers"]) || {};
    const amount = normalizeNumber(covers.TotalBituah);

    if (amount > 0) {
      results.push({
        coverageAmount: amount,
      });
    }
  }

  return results;
}

function aggregateByName(items) {
  const map = new Map();

  for (const item of items) {
    const name = (item.name || "לא ידוע").trim();
    const value = Number(item.value || 0);

    if (!name || value <= 0) continue;

    if (!map.has(name)) {
      map.set(name, { name, value: 0 });
    }

    map.get(name).value += value;
  }

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

function aggregateTracks(items) {
  const map = new Map();

  for (const item of items) {
    const name = item.name || "מסלול לא ידוע";
    const value = Number(item.value || 0);
    const equityPercent = Number(item.equityPercent || 0);

    if (!map.has(name)) {
      map.set(name, {
        name,
        value: 0,
        equityPercent,
      });
    }

    const target = map.get(name);
    target.value += value;
    target.equityPercent =
      target.equityPercent > 0 ? target.equityPercent : equityPercent;
  }

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

function parseXmlToJson(xmlString) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, "application/xml");

  const parserError = xml.getElementsByTagName("parsererror");
  if (parserError.length > 0) {
    throw new Error("קובץ XML לא תקין");
  }

  return {
    [xml.documentElement.nodeName]: xmlNodeToJson(xml.documentElement),
  };
}

function xmlNodeToJson(node) {
  if (node.nodeType === 3) {
    const text = (node.nodeValue || "").trim();
    return text || null;
  }

  if (node.nodeType !== 1) return null;

  const obj = {};

  if (node.attributes && node.attributes.length > 0) {
    for (const attr of Array.from(node.attributes)) {
      obj[`@${attr.nodeName}`] = attr.nodeValue;
    }
  }

  const childNodes = Array.from(node.childNodes || []).filter((child) => {
    if (child.nodeType === 3) {
      return (child.nodeValue || "").trim();
    }
    return child.nodeType === 1;
  });

  if (childNodes.length === 0) {
    return (node.textContent || "").trim();
  }

  for (const child of childNodes) {
    if (child.nodeType === 3) {
      const text = (child.nodeValue || "").trim();
      if (text) {
        obj["#text"] = text;
      }
      continue;
    }

    const childName = child.nodeName;
    const childJson = xmlNodeToJson(child);

    if (obj[childName] === undefined) {
      obj[childName] = childJson;
    } else if (Array.isArray(obj[childName])) {
      obj[childName].push(childJson);
    } else {
      obj[childName] = [obj[childName], childJson];
    }
  }

  return obj;
}

function safeGet(obj, path) {
  let current = obj;

  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }

  return current;
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (typeof value === "object") {
    if (value["#text"] !== undefined) {
      return String(value["#text"] || "").trim();
    }
    if (value._ !== undefined) {
      return String(value._ || "").trim();
    }
  }

  return "";
}

function normalizeString(value) {
  return getText(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeNumber(value) {
  const raw = getText(value);
  if (!raw) return 0;

  const cleaned = raw
    .replace(/₪/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/[^\d.-]/g, "");

  if (!cleaned || cleaned === "-" || cleaned === ".") return 0;

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function normalizeNameKey(firstName, familyName) {
  return `${normalizeString(firstName)}|${normalizeString(familyName)}`;
}

function sumBy(array, selector) {
  return (array || []).reduce((sum, item) => sum + Number(selector(item) || 0), 0);
}

function uniqueBy(array, keyFn) {
  const map = new Map();

  for (const item of array) {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function formatToday() {
  return new Intl.DateTimeFormat("he-IL").format(new Date());
}

function tryMultiply(a, b) {
  const x = Number(a || 0);
  const y = Number(b || 0);
  if (!x || !y) return 0;
  return x * y;
}

function inferManagerName(productName = "") {
  const name = getText(productName);

  if (!name) return "לא ידוע";
  if (name.includes("מגדל")) return "מגדל";
  if (name.includes("הראל")) return "הראל";
  if (name.includes("כלל")) return "כלל";
  if (name.includes("מנורה")) return "מנורה מבטחים";
  if (name.includes("הפניקס")) return "הפניקס";
  if (name.includes("אלטשולר")) return "אלטשולר שחם";
  if (name.includes("מור")) return "מור";
  if (name.includes("מיטב")) return "מיטב";
  if (name.includes("אנליסט")) return "אנליסט";
  return "לא ידוע";
}

function extractPercentFromText(text = "") {
  const str = getText(text);
  const match = str.match(/(\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : 0;
}

function inferEquityPercentFromTrackName(trackName = "") {
  const s = normalizeString(trackName);

  if (s.includes("מניות") || s.includes("מניית")) return 100;
  if (s.includes("אג\"ח") || s.includes("אגח")) return 10;
  if (s.includes("הלכה")) return 25;
  if (s.includes("סולידי")) return 5;
  if (s.includes("כללי")) return 35;
  if (s.includes("עד גיל 50")) return 60;
  if (s.includes("50 עד 60")) return 45;
  if (s.includes("60 ומעלה")) return 25;

  return 30;
}