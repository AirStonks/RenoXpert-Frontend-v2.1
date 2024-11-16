import React from 'react';
// import { ChevronDown } from 'lucide-react';

// Types
interface ServiceWorkItem {
  imageUrl: string;
  galleryImages: string[];
  title: string;
  tooltip?: string;
}

interface ReasonItem {
  icon: string;
  topText?: string;
  majorText: string;
  minorText?: string;
  title: string;
  description: string;
}

interface CompanyLogo {
  logo: string;
  url: string;
  alt: string;
  className?: string;
}

// Components
const NavDropdown: React.FC<{ title: string; items: Array<{ text: string; url: string }> }> = ({ title, items }) => {
  return (
    <div className="relative group">
      <button className="flex items-center space-x-1">
        {title}
        {/* <ChevronDown className="w-4 h-4" /> */}
      </button>
      <div className="hidden group-hover:block absolute top-full left-0 bg-white shadow-lg">
        {items.map((item, index) => (
          <a key={index} href={item.url} className="block px-4 py-2 hover:bg-gray-100">
            {item.text}
          </a>
        ))}
      </div>
    </div>
  );
};

const ServiceWorkGallery: React.FC<{ items: ServiceWorkItem[] }> = ({ items }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <div key={index} className="relative group">
          <div 
            className="aspect-square bg-cover bg-center"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <button className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded">
                View Gallery
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ReasonCard: React.FC<ReasonItem> = ({ icon, topText, majorText, minorText, title, description }) => {
  return (
    <div className="text-center p-6">
      <div className="relative mb-4">
        <img src={icon} alt={title} className="mx-auto h-24" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          {topText && <div className="text-sm">{topText}</div>}
          <div className="text-3xl font-bold">{majorText}</div>
          {minorText && <div className="text-sm">{minorText}</div>}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const CompanyLogos: React.FC<{ logos: CompanyLogo[] }> = ({ logos }) => {
  return (
    <div className="flex flex-wrap justify-center items-center gap-8">
      {logos.map((logo, index) => (
        <a 
          key={index}
          href={logo.url}
          target="_blank"
          rel="noopener noreferrer"
          className={logo.className}
        >
          <img src={logo.logo} alt={logo.alt} className="h-12" />
        </a>
      ))}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const serviceWorkItems: ServiceWorkItem[] = [
    {
      imageUrl: "https://www.themakeover.my/assets/Home/images/our-work/ownstay/Sienna-Sunday/0-Cover.jpg",
      galleryImages: [
        "https://www.themakeover.my/assets/Home/images/our-work/ownstay/Sienna-Sunday/0-Cover.jpg",
        // Add other gallery images
      ],
      title: "Sienna Sunday",
      tooltip: "*Unit displayed above (650 sqft) is for ownstay purposes."
    },
    // Add other items
  ];

  const reasonItems: ReasonItem[] = [
    {
      icon: "https://www.themakeover.my/assets/Home/images/02_budget-friendly.svg",
      topText: "save",
      majorText: "70",
      minorText: "%",
      title: "Budget-Friendly Makeovers",
      description: "We spend only on essential materials in order to provide you with an affordable designer home."
    },
    // Add other items
  ];

  const companyLogos: CompanyLogo[] = [
    {
      logo: "https://www.themakeover.my/assets/Home/images/logo-mog-grey.svg",
      url: "#",
      alt: "The Makeover Guys",
      className: "tmog-logo"
    },
    // Add other logos
  ];

  return (
    <div className="grow content">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-20">
            <a href="/" className="flex items-center space-x-2">
              <img 
                src="https://www.themakeover.my/assets/Home/images/mog.png" 
                alt="The Makeover Guys" 
                className="h-12"
              />
            </a>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="/our-designs">OUR DESIGNS</a>
              <a href="/our-services">OUR SERVICES</a>
              <a href="/why-us">WHY US</a>
              <a href="/faq">FAQ</a>
              <NavDropdown 
                title="ABOUT US" 
                items={[
                  { text: "WHO WE ARE", url: "/about-us" },
                  { text: "CAREERS", url: "/careers" },
                  { text: "CONTACT US", url: "/contact" }
                ]} 
              />
              <NavDropdown 
                title="BLOG" 
                items={[
                  { text: "PROPERTY RESEARCH", url: "/property-research" },
                  { text: "PROPERTY TIPS", url: "/property-tips" }
                ]} 
              />
              <a href="/loan">LOAN</a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl mb-2">THE MAKEOVER GUYS</h2>
          <h1 className="text-4xl font-bold mb-8">
            HOME <span className="text-yellow-500">INTERIOR DECORATORS</span> IN MALAYSIA
          </h1>
          <a 
            href="/get-cost-estimate"
            className="inline-block bg-yellow-500 text-white px-8 py-3 rounded-lg text-lg font-semibold"
          >
            Get A Free Cost Estimation
          </a>
        </div>
      </section>

      {/* Service Work Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Experience Our <span className="text-yellow-500">Space Design</span>
          </h2>
          <ServiceWorkGallery items={serviceWorkItems} />
          <div className="text-center mt-8">
            <button className="px-8 py-3 bg-yellow-500 text-white rounded-lg">
              More Themes
            </button>
          </div>
        </div>
      </section>

      {/* Reasons Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose <span className="text-yellow-500">The Makeover Guys</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reasonItems.map((item, index) => (
              <ReasonCard key={index} {...item} />
            ))}
          </div>
          <div className="text-center mt-8">
            <a 
              href="/why-us"
              className="inline-block px-8 py-3 bg-yellow-500 text-white rounded-lg"
            >
              Why Us
            </a>
          </div>
        </div>
      </section>

      {/* Company Logos Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Our group of companies</h2>
          <CompanyLogos logos={companyLogos} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Get A Cost Estimation</h3>
              <div className="space-y-2">
                <a href="/get-cost-estimate" className="block hover:text-yellow-500">
                  Cost Estimation
                </a>
                <a href="/contact" className="block hover:text-yellow-500">
                  Contact Us
                </a>
              </div>
            </div>
            {/* Add other footer sections */}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between">
              <p>Copyright © The Makeover Guys Sdn Bhd (1125623-P) All rights reserved</p>
              <div className="space-x-4">
                <a href="/termofservice" className="hover:text-yellow-500">Term of service</a>
                <a href="/privacypolicy" className="hover:text-yellow-500">Privacy policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;