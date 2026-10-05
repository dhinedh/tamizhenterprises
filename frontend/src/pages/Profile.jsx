import React, { useState, useEffect } from 'react';
import { RotateCw, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PROFILE = {
  name: 'K.tamizhmozhi',
  phone: '9841433607',
  email: 'tamizhmozhi1111@gmail.com',
  gstin: '33AGVPT5588R1ZW',
  companyName: 'Tamizh Enterprises',
  addressLine1: '10-A,hospital road',
  addressLine2: 'cholapuram',
  city: 'ambattur',
  state: 'Tamil Nadu',
  pincode: '600053',
  deliveryAddress: 'NO;10/A 19 HOSPITAL ROAD,CHOLAPURAM AMBATTUR CHENNAI-53',
  bankDetails: {
    accountName: 'TAMIZH ENTERPRISES',
    accountNumber: '134661900000504',
    bankName: 'Yes bank',
    branchName: 'Ambattur',
    ifscCode: 'YESB0001346',
    upiNumber: '9841433607'
  }
};

// Default logo SVG matching the circular multi-color branded badge in reference screenshot
const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="25%" stop-color="#8b5cf6" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="75%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="url(#ringGrad)" stroke-width="12" />
  <text x="100" y="95" font-family="'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="#0f766e" text-anchor="middle">Tamizh</text>
  <text x="100" y="125" font-family="'Brush Script MT', cursive, sans-serif" font-size="20" font-style="italic" fill="#0f766e" text-anchor="middle">Enterprises</text>
</svg>
`)}`;

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    companyName: '',
    logo: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    deliveryAddress: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      ifscCode: '',
      upiNumber: ''
    }
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [logoPreview, setLogoPreview] = useState(DEFAULT_LOGO_SVG);

  useEffect(() => {
    // Populate form with user data, falling back to reference defaults
    if (user) {
      const merged = {
        name: user.name || DEFAULT_PROFILE.name,
        phone: user.phone || DEFAULT_PROFILE.phone,
        email: user.email || DEFAULT_PROFILE.email,
        gstin: user.gstin || DEFAULT_PROFILE.gstin,
        companyName: user.companyName || DEFAULT_PROFILE.companyName,
        logo: user.logo || '',
        addressLine1: user.addressLine1 || DEFAULT_PROFILE.addressLine1,
        addressLine2: user.addressLine2 || DEFAULT_PROFILE.addressLine2,
        city: user.city || DEFAULT_PROFILE.city,
        state: user.state || DEFAULT_PROFILE.state,
        pincode: user.pincode || DEFAULT_PROFILE.pincode,
        deliveryAddress: user.deliveryAddress || DEFAULT_PROFILE.deliveryAddress,
        bankDetails: {
          accountName: user.bankDetails?.accountName || DEFAULT_PROFILE.bankDetails.accountName,
          accountNumber: user.bankDetails?.accountNumber || DEFAULT_PROFILE.bankDetails.accountNumber,
          bankName: user.bankDetails?.bankName || DEFAULT_PROFILE.bankDetails.bankName,
          branchName: user.bankDetails?.branchName || DEFAULT_PROFILE.bankDetails.branchName,
          ifscCode: user.bankDetails?.ifscCode || DEFAULT_PROFILE.bankDetails.ifscCode,
          upiNumber: user.bankDetails?.upiNumber || DEFAULT_PROFILE.bankDetails.upiNumber
        }
      };
      setFormData(merged);
      if (user.logo) {
        setLogoPreview(user.logo);
      } else {
        setLogoPreview(DEFAULT_LOGO_SVG);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank.')) {
      const field = name.replace('bank.', '');
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 2MB
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      setLogoPreview(base64Data);
      setFormData((prev) => ({
        ...prev,
        logo: base64Data
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gstin: formData.gstin,
        companyName: formData.companyName,
        logo: formData.logo || (logoPreview !== DEFAULT_LOGO_SVG ? logoPreview : ''),
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        deliveryAddress: formData.deliveryAddress,
        bankDetails: formData.bankDetails
      };

      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        setSuccessMsg('Profile updated successfully!');
        if (updateUser) {
          updateUser(res.data.data);
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setErrorMsg(err.response?.data?.message || 'Error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight mb-6">
          My Profile
        </h1>

        {/* Alerts */}
        {successMsg && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Card Container */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Mobile Number (Disabled/Read-only in reference UI) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                readOnly
                className="w-full px-3.5 py-2.5 bg-[#e9ecef] border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm cursor-not-allowed select-none"
              />
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email ID
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                GSTIN
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                placeholder="33AGVPT5588R1ZW"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Logo / Photo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo / Photo
              </label>
              <div className="mb-3">
                <div className="w-24 h-24 rounded-full border border-slate-200 shadow-xs overflow-hidden flex items-center justify-center bg-white">
                  <img
                    src={logoPreview}
                    alt="Company Logo Preview"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>
              <div className="w-full">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleLogoUpload}
                  className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-slate-300 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-800 hover:file:bg-slate-100 cursor-pointer border border-slate-300 rounded-lg p-1.5 bg-white"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Allowed: jpg, jpeg, png. This logo appears on your invoices.
                </p>
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Address Line 1
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Address Line 2
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Delivery Address
              </label>
              <textarea
                name="deliveryAddress"
                rows={3}
                value={formData.deliveryAddress}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
              />
            </div>

            {/* Section: Bank Details */}
            <div className="pt-2">
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                Bank Details
              </h2>

              <div className="space-y-4">
                {/* A/c Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    A/c Name
                  </label>
                  <input
                    type="text"
                    name="bank.accountName"
                    value={formData.bankDetails.accountName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* A/c Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    A/c Number
                  </label>
                  <input
                    type="text"
                    name="bank.accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank.bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Branch Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    name="bank.branchName"
                    value={formData.bankDetails.branchName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* IFS Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    IFS Code
                  </label>
                  <input
                    type="text"
                    name="bank.ifscCode"
                    value={formData.bankDetails.ifscCode}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* UPI Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    UPI Number
                  </label>
                  <input
                    type="text"
                    name="bank.upiNumber"
                    value={formData.bankDetails.upiNumber}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                <span>{saving ? 'Updating...' : 'Update'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
