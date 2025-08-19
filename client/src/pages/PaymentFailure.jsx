import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isUkrainian = i18n.language === 'uk';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">
          {isUkrainian ? 'Оплата не вдалася' : 'Payment Failed'}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {isUkrainian 
            ? 'На жаль, ваша оплата не була завершена. Будь ласка, спробуйте ще раз.'
            : 'Unfortunately, your payment was not completed. Please try again.'}
        </p>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/pricing')}
            className="btn btn-primary"
          >
            {isUkrainian ? 'Спробувати знову' : 'Try Again'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline"
          >
            {isUkrainian ? 'На головну' : 'Go Home'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;