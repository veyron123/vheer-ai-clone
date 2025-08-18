import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

const PricingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const { data: plans } = useQuery('plans', () =>
    api.get('/subscriptions/plans').then(res => res.data)
  );

  const planIcons = {
    FREE: Sparkles,
    BASIC: Zap,
    PRO: Crown,
    ENTERPRISE: Building
  };

  const handleSelectPlan = (plan) => {
    if (!isAuthenticated) {
      navigate('/register');
    } else if (plan.id !== 'FREE') {
      // Navigate to payment page
      toast.info('Payment integration coming soon!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Start free and upgrade as you grow. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans?.map((plan, index) => {
            const Icon = planIcons[plan.id];
            const isPopular = plan.id === 'PRO';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${isPopular ? 'scale-105' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className={`card p-8 h-full flex flex-col ${isPopular ? 'ring-2 ring-primary-500' : ''}`}>
                  {/* Plan Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    plan.id === 'FREE' ? 'bg-gray-100 text-gray-600' :
                    plan.id === 'BASIC' ? 'bg-blue-100 text-blue-600' :
                    plan.id === 'PRO' ? 'bg-primary-100 text-primary-600' :
                    'bg-primary-100 text-primary-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">/month</span>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="mb-6 pb-6 border-b">
                    <p className="text-lg font-medium">
                      {plan.credits} credits
                    </p>
                    <p className="text-sm text-gray-600">
                      {plan.id === 'FREE' ? 'per day' : 'per month'}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 rounded-lg font-medium transition mt-auto ${
                      plan.id === 'FREE' 
                        ? 'btn btn-outline'
                        : isPopular
                        ? 'btn btn-primary'
                        : 'btn btn-secondary'
                    }`}
                  >
                    {plan.id === 'FREE' ? 'Get Started' : 'Upgrade Now'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold mb-2">What are credits?</h3>
              <p className="text-gray-600">
                Credits are used to generate images. Each image generation consumes credits based on the model and settings used. 
                Higher quality models and larger images require more credits.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-2">Can I change my plan anytime?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any payments.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-2">Do unused credits roll over?</h3>
              <p className="text-gray-600">
                Credits reset each month and don't roll over. However, you can purchase additional credit packs 
                that never expire.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                Yes! Every new user gets 100 free credits to try our service. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;