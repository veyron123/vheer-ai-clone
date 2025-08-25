import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft } from 'lucide-react';
import useCartStore from '../stores/cartStore';

const CartPaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCartStore();
  
  const orderReference = searchParams.get('orderReference');
  
  useEffect(() => {
    // Clear cart on successful payment
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600">
              Your order has been processed successfully
            </p>
          </div>

          {/* Order Details */}
          {orderReference && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Package className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
              </div>
              <p className="text-gray-600">
                <span className="font-medium">Order Reference:</span> {orderReference}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You will receive a confirmation email shortly with your order details.
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              What's Next?
            </h3>
            <ul className="text-blue-800 space-y-2">
              <li>• We will process your frame poster order</li>
              <li>• You'll receive tracking information via email</li>
              <li>• Estimated delivery: 5-7 business days</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Continue Creating
            </Link>
            
            <div className="text-sm text-gray-500">
              Need help? Contact us at support@vheer.ai
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPaymentSuccessPage;