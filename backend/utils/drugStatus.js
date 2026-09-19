const getDrugStatus = (quantity, expiryDate, reorderLevel = 10) => {
  const today = new Date();
  const expiry = new Date(expiryDate);

  // Expired drugs take priority
  if (expiry < today) {
    return "Expired";
  }

  // No stock
  if (quantity === 0) {
    return "Out of Stock";
  }

  // Below the drug's reorder level
  if (quantity <= reorderLevel) {
    return "Low Stock";
  }

  return "Available";
};

module.exports = getDrugStatus;