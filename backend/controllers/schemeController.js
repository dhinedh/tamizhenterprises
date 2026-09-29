const Scheme = require('../models/Scheme');

// @desc    Get all schemes
// @route   GET /api/schemes
const getSchemes = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const schemes = await Scheme.find(filter)
      .populate('applicableProducts', 'name sku brand mrp dealerPrice')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: schemes.length, data: schemes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new scheme
// @route   POST /api/schemes
const createScheme = async (req, res) => {
  try {
    const { title, code, type, minQuantity, freeQuantity, discountPercent, applicableProducts, applicableCategories } = req.body;

    const existing = await Scheme.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Scheme code already exists' });
    }

    const scheme = await Scheme.create({
      ...req.body,
      code: code.toUpperCase(),
      minQuantity: Number(minQuantity || 1),
      freeQuantity: Number(freeQuantity || 0),
      discountPercent: Number(discountPercent || 0)
    });

    res.status(201).json({ success: true, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update scheme
// @route   PUT /api/schemes/:id
const updateScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }
    res.json({ success: true, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete scheme
// @route   DELETE /api/schemes/:id
const deleteScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }
    await scheme.deleteOne();
    res.json({ success: true, message: 'Scheme deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSchemes,
  createScheme,
  updateScheme,
  deleteScheme
};
