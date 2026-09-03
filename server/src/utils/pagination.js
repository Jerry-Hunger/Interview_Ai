/**
 * 解析列表接口分页参数，避免一次查询或返回无限增长的数据集。
 */
export const getPagination = (query, { defaultPageSize = 20, maxPageSize = 100 } = {}) => {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedPageSize = Number.parseInt(query.pageSize, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize > 0
    ? Math.min(requestedPageSize, maxPageSize)
    : defaultPageSize;

  return { page, pageSize, skip: (page - 1) * pageSize };
};

export const toPaginationMeta = ({ page, pageSize }, total) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});
