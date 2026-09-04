export const success = (res, data, status = 200) => {
  res.status(status).json({ success: true, ...data });
};

export const error = (res, message, status = 500, details) => {
  res.status(status).json({
    success: false,
    error: message,
    ...(details === undefined ? {} : { details }),
  });
};
