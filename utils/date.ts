export function getPreviousMonthRange() {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const start = new Date(year, prevMonth, 1);
  const end = new Date(year, prevMonth + 1, 0);

  const format = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  return {
    startDate: format(start),
    endDate: format(end),
  };
}
