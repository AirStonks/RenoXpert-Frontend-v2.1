import React from 'react';

const Banner: React.FC = () => (
    <section className="property-banner">
        <div className="banner-table--cell">
            <div className="mog-container">
                <div className="property-banner--panel">
                    <h1 className="sub-title-text">THE MAKEOVER GUYS</h1>
                    <h2 className="title-text">
                        HOME <span className="yellow-text">INTERIOR DECORATORS</span> IN&nbsp;MALAYSIA
                    </h2>
                    <a href="https://www.themakeover.my/get-cost-estimate" className="learn-more-button">
                        Get A Free Cost Estimation
                    </a>
                </div>
            </div>
        </div>
        <video id="vid" autoPlay muted loop playsInline>
            <source src="https://www.themakeover.my/assets/Home/images/landing-v2.mp4" type="video/mp4" />
            <source src="https://www.themakeover.my/assets/Home/images/landing-v2.webm" type="video/webm" />
        </video>
    </section>
);

export default Banner;
