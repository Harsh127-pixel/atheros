'use client';

import { Check, Zap, Shield, Crown } from 'lucide-react';
import { useState } from 'react';

interface PricingProps {
  onSuccess: () => void;
  getToken: () => Promise<string | null>;
}

export default function Pricing({ onSuccess, getToken }: PricingProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscription = async (planId: string, amount: number, level: number) => {
    setLoading(planId);
    try {
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      
      // 1. Create Order
      const res = await fetch(`${backendUrl}/api/payments/order`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, planId })
      });
      const order = await res.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "AetherOS Pro",
        description: `Upgrade to ${planId}`,
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Verify Payment
          const verifyRes = await fetch(`${backendUrl}/api/payments/verify`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planLevel: level
            })
          });
          const result = await verifyRes.json();
          if (result.success) {
            alert('Congratulations! Your AetherOS account has been upgraded.');
            onSuccess();
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: {
          color: "#7c3aed",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      alert('Payment initialization failed');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'Pro',
      level: 1,
      price: 999,
      features: ['Priority Scan Queue', 'Unlimited Deployments', 'Custom Domains', '24/7 Shield Support'],
      icon: <Zap className="text-primary-light w-8 h-8" />,
      color: 'primary'
    },
    {
      id: 'Enterprise',
      level: 2,
      price: 4999,
      features: ['Dedicated Infrastructure', 'SLA Guarantee', 'Advanced RBAC', 'Deep Security Insights'],
      icon: <Crown className="text-yellow-400 w-8 h-8" />,
      color: 'yellow'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-12">
      {plans.map((plan) => (
        <div key={plan.id} className="glass p-8 rounded-3xl border-white/5 flex flex-col hover:border-primary-DEFAULT/30 transition-all duration-500 group">
          <div className="mb-6">{plan.icon}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{plan.id} Plan</h3>
          <p className="text-4xl font-extrabold text-white mb-6">₹{plan.price}<span className="text-sm text-slate-500 font-normal">/mo</span></p>

          <ul className="space-y-4 mb-8 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center space-x-3 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSubscription(plan.id, plan.price, plan.level)}
            disabled={loading !== null}
            className={`w-full py-4 rounded-xl font-bold transition-all duration-300 glow ${
              plan.id === 'Pro' ? 'bg-primary-DEFAULT hover:bg-primary-dark' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {loading === plan.id ? 'Processing...' : `Get ${plan.id}`}
          </button>
        </div>
      ))}
    </div>
  );
}
