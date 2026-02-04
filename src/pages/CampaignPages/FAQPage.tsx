import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { KTAccordion } from '../../metronic/core';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        id: 'management-fee',
        question: 'Do you charge a management fee?',
        answer: `No, we don't. At BeLive Management, we believe in keeping things simple and transparent—so we charge 0% management fee and do not take any percentage from your rental income.`
    },
    {
        id: 'cleaning-fee',
        question: 'Is there a cleaning fee?',
        answer: `Yes, there is a cleaning fee. For homes with 3–5 rooms, it starts from RM299 per month, which includes professional cleaning twice a week (8 times monthly).`
    },
    {
        id: 'system-fee',
        question: 'What is the system fee for?',
        answer: `The system and payment gateway fee starts from RM120 per month for 3–5 room units, supporting smooth daily operations and tenant management.`
    },
    {
        id: 'marketing-fee',
        question: 'Do you charge a marketing fee?',
        answer: `Yes. We charge a one-time marketing fee equivalent to one (1) month's rent when a tenant is successfully secured. If a tenant runs away, the marketing fee will be pro-rated, and we will refund the remaining balance to you.`
    },
    {
        id: 'service-handling',
        question: 'What do you handle as part of your service?',
        answer: `We take care of the entire rental journey, from marketing and viewings to tenant care, renewals, and move-outs—so you can stay hands-off.`
    },
    {
        id: 'maintenance',
        question: 'How is maintenance of my unit are being managed?',
        answer: `Maintenance is fully taken care of for you. We provide 24-hour maintenance support, including emergencies, and manage everything from coordination to urgent repairs.`
    },
    {
        id: 'electricity',
        question: 'What about electricity bills?',
        answer: `We cover 100% of the electricity cost and handle payment on your behalf—no tracking, no reminders.`
    },
    {
        id: 'wifi',
        question: 'Do you help with WiFi?',
        answer: `Yes. The WiFi cost is paid by the owner, but we'll handle the setup, registration, and ongoing management for you—so it's one less thing to think about.`
    },
    {
        id: 'benefits',
        question: 'What are other benefits joining BeLive Co-Living?',
        answer: `We provide Smart Locks and Smart Meters on a lease basis for as long as you are with us—no strings attached—to enhance safety and peace of mind.`
    },
    {
        id: 'contract-period',
        question: 'What is the contract period?',
        answer: `Our standard contract period is two (2) years, designed to provide stability while allowing enough time for your unit to perform optimally.`
    },
    {
        id: 'self-manage',
        question: 'What if I decide to self-manage myself?',
        answer: `You may end the service by giving three (3) months' written notice, with no penalty, as long as any outstanding matters have been settled. We believe in giving owners the flexibility to make decisions that best suit their needs.`
    }
];

const FAQPage = () => {
    const { campaignSlug } = useParams<{ campaignSlug: string }>();

    useEffect(() => {
        KTAccordion.init();
    }, []);

    const formatAnswer = (answer: string) => {
        return answer.split('\n\n').map((paragraph, index) => {
            if (paragraph.trim() === '') {
                return null;
            }
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
        <div className='w-full h-max'>
            <div className="w-full h-full bg-gradient-to-br from-white via-gray-50 to-blue-50">
                {/* Header with Logo */}
                <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <img
                                    src="/app/RenoExpert_logo-01.svg"
                                    alt="RenoXpert Logo"
                                    className="h-8 sm:h-10 w-auto"
                                />
                                <div className="ml-3 sm:ml-4">
                                    <h1 className="text-base sm:text-lg font-semibold text-gray-900">FAQ</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            to={`/campaigns/${campaignSlug}`}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Campaign</span>
                        </Link>

                        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                            
                            <div data-accordion="true">
                                {faqData.map((faq, index) => (
                                    <div 
                                        key={faq.id}
                                        className="accordion-item [&:not(:last-child)]:border-b border-b-gray-200" 
                                        data-accordion-item="true" 
                                        id={`faq_item_${index + 1}`}
                                    >
                                        <button 
                                            className="accordion-toggle py-4 group w-full text-left flex items-center justify-between" 
                                            data-accordion-toggle={`#faq_content_${index + 1}`}
                                        >
                                            <span className="text-base text-gray-900 font-medium pr-4">
                                                {faq.question}
                                            </span>
                                            <div className="flex-shrink-0">
                                                <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                            </div>
                                        </button>
                                        <div 
                                            className="accordion-content hidden" 
                                            id={`faq_content_${index + 1}`}
                                        >
                                            <div className="text-gray-700 text-md pb-4">
                                                {formatAnswer(faq.answer)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
