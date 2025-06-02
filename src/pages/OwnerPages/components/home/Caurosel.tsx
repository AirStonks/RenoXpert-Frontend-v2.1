import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CauroselCard, { CardContent } from './CauroselCard';

interface CarouselItem {
    id: number;
    title: string;
    description: string;
    image: string;
}

const carouselData: CarouselItem[] = [
    {
        id: 1,
        title: "Experience Innovation",
        description: "Discover our latest products and how they're changing the game.",
        image: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
        id: 2,
        title: "Unmatched Quality",
        description: "Craftsmanship and attention to detail in everything we make.",
        image: "https://images.pexels.com/photos/9811024/pexels-photo-9811024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
        id: 3,
        title: "Sustainable Future",
        description: "Our commitment to environmental responsibility and innovation.",
        image: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    }
];

const Carousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            goToNext();
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex]);

    const goToPrevious = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? carouselData.length - 1 : prevIndex - 1
        );
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const goToNext = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prevIndex) =>
            prevIndex === carouselData.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const goToSlide = (index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="relative w-full overflow-hidden rounded-xl">
                <div className="relative w-full h-[200px] md:h-[500px]">
                    {carouselData.map((item, index) => (
                        <CauroselCard
                            key={item.id}
                            className={`absolute w-full h-full transition-opacity duration-500 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                }`}
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center rounded-xl"
                                style={{ backgroundImage: `url(${item.image})` }}
                            >
                                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl" />
                            </div>

                            <CardContent className="relative h-full flex items-center z-10">
                                <div className="max-w-lg text-white">
                                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                                        {item.title}
                                    </h2>
                                    <p className="text-xl mb-8">
                                        {item.description}
                                    </p>
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors">
                                        Learn More
                                    </button>
                                </div>
                            </CardContent>
                        </CauroselCard>
                    ))}
                </div>

                <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                    aria-label="Next slide"
                >
                    <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                    {carouselData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Carousel;