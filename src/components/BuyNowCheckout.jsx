import React, { useEffect, useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Header from './Header';
import { useNavigate } from 'react-router-dom';

const BuyNowCheckout = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    region: '',
    country: '',
    shippingMethod: 'Standard Delivery',
    paymentMethod: 'Cash on Delivery',
    promoCode: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [bankTransferProofBase64, setBankTransferProofBase64] = useState(null);
  const [convertingImage, setConvertingImage] = useState(false);

  // Load buy now product from session storage
  useEffect(() => {
    try {
      const buyNowItem = sessionStorage.getItem('buyNowItem');
      if (buyNowItem) {
        const parsedProduct = JSON.parse(buyNowItem);
        setProduct(parsedProduct);
        setCartItems([{
          id: parsedProduct.id || `temp_${Date.now()}`,
          ...parsedProduct,
          quantity: parsedProduct.quantity || 1,
          createdAt: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error loading buy now product:', error);
    }
  }, []);

  const FREE_SHIPPING_THRESHOLD = 2500;
  
  // Calculate shipping cost based on city
  const calculateShippingCost = () => {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    
    // Check if city is Sahiwal (case insensitive)
    if (form.city && form.city.toLowerCase().trim() === 'sahiwal') {
      return 150;
    }
    
    // Default shipping cost for other cities
    return 250;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const shippingCost = calculateShippingCost();
  const total = subtotal + shippingCost;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for the field being changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear the Base64 string if payment method changes from Online Payment
    if (name === 'paymentMethod' && value !== 'Online Payment') {
      setBankTransferProofBase64(null);
      setErrors(prev => ({ ...prev, bankTransferProof: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic file size validation (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({ ...prev, bankTransferProof: 'File size exceeds 5MB limit.' }));
        setBankTransferProofBase64(null);
        return;
      }

      setConvertingImage(true);
      setErrors(prev => ({ ...prev, bankTransferProof: '' }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setBankTransferProofBase64(reader.result);
        setConvertingImage(false);
      };
      reader.onerror = (error) => {
        console.error("Error converting file to Base64:", error);
        setBankTransferProofBase64(null);
        setConvertingImage(false);
        setErrors(prev => ({ ...prev, bankTransferProof: 'Failed to read image file.' }));
      };
      reader.readAsDataURL(file);
    } else {
      setBankTransferProofBase64(null);
      setErrors(prev => ({ ...prev, bankTransferProof: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [ 'fullName', 'phone', 'address', 'city', 'region', 'country'];
    
    requiredFields.forEach(field => {
      if (!form[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Email validation
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Basic phone number validation
    if (form.phone && !/^\d{7,}$/.test(form.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (at least 7 digits)';
    }

    if (form.paymentMethod === 'Online Payment' && !bankTransferProofBase64) {
      newErrors.bankTransferProof = 'Please upload a screenshot of your JazzCash transfer or bank transfer receipt.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const placeOrder = async () => {
    if (!validateForm()) {
      // Scroll to the first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementsByName(firstErrorField)[0] || 
                      document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setLoading(true);

    // Generate unique order ID
    const orderId = 'BUYNOW_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const order = {
      orderId,
      customerType: 'guest',
      customerEmail: form.email,
      items: cartItems.map(item => ({
        productId: item.productId || item.id.replace('temp_', ''),
        title: item.title,
        quantity: item.quantity || 1,
        price: item.price,
        image: item.image || item.coverImage,
        // Store variation details
        variation: item.variation || null,
        type: item.type || null,
        size: item.size || null,
        lining: item.lining || false,
      })),
      shipping: form.shippingMethod,
      payment: form.paymentMethod,
      shippingAddress: {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        region: form.region,
        country: form.country,
      },
      promoCode: form.promoCode,
      notes: form.notes,
      subtotal,
      shippingCost,
      total,
      createdAt: new Date(),
      status: 'processing',
      buyNow: true,
      bankTransferProofBase64: form.paymentMethod === 'Online Payment' ? bankTransferProofBase64 : null,
    };

    try {
      await addDoc(collection(db, 'orders'), order);
      
      // Clear the buy now item from storage
      sessionStorage.removeItem('buyNowItem');
      
      // Store order details for confirmation page
      sessionStorage.setItem('lastOrderId', orderId);
      sessionStorage.setItem('lastOrderEmail', form.email);
      sessionStorage.setItem('lastOrderType', 'buyNow');
      
      navigate('/thanks');
    } catch (err) {
      console.error("Error placing order:", err);
      if (err.code === 'resource-exhausted' || (err.message && err.message.includes('too large'))) {
        alert('Error: The uploaded image is too large. Please try a smaller image or contact support.');
      } else {
        alert('Error placing order. Please try again. If the issue persists, contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get shipping description based on city
  const getShippingDescription = () => {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      return "FREE shipping - Delivery in 4-5 business days";
    }
    
    if (form.city && form.city.toLowerCase().trim() === 'sahiwal') {
      return "PKR 150 for Sahiwal - Delivery in 4-5 business days";
    }
    
    return "PKR 250 for all cities - Delivery in 4-5 business days";
  };

  // Show loading if product is not loaded yet
  if (!product && cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#fceadc] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-4">Loading Product...</h2>
            <p className="text-gray-600 mb-6">Please wait while we load your product details.</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#fefaf9] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm sm:text-base">
              <li>
                <a href="/" className="text-gray-500 hover:text-gray-700">Home</a>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-black font-medium">Buy Now Checkout</span>
              </li>
            </ol>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Buy Now Checkout</h1>

          {/* Free Shipping Banner */}
          {subtotal < FREE_SHIPPING_THRESHOLD && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-800 font-medium text-sm sm:text-base">
                  Add PKR {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} more to get FREE shipping!
                </span>
              </div>
            </div>
          )}

          {subtotal >= FREE_SHIPPING_THRESHOLD && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium text-sm sm:text-base">
                  🎉 Congratulations! You've unlocked FREE shipping!
                </span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="bg-[#fefaf9] p-6 rounded-lg shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-6 pb-2 border-b">Contact Information</h2>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  id="email"
                  name="email" 
                  type="email"
                  value={form.email} 
                  onChange={handleChange} 
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <h2 className="text-lg sm:text-xl font-semibold mb-6 pb-2 border-b">Shipping Address</h2>
              
              <div className="grid gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                  <input 
                    id="fullName"
                    name="fullName" 
                    value={form.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <input 
                    id="phone"
                    name="phone" 
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g., 03001234567"
                    className={`w-full px-4 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Street Address*</label>
                  <input 
                    id="address"
                    name="address" 
                    value={form.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                    <input 
                      id="city"
                      name="city" 
                      value={form.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input 
                      id="postalCode"
                      name="postalCode" 
                      value={form.postalCode}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.postalCode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                    />
                    {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Province/Region*</label>
                    <input 
                      id="region"
                      name="region" 
                      value={form.region}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.region ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                    />
                    {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country*</label>
                    <select 
                      id="country"
                      name="country" 
                      value={form.country}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                    >
                      <option value="">Select Country</option>
                      <option value="PK">Pakistan</option>
                    </select>
                    {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                  </div>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-semibold mt-8 mb-6 pb-2 border-b">Shipping Method</h2>
              
              <div className="space-y-4">
                <label className="flex items-center p-4 border rounded-md hover:border-black cursor-pointer">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="Standard Delivery"
                    checked={form.shippingMethod === 'Standard Delivery'}
                    onChange={handleChange}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Standard Delivery</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {getShippingDescription()}
                    </p>
                  </div>
                </label>
              </div>

              <h2 className="text-lg sm:text-xl font-semibold mt-8 mb-6 pb-2 border-b">Payment Method</h2>
              
              <div className="space-y-4">
                {['Cash on Delivery', 'Online Payment'].map(method => (
                  <label key={method} className="flex items-center p-4 border rounded-md hover:border-black cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={form.paymentMethod === method}
                      onChange={handleChange}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{method}</span>
                      {method === 'Cash on Delivery' && (
                        <p className="text-sm text-gray-500 mt-1">
                          Pay when your order is delivered (No extra fee)
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {form.paymentMethod === 'Online Payment' && (
                <div className="mt-6 p-4 border border-blue-300 bg-blue-50 rounded-md">
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Online Payment Details</h3>
                  <p className="text-gray-700 mb-4 text-sm sm:text-base">
                    Please transfer the total amount of PKR {total.toLocaleString()} to our account:
                  </p>
                  <ul className="list-disc list-inside text-gray-800 text-sm sm:text-base mb-4">
                     <li><strong> Easy Paisa Account Name:</strong> Sabahat Fatima </li>
                    <li><strong>EasyPaisa Number:</strong> 03414787267</li>
                    <li><strong>IBAN</strong> PK18UNIL0109000338906728</li>
                   <li><strong>Account Name</strong>Sabahat Fatima</li>
                  </ul>
                  
                  <p className="text-gray-700 mb-4 text-sm sm:text-base">
                    After making the transfer, please upload a screenshot of the transaction or bank transfer receipt as proof of payment.
                  </p>
                  <div>
                    <label htmlFor="bankTransferProof" className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Transfer Screenshot/Receipt*
                    </label>
                    <input
                      id="bankTransferProof"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={`w-full px-4 py-2 border ${errors.bankTransferProof ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black text-sm sm:text-base`}
                    />
                    {errors.bankTransferProof && <p className="mt-1 text-sm text-red-600">{errors.bankTransferProof}</p>}
                    {bankTransferProofBase64 && (
                      <p className="mt-2 text-sm text-gray-600">Image selected and converted.</p>
                    )}
                    {convertingImage && (
                      <p className="mt-2 text-sm text-gray-600 flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Converting image...
                      </p>
                    )}
                </div>
                </div>
              )}

              <div className="mt-6">
                <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                <div className="flex">
                  <input 
                    id="promoCode"
                    name="promoCode" 
                    value={form.promoCode}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-black focus:border-black text-sm sm:text-base"
                    placeholder="Enter promo code"
                  />
                  <button 
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-r-md hover:bg-gray-300 transition text-sm sm:text-base"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
                <textarea 
                  id="notes"
                  name="notes" 
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm sm:text-base"
                  placeholder="Special instructions, delivery notes, etc."
                />
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="bg-[#fefaf9] p-6 rounded-lg shadow-sm h-fit lg:sticky lg:top-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-6 pb-2 border-b">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex gap-4 mb-2 sm:mb-0">
                      <img
                        src={item.image || item.coverImage}
                        alt={item.title}
                        className="w-16 h-20 sm:w-20 sm:h-25 object-top rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">{item.title}</p>
                        
                        {/* Display variation (color) if it exists */}
                        {item.variation && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-500">Color:</span>
                            <span className="text-xs font-medium text-gray-700">{item.variation}</span>
                            {/* Optional: Show a small color swatch */}
                            <div 
                              className="w-3 h-3 rounded-full border border-gray-200"
                              style={{ 
                                backgroundColor: item.variation.toLowerCase(),
                                display: /^#[0-9A-F]{6}$/i.test(item.variation) ? 'block' : 'none'
                              }}
                              title={item.variation}
                            />
                          </div>
                        )}
                        
                        <p className="text-xs sm:text-sm text-gray-500">
                          {item.type && `${item.type} |`} {item.size} {item.lining ? '| Lining' : ''}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity || 1}</p>
                      </div>
                    </div>
                    <p className="font-medium text-sm sm:text-base">
                      PKR {(item.price * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm">PKR {subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <span className={`text-sm ${shippingCost === 0 ? 'text-green-600 font-medium' : ''}`}>
                    {shippingCost === 0 ? 'FREE' : `PKR ${shippingCost.toLocaleString()}`}
                  </span>
                </div>
                
                {form.promoCode && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discount</span>
                    <span className="text-sm text-green-600">-PKR 0</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                <span className="font-medium text-base sm:text-lg">Total</span>
                <span className="font-bold text-base sm:text-lg">PKR {total.toLocaleString()}</span>
              </div>

              {/* Progress bar for free shipping */}
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Progress to FREE shipping</span>
                    <span>PKR {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} left</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)}% towards free shipping
                  </p>
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={loading || cartItems.length === 0 || convertingImage}
                className={`mt-6 w-full py-3 px-4 rounded-md font-medium text-white ${loading || cartItems.length === 0 || convertingImage ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} transition text-base`}
              >
                {loading || convertingImage ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {convertingImage ? 'Converting Image...' : 'Processing Order...'}
                  </span>
                ) : cartItems.length === 0 ? (
                  'No Items to Order'
                ) : (
                  'Place Order Now'
                )}
              </button>

              <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
                <p>100% secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuyNowCheckout;