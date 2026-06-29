export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CRM API is running',
    environment: process.env.NODE_ENV || 'development'
  });
};
