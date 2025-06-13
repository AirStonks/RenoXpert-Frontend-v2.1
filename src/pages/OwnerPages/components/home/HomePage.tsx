import React, { useState, useEffect } from 'react'
import Carousel from './components/Carousel'
import Showcase from './components/Showcase'
import CardList from './components/CardList'
import { LayersIcon } from 'lucide-react'

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

const projects1 = [
    { name: "Nexus Taman Pertama", image: MEDIA_URL + "owner-home/nexus_taman_pertama.jpg" },
    { name: "The Harmony OKR", image: MEDIA_URL + "owner-home/the_harmony.jpg" },
    { name: "D'Erica Residences", image: MEDIA_URL + "owner-home/d_erica_residences.png" },
];

const projects2 = [
    { name: "M Vertica Residences", image: MEDIA_URL + "owner-home/m_vertica_residences.png" },
    { name: "Meta City", image: MEDIA_URL + "owner-home/meta_city.png" },
    { name: "Vivo Exclusive Apartment", image: MEDIA_URL + "owner-home/vivo_apartment.png" },
];



function HomePage() {
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simulate loading delay
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 750)
        return () => clearTimeout(timer)
    }, [])

    if (isLoading) {
        return (
            <div className="container px-4">
                {/* Carousel Skeleton */}
                <div className="mx-auto">
                    <div className="relative w-full h-[200px] md:h-[300px] bg-gray-200 animate-pulse rounded-xl" />
                    <div className="flex justify-center mt-3 space-x-1">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse" />
                        ))}
                    </div>
                </div>

                <hr className="my-2" />

                {/* Showcase Skeleton */}
                <div className="flex justify-center w-full rounded-lg">
                    <div className="rounded-lg h-[240px] w-full max-w-md bg-gray-200 animate-pulse" />
                </div>

                <hr className="my-2" />

                {/* CardList Skeleton for Upcoming Projects */}
                <div className="w-full p-2">
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-5 h-5 bg-gray-200 animate-pulse" />
                        <div className="h-6 w-40 bg-gray-200 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-3 gap-1 justify-items-center">
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div className="w-24 h-16 md:w-32 md:h-20 bg-gray-200 animate-pulse rounded-lg" />
                                <div className="h-3 w-20 bg-gray-200 animate-pulse mt-1 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* CardList Skeleton for Current Projects */}
                <div className="w-full p-2">
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-5 h-5 bg-gray-200 animate-pulse" />
                        <div className="h-6 w-40 bg-gray-200 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-3 gap-1 justify-items-center">
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div className="w-24 h-16 md:w-32 md:h-20 bg-gray-200 animate-pulse rounded-lg" />
                                <div className="h-3 w-20 bg-gray-200 animate-pulse mt-1 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container px-4">
            <Carousel />


            <Showcase />


            <CardList
                titleIcon={<LayersIcon size={20} />}
                title="UPCOMING PROJECT"
                items={projects1}
            />

            <CardList
                titleIcon={<LayersIcon size={20} />}
                title="CURRENT PROJECT"
                items={projects2}
            />
        </div>
    )
}

export default HomePage