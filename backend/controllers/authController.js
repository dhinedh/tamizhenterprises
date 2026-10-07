const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');
const Salesman = require('../models/Salesman');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'tamil_enterprises_super_secret_jwt_key_2026_secured', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, storeId, salesmanId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Owner',
      phone,
      storeId: storeId || null,
      salesmanId: salesmanId || null
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        storeId: user.storeId,
        salesmanId: user.salesmanId,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token (supports Email or Mobile Number)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const loginIdentifier = (identifier || email || phone || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or phone number and password' });
    }

    const userQueries = [
      { email: loginIdentifier.toLowerCase() },
      { phone: loginIdentifier }
    ];

    // Normalize phone number to match various formats (+91 94432 10987, 9443210987, etc.)
    const digitsOnly = loginIdentifier.replace(/\D/g, '');
    if (digitsOnly.length >= 7) {
      const last10 = digitsOnly.slice(-10);
      const flexiblePattern = last10.split('').join('[\\s-]*');
      userQueries.push({ phone: { $regex: flexiblePattern, $options: 'i' } });
    }

    const user = await User.findOne({ $or: userQueries }).populate('storeId').populate('salesmanId');

    if (user && (await user.matchPassword(password))) {
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          storeId: user.storeId,
          salesmanId: user.salesmanId,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email/phone number or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('storeId').populate('salesmanId');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List all system users
// @route   GET /api/auth/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('storeId').populate('salesmanId');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name,
      email,
      phone,
      gstin,
      companyName,
      logo,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      deliveryAddress,
      bankDetails
    } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (email !== undefined && email.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== user.email) {
        const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (emailExists) {
          return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
        }
        user.email = normalizedEmail;
      }
    }
    if (gstin !== undefined) user.gstin = gstin.trim().toUpperCase();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (logo !== undefined) user.logo = logo;
    if (addressLine1 !== undefined) user.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) user.addressLine2 = addressLine2.trim();
    if (city !== undefined) user.city = city.trim();
    if (state !== undefined) user.state = state.trim();
    if (pincode !== undefined) user.pincode = pincode.trim();
    if (deliveryAddress !== undefined) user.deliveryAddress = deliveryAddress.trim();

    if (bankDetails) {
      user.bankDetails = {
        accountName: bankDetails.accountName !== undefined ? bankDetails.accountName.trim() : (user.bankDetails?.accountName || ''),
        accountNumber: bankDetails.accountNumber !== undefined ? bankDetails.accountNumber.trim() : (user.bankDetails?.accountNumber || ''),
        bankName: bankDetails.bankName !== undefined ? bankDetails.bankName.trim() : (user.bankDetails?.bankName || ''),
        branchName: bankDetails.branchName !== undefined ? bankDetails.branchName.trim() : (user.bankDetails?.branchName || ''),
        ifscCode: bankDetails.ifscCode !== undefined ? bankDetails.ifscCode.trim().toUpperCase() : (user.bankDetails?.ifscCode || ''),
        upiNumber: bankDetails.upiNumber !== undefined ? bankDetails.upiNumber.trim() : (user.bankDetails?.upiNumber || '')
      };
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ success: true, message: 'Profile updated successfully', data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, getAllUsers, updateProfile, changePassword };
