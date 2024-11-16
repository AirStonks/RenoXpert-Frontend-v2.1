import React from 'react';

interface LinkItem {
    label: string;
    url: string;
}

const productServicesLinks: LinkItem[] = [
    { label: 'Our Designs', url: 'https://www.themakeover.my/our-designs' },
    { label: 'What We Offer', url: 'https://www.themakeover.my/our-services' },
    { label: 'Why Us', url: 'https://www.themakeover.my/why-us' },
    { label: 'The Makeover Care', url: 'https://www.themakeover.my/makeover-care' },
];

const Footer: React.FC = () => (
    <footer>
        <div className="mog-container">
            <div className="row">
                <div className="col-md-6">
                    <img
                        src="https://www.themakeover.my/assets/Home/images/mog-face.png?v=20211105"
                        alt="Face of TMOG"
                        style={{ width: '180px', height: '580px' }}
                    />
                    <div className="footer-title">Get A Cost Estimation</div>
                    <address>
                        <a href="https://www.themakeover.my/get-cost-estimate">Cost Estimation</a>
                        <a href="https://www.themakeover.my/contact">Contact Us</a>
                    </address>
                    <div className="footer-soc-media">
                        <div className="footer-title">Connect With Us</div>
                        <ul>
                            <li><a href="https://www.facebook.com/themakeover.my/" target="_blank" rel="noreferrer"><i className="icon3-fb"></i></a></li>
                            <li><a href="https://www.instagram.com/themakeover.my/" target="_blank" rel="noreferrer"><i className="icon3-insta"></i></a></li>
                            <li><a href="https://www.youtube.com/c/themakeoverguys" target="_blank" rel="noreferrer"><i className="icon3-youtube"></i></a></li>
                        </ul>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="footer-title">Product & Services</div>
                    <ul>
                        {productServicesLinks.map((link, index) => (
                            <li key={index}><a href={link.url}>{link.label}</a></li>
                        ))}
                    </ul>
                </div>
            </div>
            <hr />
            <div className="footer-copyright">
                &copy; The Makeover Guys Sdn Bhd (1125623-P) All rights reserved
            </div>
            <div className="footer-links">
                <a href="https://www.themakeover.my/termofservice">Terms of Service</a>
                <a href="https://www.themakeover.my/privacypolicy">Privacy Policy</a>
            </div>
        </div>
    </footer>
);

export default Footer;
