import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Plus, Minus, Trash2, ShieldCheck, Image } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import toast from 'react-hot-toast';
import axios from 'axios';

// Компонент для изображения товара с обработкой ошибок
const CartItemImage = ({ src, alt }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Функция для повторной попытки загрузки
  const retryLoad = () => {
    if (retryCount < 2) { // Максимум 2 попытки
      setImageError(false);
      setLoading(true);
      setRetryCount(prev => prev + 1);
    }
  };

  // Сброс состояния при изменении src
  useEffect(() => {
    console.log('CartItemImage - новое изображение:', src);
    console.log('Тип URL:', src?.startsWith('data:') ? 'data URL' : src?.startsWith('blob:') ? 'blob URL' : src?.includes('cloudinary.com') ? 'Cloudinary URL' : src?.startsWith('http') ? 'http URL' : 'неизвестный');
    setImageError(false);
    setLoading(true);
    setRetryCount(0);
  }, [src]);

  if (!src) {
    console.log('CartItemImage - нет src');
    return (
      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
          <Image className="w-8 h-8 text-gray-400" />
          <span className="text-xs text-gray-400 ml-1">No src</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
      {loading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {imageError && retryCount >= 2 ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 p-1">
          <Image className="w-4 h-4 text-gray-400 mb-1" />
          <span className="text-xs text-gray-400 text-center leading-tight">
            Image unavailable
          </span>
          <span className="text-xs text-gray-300 text-center leading-tight mt-1">
            ({src?.startsWith('data:') ? 'data URL' : src?.startsWith('blob:') ? 'blob URL' : src?.includes('cloudinary.com') ? 'Cloudinary' : 'http URL'})
          </span>
        </div>
      ) : (
        <img
          key={`${src}-${retryCount}`} // Принудительное обновление при retry
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={() => {
            setLoading(false);
            setImageError(false);
          }}
          onError={(e) => {
            const errorSrc = e.target.src;
            console.log('Image load error details:', {
              src: errorSrc,
              type: errorSrc?.startsWith('data:') ? 'data URL' : errorSrc?.startsWith('blob:') ? 'blob URL' : errorSrc?.includes('cloudinary.com') ? 'Cloudinary URL' : 'http URL',
              retryCount: retryCount,
              error: e
            });
            setLoading(false);
            
            if (retryCount < 2) {
              console.log(`Попытка ${retryCount + 1}/2 загрузки изображения`);
              // Задержка перед повторной попыткой
              setTimeout(() => {
                retryLoad();
              }, 1000);
            } else {
              console.log('Все попытки загрузки исчерпаны, показываем заглушку');
              setImageError(true);
            }
          }}
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

const Cart = () => {
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity, 
    clearCart,
    getTotal,
    getItemCount 
  } = useCartStore();
  
  // Генерируем или получаем ID сессии
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('cartSessionId');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cartSessionId', id);
    }
    return id;
  });

  // Отправляем данные корзины на сервер при изменениях
  useEffect(() => {
    const saveCartToServer = async () => {
      if (items.length > 0) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/carts/save`, {
            sessionId,
            items,
            totalAmount: getTotal(),
            itemCount: getItemCount(),
            currency: 'USD'
          });
        } catch (error) {
          console.error('Ошибка сохранения корзины:', error);
        }
      }
    };
    
    // Сохраняем с задержкой, чтобы не спамить сервер
    const timeoutId = setTimeout(saveCartToServer, 1000);
    return () => clearTimeout(timeoutId);
  }, [items, sessionId, getTotal, getItemCount]);
  
  const handleCheckout = async () => {
    try {
      toast.loading('Preparing secure checkout...', {
        icon: '🔒',
        id: 'checkout-loading'
      });

      // Get user data from localStorage if available
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      // Track initiate checkout with Facebook Pixel
      if (window.fbq && items.length > 0) {
        window.fbq("track", "InitiateCheckout", {
          content_name: "Cart Checkout",
          value: 1.00,
          currency: "USD",
          content_ids: items.map(item => item.id),
          content_type: "product",
          num_items: items.length
        });
        console.log("Facebook Pixel: InitiateCheckout tracked");
      }

      // Prepare cart data for WayForPay with complete item details
      const cartData = {
        items: items.map(item => ({
          name: `Frame Poster - ${item.frameColorName || item.frameColor} - ${item.sizeName || item.size}`,
          price: item.price,
          quantity: item.quantity,
          // Include all item details for proper order tracking
          frameColor: item.frameColor,
          frameColorName: item.frameColorName,
          size: item.size,
          sizeName: item.sizeName,
          imageUrl: item.imageUrl,
          design: item.design,
          // Include any other relevant item properties
          ...item
        })),
        total: getTotal(),
        currency: 'USD', // Changed to USD
        // Include user information if available
        userInfo: user ? {
          email: user.email,
          fullName: user.fullName || user.username,
          id: user.id
        } : null
      };

      console.log('Checkout items:', items);
      console.log('Cart data for WayForPay:', cartData);

      // Call backend to initialize WayForPay payment  
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Include auth token if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/payments/wayforpay/cart-checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Redirecting to secure payment...', {
          icon: '🔒',
          id: 'checkout-loading',
          duration: 2000
        });
        
        // Помечаем корзину как в процессе оплаты
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/carts/save`, {
            sessionId,
            items,
            totalAmount: getTotal(),
            itemCount: getItemCount(),
            currency: 'USD',
            status: 'checkout_started'
          });
        } catch (error) {
          console.error('Ошибка обновления статуса корзины:', error);
        }

        // Don't track purchase here - we'll track it on the success page
        // This avoids duplicate tracking and ensures we get real payment amounts
        if (window.fbq && items.length > 0) {
          console.log("Facebook Pixel: Purchase will be tracked on success page");
        }

        // Create and submit form to WayForPay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://secure.wayforpay.com/pay';
        form.target = '_blank'; // Open in new tab

        // Add all WayForPay parameters as hidden inputs
        Object.entries(result.paymentData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = Array.isArray(value) ? value.join(',') : value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initialize payment. Please try again.', {
        icon: '❌',
        id: 'checkout-loading',
        duration: 4000
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />

          {/* Cart Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Cart ({getItemCount()})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Your cart is empty</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Add mockups to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-white border rounded-lg overflow-hidden"
                    >
                      <div className="flex gap-4 p-4">
                        {/* Product Image */}
                        <CartItemImage 
                          src={item.imageUrl} 
                          alt="Frame Poster" 
                        />

                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            Frame Poster
                          </h3>
                          <div className="text-sm text-gray-500 mt-1 space-y-1">
                            <p>Frame Color: {item.frameColorName || item.frameColor}</p>
                            <p>Size: {item.sizeName || item.size}</p>
                            <p>Aspect Ratio: {item.aspectRatio}</p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-3 py-1 text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                removeItem(item.id);
                                toast.success('Item removed from cart');
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-500">
                              ${item.price.toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Totals and Checkout */}
            {items.length > 0 && (
              <div className="border-t p-6 space-y-4">
                {/* Clear Cart Button */}
                <button
                  onClick={() => {
                    if (window.confirm('Clear all items from cart?')) {
                      clearCart();
                      toast.success('Cart cleared');
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear Cart
                </button>

                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Secure Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShieldCheck className="w-5 h-5" />
                  SECURE CHECKOUT
                </button>

                {/* Security Notice */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Secure payment via WayForPay</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;