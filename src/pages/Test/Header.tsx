import React from 'react';

const Header: React.FC = () => (
    <header>
        <a href="https://www.themakeover.my/" className="logo">
            <img
                src="https://www.themakeover.my/assets/Home/images/mog.png?v=20211105"
                alt="Mog face in black and white colour"
                style={{ width: '180px', height: '580px' }}
            />
            <img
                src="https://www.themakeover.my/assets/Home/images/inverted-mog.png?v=20211105"
                alt="The Makeover Guys logo"
                style={{ width: '180px', height: '580px' }}
            />
        </a>
        <nav className="mog-container">
            <div className="mog-wrapper mog-nav">
                <a href="#" className="mobile-menu--btn">
                    Menu
                    <span>
                        <i className="icon3-chevron-down" />
                        <i className="icon3-chevron-up" />
                    </span>
                </a>
                <nav className="row">
                    <a href="https://www.themakeover.my/our-designs">OUR DESIGNS</a>
                    <a href="https://www.themakeover.my/our-services">OUR SERVICES</a>
                    <a href="https://www.themakeover.my/why-us">WHY US</a>
                    <a href="https://www.themakeover.my/faq">FAQ</a>
                </nav>
            </div>
        </nav>
    </header>
);

export default Header;
