const pagination = (req, res, next) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};

export default pagination;
