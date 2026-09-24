'use client';

import React, { useState } from 'react';
import styles from './PricingSection.module.css';
import { Check, Sparkles, Zap, ArrowRight, Shield } from 'lucide-react';

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState('yearly');

  const plans = [
    {
      id: 'free',
      name: 'Free Explorer',
      badge: 'Starter',
      priceMonthly: 0,
      priceYearly: 0,
      description: 'Essential AI cognitive assistance for students beginning their learning journey.',
      features: [
        '30 daily neural queries',
        'Standard voice tutoring (5 mins/day)',
        'Basic step-by-step math solver',
        'Access to core STEM knowledge base',
        'Community Discord support'
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      id: 'pro',
      name: 'Vedika Pro',
      badge: 'Most Popular',
      priceMonthly: 24,
      priceYearly: 18,
      description: 'Complete multimodal cognitive intelligence for dedicated learners, researchers, and exam candidates.',
      features: [
        'Unlimited full-duplex voice sessions',
        'High-resolution camera & proof solver',
        'Persistent skill graph & memory',
        'Adaptive Feynman Socratic drills',
        'Priority sub-200ms inference cluster',
        'Olympiad & SAT prep deep modules',
        'Personalized error diagnosis dossier'
      ],
      cta: 'Claim 14-Day Free Pro',
      popular: true
    },
    {
      id: 'campus',
      name: 'Campus / Lab',
      badge: 'Institutional',
      priceMonthly: 79,
      priceYearly: 65,
      description: 'For university study groups, tutoring centers, and high-performance academic labs.',
      features: [
        'Up to 10 collaborative student seats',
        'Custom syllabus & textbook ingestion',
        'Cohort retention & friction analytics',
        'Canvas & Blackboard LMS integration',
        'Dedicated API access & webhook events',
        '1-on-1 pedagogical onboarding'
      ],
      cta: 'Deploy for Campus',
      popular: false
    }
  ];

  return (
    <section id="pricing" className={styles.pricingSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>
            <Zap size={14} />
            <span>TRANSPARENT PLANS</span>
          </div>
          <h2 className={styles.title}>
            Invest in <span className={styles.glow}>Cognitive Acceleration</span>
          </h2>
          <p className={styles.subtitle}>
            Start free, upgrade when you require unlimited voice streaming and personalized knowledge graph tracking.
          </p>

          {/* Billing Switch */}
          <div className={styles.billingToggle}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${billingCycle === 'monthly' ? styles.toggleActive : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${billingCycle === 'yearly' ? styles.toggleActive : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              <span>Annual Billing</span>
              <span className={styles.saveBadge}>Save 25%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={styles.pricingGrid}>
          {plans.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            return (
              <div
                key={plan.id}
                className={`${styles.planCard} ${plan.popular ? styles.popularCard : ''}`}
              >
                {plan.popular && (
                  <div className={styles.featuredBadge}>
                    <Sparkles size={13} />
                    <span>RECOMMENDED</span>
                  </div>
                )}

                <div className={styles.planHeader}>
                  <span className={styles.planTag}>{plan.badge}</span>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <p className={styles.planDesc}>{plan.description}</p>
                </div>

                <div className={styles.priceContainer}>
                  <div className={styles.priceRow}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.priceAmount}>{price}</span>
                    <span className={styles.period}>/month</span>
                  </div>
                  {billingCycle === 'yearly' && price > 0 && (
                    <span className={styles.billedYearlyNotice}>Billed annually ($ {price * 12}/yr)</span>
                  )}
                </div>

                <button
                  type="button"
                  className={`${styles.planCta} ${plan.popular ? styles.popularCta : ''}`}
                  onClick={() => {
                    const el = document.getElementById('demo');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight size={15} />
                </button>

                <div className={styles.featureDivider} />

                <div className={styles.featureList}>
                  <span className={styles.featuresHeading}>Everything included:</span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className={styles.featureItem}>
                      <div className={styles.checkWrap}>
                        <Check size={14} className={styles.checkIcon} />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Money back guarantee reassurance */}
        <div className={styles.guaranteeNote}>
          <Shield size={16} className={styles.shieldIcon} />
          <span>All paid plans come with a 14-day zero-risk money-back guarantee. Cancel anytime with 1 click.</span>
        </div>
      </div>
    </section>
  );
}
