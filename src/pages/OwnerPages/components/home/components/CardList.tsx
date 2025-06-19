import React from 'react';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

interface CardListProps {
    titleIcon: React.ReactNode;
    title: string;
    items: {
        name: string;
        image: string;
    }[];
}

const CardList: React.FC<CardListProps> = ({ titleIcon, title, items }) => {
    
    return (
        <div className="w-full p-2">
            <div className="flex flex-col">
                <div className="flex items-center space-x-2 text-[#D71E42] mb-3">
                    {titleIcon}
                    <h3 className="font-bold text-lg md:text-xl">{title}</h3>
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-2 snap-x snap-mandatory">
                    <div className="grid grid-cols-3 gap-2 justify-items-center">
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="flex-shrink-0 min-w-0 bg-white rounded-lg shadow-md snap-center"
                                >
                                    <div className="rounded-md overflow-hidden">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-20 md:h-48 object-cover text-4xs"
                                        />
                                    </div>
                                </div>
                                <p className="text-[#D71E42] font-extrabold text-center text-[8px] md:text-lg leading-none sm:text-xs mt-1">{item.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardList;