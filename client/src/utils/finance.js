export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function getMonthlySpendingReport(transactions = [], monthDate = new Date()) {
  const year = monthDate.getFullYear();
  const month = String(monthDate.getMonth() + 1).padStart(2, '0');
  const monthKey = `${year}-${month}`;

  const filtered = (Array.isArray(transactions) ? transactions : []).filter((tx) => {
    const date = tx?.date || tx?.createdAt;
    return typeof date === 'string' && date.startsWith(monthKey);
  });

  const income = filtered
    .filter((tx) => tx?.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const expenses = filtered
    .filter((tx) => tx?.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const categoryBreakdown = filtered
    .filter((tx) => tx?.type === 'expense')
    .reduce((acc, tx) => {
      const category = tx?.category || 'Other';
      acc[category] = (acc[category] || 0) + Number(tx.amount || 0);
      return acc;
    }, {});

  const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0] || ['No spending', 0];

  return {
    monthKey,
    monthLabel: monthDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
    income,
    expenses,
    savings: income - expenses,
    topCategoryName: topCategory[0],
    topCategoryValue: Number(topCategory[1] || 0),
    categoryBreakdown,
  };
}

export function getUserProfileKey(user) {
  const userKey = user?._id || user?.id || user?.email || 'guest';
  return `wp_profile_${userKey}`;
}
