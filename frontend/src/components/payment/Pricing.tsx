'use client';

import { Check, Zap, Shield, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Plan {
  id: string;
  level: number;
  price: number;
  features: string[];
  icon: string;
  color: string;
}

interface PricingProps {
  onSuccess: () => void;
  getToken: () => Promise<string | null>;
}

export default function Pricing({ onSuccess, getToken }: PricingProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fetching, setFetching] = useState(true);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Zap': return <Zap className="text-primary-light w-8 h-8" />;
      case 'Crown': return <Crown className="text-yellow-400 w-8 h-8" />;
      default: return <Shield className="text-slate-400 w-8 h-8" />;
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) return;
        const res = await fetch(`${backendUrl}/api/config/plans`);
        const data = await res.json();
        setPlans(data);
      } catch (e) {
        console.error('Failed to fetch plans', e);
      } finally {
        setFetching(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscription = async (planId: string, amount: number, level: number) => {
    setLoading(planId);
    try {
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) throw new Error('Backend URL not configured');
      
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

  if (fetching) {
    return <div className="text-center py-12 text-slate-400">Loading plans...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-12">
      {plans.map((plan) => (
        <div key={plan.id} className="glass p-8 rounded-3xl border-white/5 flex flex-col hover:border-primary-DEFAULT/30 transition-all duration-500 group">
          <div className="mb-6">{getIcon(plan.icon)}</div>
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
