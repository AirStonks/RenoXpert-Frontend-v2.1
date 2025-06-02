import type React from "react"
import { useState } from "react"
import { HammerIcon, HomeIcon, PaperclipIcon, UserIcon } from "lucide-react"

type NavItem = {
    icon: React.ReactNode
    label: string
    category: string
}

const navItems: NavItem[] = [
    {
        icon: <HomeIcon className="h-4 w-4" />,
        label: "Home",
        category: "home",
    },
    {
        icon: <PaperclipIcon className="h-4 w-4" />,
        label: "Quotations",
        category: "quotation",
    },
    {
        icon: <HammerIcon className="h-4 w-4" />,
        label: "Reno Progress",
        category: "reno_progress",
    },
    {
        icon: <UserIcon className="h-4 w-4" />,
        label: "Profile",
        category: "profile",
    },
]

interface BottomNavProps {
    activeItem: string
    setActiveItem: React.Dispatch<React.SetStateAction<string>>
}

export function HomeBottomNav({ activeItem, setActiveItem }: BottomNavProps) {

    return (
        <nav className="fixed bottom-0 left-0 z-35 w-full bg-white shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
            <div className="mx-auto max-w-screen-xl mb-2">
                <div className="flex justify-around py-1.5 px-2">
                    {navItems.map((item) => (
                        <button
                            key={item.category}
                            className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-colors duration-200 ${activeItem === item.category
                                ? "text-blue-600 bg-blue-50"
                                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                }`}
                            onClick={() => setActiveItem(item.category)}
                        >
                            <div className="mb-0.5">{item.icon}</div>
                            <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav >
    )
}