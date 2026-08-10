import SalesRecord from '../models/SalesRecord.js';

export const getSales = async (req, res) => {
  try {
    const { warehouseId, productId, from, to } = req.query;
    const filter = {};
    if (warehouseId) filter.warehouseRef = warehouseId;
    if (productId) filter.productRef = productId;
    
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const sales = await SalesRecord.find(filter)
      .populate('productRef', 'name')
      .populate('warehouseRef', 'name')
      .sort({ date: 1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
