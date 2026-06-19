import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { KTAccordion } from '../../metronic/core';
import { CampaignHeader } from './components/CampaignHeader';
import { Card } from './components/Card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  { id: 'management-fee', question: 'Do you charge a management fee?', answer: `No, we don't. At BeLive Management, we believe in keeping things simple and transparent—so we charge 0% management fee and do not take any percentage from your rental income.` },
  { id: 'cleaning-fee', question: 'Is there a cleaning fee?', answer: `Yes, there is a cleaning fee. For homes with 3–5 rooms, it starts from RM299 per month, which includes professional cleaning twice a week (8 times monthly).` },
  { id: 'system-fee', question: 'What is the system fee for?', answer: `The system and payment gateway fee starts from RM120 per month for 3–5 room units, supporting smooth daily operations and tenant management.` },
  { id: 'marketing-fee', question: 'Do you charge a marketing fee?', answer: `Yes. We charge a one-time marketing fee equivalent to one (1) month's rent when a tenant is successfully secured. If a tenant runs away, the marketing fee will be pro-rated, and we will refund the remaining balance to you.` },
  { id: 'service-handling', question: 'What do you handle as part of your service?', answer: `We take care of the entire rental journey, from marketing and viewings to tenant care, renewals, and move-outs—so you can stay hands-off.` },
  { id: 'maintenance', question: 'How is maintenance of my unit are being managed?', answer: `Maintenance is fully taken care of for you. We provide 24-hour maintenance support, including emergencies, and manage everything from coordination to urgent repairs.` },
  { id: 'electricity', question: 'What about electricity bills?', answer: `We cover 100% of the electricity cost and handle payment on your behalf—no tracking, no reminders.` },
  { id: 'wifi', question: 'Do you help with WiFi?', answer: `Yes. The WiFi cost is paid by the owner, but we'll handle the setup, registration, and ongoing management for you—so it's one less thing to think about.` },
  { id: 'benefits', question: 'What are other benefits joining BeLive Co-Living?', answer: `We provide Smart Locks and Smart Meters on a lease basis for as long as you are with us—no strings attached—to enhance safety and peace of mind.` },
  { id: 'contract-period', question: 'What is the contract period?', answer: `Our standard contract period is two (2) years, designed to provide stability while allowing enough time for your unit to perform optimally.` },
  { id: 'self-manage', question: 'What if I decide to self-manage myself?', answer: `You may end the service by giving three (3) months' written notice, with no penalty, as long as any outstanding matters have been settled. We believe in giving owners the flexibility to make decisions that best suit their needs.` },
];

const FAQPage = () => {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();

  useEffect(() => {
    KTAccordion.init();
  }, []);

  const formatAnswer = (answer: string) => {
    return answer.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      return (
        <p key={index} className="mb-3 last:mb-0">
          {paragraph.trim().split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {line.trim()}
              {lineIndex < paragraph.trim().split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <CampaignHeader title="FAQ" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          to={`/campaigns/${campaignSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campaign</span>
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Frequently asked questions</h1>
        <p className="text-slate-500 mt-2">Everything about fees, services and contracts.</p>

        <Card className="mt-8 px-5 sm:px-7 py-2">
          <div data-accordion="true">
            {faqData.map((faq, index) => (
              <div
                key={faq.id}
                className="accordion-item [&:not(:last-child)]:border-b border-slate-100"
                data-accordion-item="true"
                id={`faq_item_${index + 1}`}
              >
                <button
                  className="accordion-toggle py-5 w-full text-left flex items-center justify-between gap-4"
                  data-accordion-toggle={`#faq_content_${index + 1}`}
                >
                  <span className="text-base font-semibold text-slate-900">{faq.question}</span>
                  <span className="shrink-0 h-7 w-7 rounded-full grid place-items-center bg-slate-100 text-slate-400 accordion-active:bg-campaign-50 accordion-active:text-campaign">
                    <Plus className="h-4 w-4 accordion-active:hidden block" />
                    <Minus className="h-4 w-4 accordion-active:block hidden" />
                  </span>
                </button>
                <div className="accordion-content hidden" id={`faq_content_${index + 1}`}>
                  <div className="text-slate-500 leading-relaxed pb-5">{formatAnswer(faq.answer)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FAQPage;
