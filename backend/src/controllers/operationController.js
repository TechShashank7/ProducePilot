import OperationalLog from '../models/OperationalLog.js';

export const getOperations = async (req, res) => {
  try {
    const operations = await OperationalLog.find({})
      .populate('fromWarehouseRef', 'name')
      .populate('toWarehouseRef', 'name');
    res.json(operations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
