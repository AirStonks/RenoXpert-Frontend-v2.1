import React from 'react';

interface PromoItem {
    title: string;
    description: string;
    link: string;
    buttonText: string;
}

const promoItems: PromoItem[] = [
    {
        title: 'Makeover Fiesta Starts Now!',
        description: 'Join the celebration and give your space the ultimate makeover with unbeatable deals and amazing FREE gifts!',
        link: 'https://www.themakeover.my/fiesta',
        buttonText: 'Learn more',
    },
    {
        title: 'Dream Home? No longer a dream',
        description: 'Renovate your dream home and split the installments up to 84 months. Rates from as low as 4.99% p.a. T&C apply.',
        link: 'https://www.themakeover.my/loan',
        buttonText: 'Learn more',
    },
    {
        title: 'Say hello to designer furniture',
        description: 'Furniture handpicked by our designers to bring your makeover to life.',
        link: 'https://www.dukdesign.com.my/',
        buttonText: 'Shop Now',
    },
    {
        title: 'Ease your cash flow with 0% Easy Payment Plan',
        description: 'Enjoy interest-free repayment up to 24 months with participating banks! T&C apply.',
        link: 'https://www.themakeover.my/redirectt?type=banner&redirectURL=https%3A%2F%2Fapi.whatsapp.com%2Fsend%3Fphone%3D60169003720%26text%3DHello%2C+I+am+interested+to+know+more+about+the+0%25+Interest+Easy+Payment+Instalment+Plan.+Tell+me+more%21',
        buttonText: 'Talk to us',
    },
];

const PromoBanner: React.FC = () => (
    <div className="mog-container promo-banner-section">
        <div className="row">
            <div className="col-md-8 col-sm-7 col-xs-12">
                <h2 className="title-text">
                    Where The Art Of Interior Decor Meets The Science Of Rental Investment
                </h2>
                <p className="description-text">
                    Looking for an interior decorator in Malaysia? We provide makeovers for both own stay and rental investment. Our makeovers are hassle-free and take around 30 working days to complete.
                </p>
                <a href="https://www.themakeover.my/our-services" className="learn-more-button">
                    Our Services
                </a>
            </div>
            <div className="col-md-4 col-sm-5 col-xs-12">
                <div className="landing-ads--slot">
                    {promoItems.map((item, index) => (
                        <div key={index} className="landing-ads--panel">
                            <h2>{item.title}</h2>
                            <p>{item.description}</p>
                            <a href={item.link} className="primary-btn2 left">{item.buttonText}</a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default PromoBanner;
