import type React from "react"

import { useState, useEffect, useRef } from "react"
import { CheckCircle, Clock, AlertCircle, XCircle, HelpCircle, ChevronDown } from 'lucide-react'

interface TaskStatusBadgeProps {
    statusConfig: Record<string, { label: string; icon: any; bgColor: string; textColor: string; iconColor: string; hoverColor: string }>
    statusOptions: string[]
    status: string
    isStatic?: boolean
    disabled?: boolean
    onStatusChange?: (newStatus: string) => void
}

export function StatusBadge({ statusConfig, statusOptions, status, isStatic = false, disabled, onStatusChange }: TaskStatusBadgeProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const badgeRef = useRef<HTMLButtonElement>(null)

    const config = statusConfig[status] || statusConfig["not-applicable"]
    const Icon = config.icon

    const handleBadgeClick = () => {
        if (!isStatic) {
            setIsDropdownOpen(!isDropdownOpen)
        }
    }

    const handleStatusSelect = (newStatus: string) => {
        if (onStatusChange) {
            console.log('yes');

            onStatusChange(newStatus)
        }
        setIsDropdownOpen(false)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                badgeRef.current &&
                !badgeRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false)
            }
        }

        if (!isStatic && isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isStatic, isDropdownOpen])

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (isStatic) return

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setIsDropdownOpen(!isDropdownOpen)
        }
        if (event.key === "Escape") {
            setIsDropdownOpen(false)
        }
    }

    const handleOptionKeyDown = (event: React.KeyboardEvent, option: string) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleStatusSelect(option)
        }
        if (event.key === "Escape") {
            setIsDropdownOpen(false)
        }
    }

    const getBadgeClasses = () => {
        const baseClasses =
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200"
        const colorClasses = `${config.bgColor} ${config.textColor}`

        if (isStatic) {
            return `${baseClasses} ${colorClasses} cursor-default`
        }

        return `${baseClasses} ${colorClasses} cursor-pointer ${config.hoverColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95`
    }

    const getDropdownClasses = () => {
        return `absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${isDropdownOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`
    }

    const getOptionClasses = (option: string) => {
        const isSelected = option === status
        const baseClasses =
            "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors duration-150 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"

        if (isSelected) {
            return `${baseClasses} bg-blue-50 text-blue-900`
        }

        return baseClasses
    }

    return (
        <div className={`relative ${disabled && 'opacity-20'} `}>
            <button
                ref={badgeRef}
                onClick={isStatic ? undefined : handleBadgeClick}
                onKeyDown={isStatic ? undefined : handleKeyDown}
                disabled={isStatic}
                className={getBadgeClasses()}
                aria-expanded={isStatic ? undefined : isDropdownOpen}
                aria-haspopup={isStatic ? undefined : "listbox"}
                aria-label={`Status: ${config.label}${!isStatic ? ". Click to change" : ""}`}
            >
                <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                <span className="whitespace-nowrap">{config.label}</span>
                {!isStatic && (
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                )}
            </button>

            {!isStatic && isDropdownOpen && (
                <div ref={dropdownRef} className={getDropdownClasses()} role="listbox" aria-label="Select status">
                    <div className="py-1">
                        {statusOptions.map((option) => {
                            const optionConfig = statusConfig[option]
                            const OptionIcon = optionConfig.icon
                            const isSelected = option === status

                            return (
                                <button
                                    key={option}
                                    onClick={() => handleStatusSelect(option)}
                                    onKeyDown={(e) => handleOptionKeyDown(e, option)}
                                    className={getOptionClasses(option)}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <OptionIcon
                                        className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-blue-600" : optionConfig.iconColor}`}
                                    />
                                    <span className="flex-1">{optionConfig.label}</span>
                                    {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
