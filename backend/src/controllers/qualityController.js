import QualityParam from '../models/QualityParam.js';

export const getQualityParams = async (req, res) => {
  try {
    const { productId } = req.params;
    const filter = productId ? { productRef: productId } : {};
    const qualityParams = await QualityParam.find(filter)
      .populate('productRef', 'name');
    res.json(qualityParams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
