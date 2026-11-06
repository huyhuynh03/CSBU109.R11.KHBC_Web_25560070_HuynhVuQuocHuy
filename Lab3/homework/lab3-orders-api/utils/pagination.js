// Pagination helpers shared by the list endpoints
const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// page/limit come from the query string, so they must be sanitised before they
// ever reach a LIMIT/OFFSET clause.
const parsePagination = (query) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 5), 100);
  return { page, limit, offset: (page - 1) * limit };
};

module.exports = { toPositiveInt, parsePagination };
