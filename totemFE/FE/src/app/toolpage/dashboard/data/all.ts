// src/app/toolpage/dashboard/data/all.ts

// Import other data files
import { jejuMentionsData } from "./sns";
import { monthlyVisitorsData } from "./visitors";
import { domesticSpendingByIndustry } from "./k-spending"; // Domestic data from k-spending.ts
import { internationalSpendingByIndustry } from "./int-spending"; // International data from int-spending.ts
import { monthlyInternationalVisitors } from "./countries"; // Updated to use monthly international visitor data

// --- Core summary metric calculation logic ---

/**
 * Calculates total domestic visitors for a specific month.
 * @param month The month to retrieve data for, in "YYYY-MM" format.
 */
const calculateTotalDomesticVisitors = (month?: string) => {
  if (!month || monthlyVisitorsData.length === 0) {
    return 0;
  }
  const monthlyData = monthlyVisitorsData.find((item) => item.name === month);
  return monthlyData ? monthlyData.방문자수 : 0;
};

/**
 * Calculates total international visitors for a specific month.
 * @param month The month to retrieve data for, in "YYYY-MM" format.
 */
const calculateTotalInternationalVisitors = (month?: string) => {
  if (!month || monthlyInternationalVisitors.length === 0) {
    return 0;
  }
  const monthlyData = monthlyInternationalVisitors.find(
    (item) => item.month === month
  );
  return monthlyData ? monthlyData.totalVisitors : 0;
};

/**
 * Calculates total tourism spending (domestic + international total by industry) for a specific month.
 * @param month The month to retrieve data for, in "YYYY-MM" format.
 */
const calculateTotalTourismSpending = (month?: string) => {
  let domesticTotal = 0;
  let internationalTotal = 0;

  if (month) {
    // Find the data for the specified month
    const domesticMonthData = domesticSpendingByIndustry.spending_by_month.find(
      (item) => item.month === month
    );
    const internationalMonthData =
      internationalSpendingByIndustry.spending_by_month.find(
        (item) => item.month === month
      );

    if (domesticMonthData) {
      domesticTotal = domesticMonthData.total_spending;
    }
    if (internationalMonthData) {
      internationalTotal = internationalMonthData.total_spending;
    }
  } else {
    // If no month is specified, return the sum of all data (for the total overview)
    domesticTotal = domesticSpendingByIndustry.spending_by_month.reduce(
      (sum, monthData) => sum + monthData.total_spending,
      0
    );
    internationalTotal =
      internationalSpendingByIndustry.spending_by_month.reduce(
        (sum, monthData) => sum + monthData.total_spending,
        0
      );
  }

  return domesticTotal + internationalTotal;
};

/**
 * Calculates total SNS mentions for a specific month.
 * @param month The month to retrieve data for, in "YYYY-MM" format.
 */
const calculateTotalSnsMentions = (month?: string) => {
  if (!month || jejuMentionsData.length === 0) {
    return 0;
  }
  const monthlyData = jejuMentionsData.find((item) => item.name === month);
  return monthlyData ? monthlyData.언급량 : 0;
};

/**
 * Gets the summary metrics for a given month.
 * @param month The month to retrieve data for, in "YYYY-MM" format.
 */
export const getSummaryMetrics = (month?: string) => {
  const totalDomesticVisitors = calculateTotalDomesticVisitors(month);
  const totalInternationalVisitors = calculateTotalInternationalVisitors(month);
  const totalVisitors = totalDomesticVisitors + totalInternationalVisitors;
  const totalTourismSpending = calculateTotalTourismSpending(month);
  const totalSnsMentions = calculateTotalSnsMentions(month);

  // Top 3 해외 방문객 비율 데이터 계산
  const countrySpendingRatioSummary =
    calculateCountrySpendingRatioSummary(month);
  const sortedRatios = [...countrySpendingRatioSummary].sort(
    (a, b) => b.ratio - a.ratio
  );
  const topCountries = sortedRatios.slice(0, 3);
  const topOverseasMarket = topCountries.map((c) => c.country).join(", ");

  return {
    totalVisitors,
    totalTourismSpending,
    totalSnsMentions,
    topOverseasMarket: topOverseasMarket || "데이터 없음",
  };
};

// --- Other dashboard data ---

// Domestic spending data by category for a specific month
export const getDomesticSpendingByMonth = (month: string) => {
  const spendingData = domesticSpendingByIndustry.spending_by_month.find(
    (item) => item.month === month
  );
  return spendingData ? spendingData.category_breakdown : [];
};

// Domestic spending ratio summary, dynamically calculated for a given month
export const calculateDomesticSpendingRatioSummary = (month: string) => {
  const monthData = domesticSpendingByIndustry.spending_by_month.find(
    (item) => item.month === month
  );
  if (!monthData) {
    return [];
  }
  const totalSpending = monthData.total_spending;
  if (totalSpending === 0) {
    return [];
  }
  return monthData.category_breakdown.map((item) => ({
    industry: item.category,
    ratio: (item.spending / totalSpending) * 100,
  }));
};

/**
 * Calculates the ratio of tourism spending by country for a given month.
 * @param month The month to retrieve data for.
 */
export const calculateCountrySpendingRatioSummary = (month?: string) => {
  const latestMonthData = monthlyInternationalVisitors.find(
    (item) => item.month === month
  );

  if (!latestMonthData || latestMonthData.countryRatios.length === 0) {
    return [];
  }

  return latestMonthData.countryRatios;
};

/**
 * 지정된 월에 해당하는 국외 관광소비 데이터를 가져옵니다.
 * @param month "YYYY-MM" 형식의 월
 * @returns 해당 월의 업종별 소비액 데이터 배열, 없으면 빈 배열 반환
 */
export const getInternationalSpendingByMonth = (month: string) => {
  const spendingData = internationalSpendingByIndustry.spending_by_month.find(
    (item) => item.month === month
  );
  return spendingData ? spendingData.category_breakdown : [];
};

export const monthlyVisitorsOverview = monthlyVisitorsData;
