import type React from "react"
import { useState, useEffect } from "react"
import { HammerIcon, HomeIcon, ScrollTextIcon, UserIcon } from "lucide-react"

type NavItem = {
    icon: React.ReactNode
    label: string
    category: string
}

const navItems: NavItem[] = [
    {
        icon: <HomeIcon className="h-4 w-4 md:h-8 md:w-8" />,
        label: "Home",
        category: "home",
    },
    {
        icon: <ScrollTextIcon className="h-4 w-4 md:h-8 md:w-8" />,
        label: "Quotations",
        category: "quotations",
    },
    {
        icon: <HammerIcon className="h-4 w-4 md:h-8 md:w-8" />,
        label: "Reno Progress",
        category: "reno-progress",
    },
    {
        icon: <UserIcon className="h-4 w-4 md:h-8 md:w-8" />,
        label: "Profile",
        category: "profile",
    },
]

interface BottomNavProps {
    activeItem: string
    setActiveItem: React.Dispatch<React.SetStateAction<string>>
}

export function HomeBottomNav({ activeItem, setActiveItem }: BottomNavProps) {
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)
    const [isSmallScreen, setIsSmallScreen] = useState(false)

    useEffect(() => {
        // Check screen size on mount and on resize
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 768) // 768px is typically the 'md' breakpoint in Tailwind
        }

        checkScreenSize()
        window.addEventListener("resize", checkScreenSize)

        return () => {
            window.removeEventListener("resize", checkScreenSize)
        }
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Only apply scroll hiding behavior on small screens
            if (isSmallScreen) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling down and past initial 100px
                    setIsVisible(false)
                } else if (currentScrollY < lastScrollY) {
                    // Scrolling up
                    setIsVisible(true)
                }
            }
            setLastScrollY(currentScrollY)
        }

        window.addEventListener("scroll", handleScroll)

        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [lastScrollY, isSmallScreen])

    return (
        <nav
            className={`
                fixed bottom-0 left-0 z-30 w-full bg-white 
                shadow-[0_-2px_4px_rgba(0,0,0,0.05)]
                transition-transform duration-300 ease-in-out
                ${isVisible ? 'translate-y-0' : 'translate-y-full'}
            `}
        >
            <div className="mx-auto max-w-screen-xl">
                <div className="flex justify-around py-1.5 px-2 mb-2">
                    {navItems.map((item) => (
                        <button
                            key={item.category}
                            className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-colors duration-200 ${activeItem === item.category
                                    ? "text-[#D71E42] bg-[#d71e430f]"
                                    : "text-gray-500 hover:text-[#D71E42] hover:bg-[#d71e430f]"
                                }`}
                            onClick={() => setActiveItem(item.category)}
                        >
                            <div className="mb-0.5">{item.icon}</div>
                            <span className="text-2xs md:text-md font-medium leading-none">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    )
}