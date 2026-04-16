export function buildFamilyDashboardData(members) {
  const flatPolicies = members.flatMap((memberFile) =>
    memberFile.policies.map((policy) => ({
      ...policy,
      ownerName: memberFile.member.fullName,
      ownerId: memberFile.member.id,
    }))
  );

  // מוצרים בלי מקדם
  const policiesWithoutCoeff = flatPolicies.filter((policy) => {
    const coeff = policy?.savings?.hCoeff;
    return coeff === null || coeff === undefined || coeff === 0;
  });

  const totals = {
    totalAccumulated: sumNullable(members.map((m) => m.summary.save.totalAccumulated)),
    totalProjectedRetirementBalance: sumNullable(
      members.map((m) => m.summary.save.projectedRetirementBalance)
    ),
    totalProjectedMonthlyPension: sumNullable(
      members.map((m) => m.summary.save.projectedMonthlyPension)
    ),

    // ✅ סכום ביטוח לפי הבקשה שלך:
    // מחבר צבירות של כל המוצרים שאין להם מקדם
    totalInsurance: sumNullable(
      policiesWithoutCoeff.map((p) => p.savings.totalAccumulated)
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