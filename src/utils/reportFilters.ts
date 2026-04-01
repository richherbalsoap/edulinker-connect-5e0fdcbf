export const normalizeDateRange = (startDate: Date | null, endDate: Date | null) => {
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    return { startDate: endDate, endDate: startDate };
  }

  return { startDate, endDate };
};

const getTimestamp = (value?: string | null) => {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const filterRowsByCreatedAt = <T extends { created_at?: string | null }>(
  rows: T[],
  startDate: Date | null,
  endDate: Date | null,
) => {
  if (!startDate && !endDate) return rows;

  const startTime = startDate?.getTime() ?? Number.NEGATIVE_INFINITY;
  const endTime = endDate?.getTime() ?? Number.POSITIVE_INFINITY;

  return rows.filter((row) => {
    const createdAt = getTimestamp(row.created_at);
    if (createdAt === null) return false;

    return createdAt >= startTime && createdAt <= endTime;
  });
};