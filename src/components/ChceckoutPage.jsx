import React, { useEffect, useState } from 'react';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import Header from './Header';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const navigate = useNavigate();

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

  // Load cart items from localStorage or session storage
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        // Try to get cart from localStorage first, then sessionStorage
        const savedCart = localStorage.getItem('cartItems') || sessionStorage.getItem('cartItems');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
        setCartItems([]);
      }
    };

    loadCartFromStorage();

    // Listen for storage changes (if cart is updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'cartItems' && e.newValue) {
        try {
          const updatedCart = JSON.parse(e.newValue);
          setCartItems(updatedCart);
        } catch (error) {
          console.error('Error parsing updated cart:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = 250; // Flat shipping rate for all cities
  const total = subtotal + shippingCost;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear the Base64 string if payment method changes from EasyPaisa
    if (name === 'paymentMethod' && value !== 'EasyPaisa') {
      setBankTransferProofBase64(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [ 'fullName', 'phone', 'address', 'city', 'country'];
    requiredFields.forEach(field => {
      if (!form[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Email validation
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (form.paymentMethod === 'EasyPaisa' && !bankTransferProofBase64) {
      newErrors.bankTransferProof = 'Please upload a screenshot of your JazzCash transfer or bank transfer receipt.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearCart = () => {
    // Clear cart from both storage options
    localStorage.removeItem('cartItems');
    sessionStorage.removeItem('cartItems');
    setCartItems([]);
  };

  const placeOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);

    // Generate a unique order ID for guest checkout
    const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const order = {
      orderId,
      customerType: 'guest', // Mark as guest order
      customerEmail: form.email,
      items: cartItems.map(item => ({
        productId: item.productId || item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
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
      bankTransferProofBase64: form.paymentMethod === 'EasyPaisa' ? bankTransferProofBase64 : null,
    };

    try {
      await addDoc(collection(db, 'orders'), order);

      // Clear the cart after successful order
      clearCart();

      // Store order ID for confirmation page
      sessionStorage.setItem('lastOrderId', orderId);
      sessionStorage.setItem('lastOrderEmail', form.email);

      navigate('/thanks');
    } catch (err) {
      console.error("Error placing order:", err);
      if (err.code === 'resource-exhausted' || err.message.includes('too large')) {
        alert('Error: The uploaded image is too large. Please try a smaller image or contact support.');
      } else {
        alert('Error placing order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show empty cart message if no items
  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#bfaedb] py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-16">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
              <p className="text-gray-600 mb-8">Add some items to your cart to proceed with checkout.</p>
              <button
                onClick={() => navigate('/')}
                className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#bfaedb] py-8 px-4 sm:px-6 lg:px-8">
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
                <span className="text-black font-medium">Checkout</span>
              </li>
            </ol>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="bg-[#fefaf9] p-6 rounded-lg shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-6 pb-2 border-b">Contact Information</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <h2 className="text-lg sm:text-xl font-semibold mb-6 pb-2 border-b">Shipping Address</h2>

              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address*</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.postalCode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                    />
                    {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province/Region</label>
                    <input
                      name="region"
                      value={form.region}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.region ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                    />
                    {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country*</label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
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
                    <p className="font-medium text-gray-900">Standard Delivery</p>
                    <p className="text-sm text-gray-500">
                      PKR 250 for all cities - Delivery in 8-10 business days
                    </p>
                  </div>
                </label>
              </div>

              <h2 className="text-lg sm:text-xl font-semibold mt-8 mb-6 pb-2 border-b">Payment Method</h2>

              <div className="space-y-4">
                {['Cash on Delivery', 'EasyPaisa'].map(method => (
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
                      <span className="font-medium text-gray-900">{method}</span>
                      {method === 'Cash on Delivery' && (
                        <p className="text-sm text-gray-500 mt-1">
                          Pay when your order is delivered (No extra fee)
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {form.paymentMethod === 'EasyPaisa' && (
                <div className="mt-6 p-4 border border-blue-300 bg-blue-50 rounded-md">
                  <h3 className="text-base sm:text-lg font-semibold mb-3">EasyPaisa Details</h3>
                  <p className="text-gray-700 text-sm sm:text-base mb-4">
                    Please transfer the total amount of PKR {total.toLocaleString()} to our account:
                  </p>
                  <ul className="list-disc list-inside text-gray-800 text-sm sm:text-base mb-4">
  
                     <li><strong>Account Name:</strong> Muhammad Azam Latif </li>
                    <li><strong>EasyPaisa Number:</strong> 03445288889</li>
                  </ul>
                  <p className="text-gray-700 text-sm sm:text-base mb-4">
                    After making the transfer, please upload a screenshot of the transaction or bank transfer receipt as proof of payment.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Transfer Screenshot/Receipt*
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={`w-full px-4 py-2 border ${errors.bankTransferProof ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                <div className="flex">
                  <input
                    name="promoCode"
                    value={form.promoCode}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-black focus:border-black"
                    placeholder="Enter promo code"
                  />
                  <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-r-md hover:bg-gray-300 transition">
                    Apply
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                  placeholder="Special instructions, delivery notes, etc."
                />
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="bg-[#fefaf9] p-6 rounded-lg shadow-sm lg:h-fit lg:sticky lg:top-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-6 pb-2 border-b">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                  <div key={item.id || index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-25 object-top rounded flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        
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
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {item.type && `${item.type} |`} {item.size} {item.lining ? '| Lining' : ''}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium mt-2 sm:mt-0 sm:ml-4">
                      PKR {(item.price * item.quantity).toLocaleString()}
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
                  <span className="text-sm">PKR {shippingCost.toLocaleString()}</span>
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

              <button
                onClick={placeOrder}
                disabled={loading || cartItems.length === 0 || convertingImage}
                className={`mt-6 w-full py-3 px-4 rounded-md font-medium text-base ${loading || cartItems.length === 0 || convertingImage ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'} transition`}
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
                  'Your Cart is Empty'
                ) : (
                  'Place Order'
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

export default CheckoutPage;