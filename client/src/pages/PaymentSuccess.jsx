import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isUkrainian = i18n.language === 'uk';

  useEffect(() => {
    // Show success notification
    toast.success(isUkrainian ? 'Оплата успішна!' : 'Payment successful!');
    
    // Redirect to profile after 5 seconds
    const timer = setTimeout(() => {
      navigate('/profile');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, isUkrainian]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">
          {isUkrainian ? 'Дякуємо за вашу оплату!' : 'Thank you for your payment!'}
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          {isUkrainian 
            ? 'Ваша підписка успішно активована.'
            : 'Your subscription has been successfully activated.'}
        </p>
        <p className="text-sm text-gray-500 mb-8">
          {isUkrainian 
            ? 'Ви будете перенаправлені на ваш профіль через 5 секунд...'
            : 'You will be redirected to your profile in 5 seconds...'}
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="btn btn-primary"
        >
          {isUkrainian ? 'Перейти до профілю' : 'Go to Profile'}
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;