import { useState, useEffect, useRef } from "react";
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, XCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/solid";

export type TaskStatus = "completed" | "in-progress" | "pending" | "not-started" | "not-available";

interface TaskStatusBadgeProps {
    status: string;
    isStatic?: boolean;
    onStatusChange?: (newStatus: TaskStatus) => void;
}

export const TaskStatusBadge = ({ status, isStatic = false, onStatusChange }: TaskStatusBadgeProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const badgeRef = useRef<HTMLSpanElement>(null);

    const statusOptions: TaskStatus[] = ["completed", "in-progress", "pending", "not-started", "not-available"];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800 hover:bg-green-200";
            case "in-progress":
                return "bg-blue-100 text-blue-800 hover:bg-blue-200";
            case "pending":
                return "bg-amber-100 text-amber-800 hover:bg-amber-200";
            case "not-started":
                return "bg-gray-100 text-gray-800 hover:bg-gray-200";
            case "not-available":
                return "bg-red-100 text-red-800 hover:bg-red-200";
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-200";
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case "completed":
                return "text-green-700";
            case "in-progress":
                return "text-blue-700";
            case "pending":
                return "text-amber-700";
            case "not-started":
                return "text-gray-700";
            case "not-available":
                return "text-red-700";
            default:
                return "text-gray-700";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
            case "in-progress":
                return <ClockIcon className="h-4 w-4 text-blue-500" />;
            case "pending":
                return <ExclamationCircleIcon className="h-4 w-4 text-amber-500" />;
            case "not-started":
                return <QuestionMarkCircleIcon className="h-4 w-4 text-gray-500" />;
            case "not-available":
                return <XCircleIcon className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const handleBadgeClick = () => {
        if (!isStatic) {
            setIsDropdownOpen(!isDropdownOpen);
        }
    };

    const handleStatusSelect = (newStatus: TaskStatus) => {
        if (onStatusChange) {
            onStatusChange(newStatus);
        }
        setIsDropdownOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                badgeRef.current &&
                !badgeRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };
        if (!isStatic) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isStatic]);

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
        if (isStatic) return;
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsDropdownOpen(!isDropdownOpen);
        }
        if (event.key === "Escape") {
            setIsDropdownOpen(false);
        }
    };

    const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, option: TaskStatus) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleStatusSelect(option);
        }
        if (event.key === "Escape") {
            setIsDropdownOpen(false);
        }
    };

    return (
        <div className="relative ml-1">
            <span
                ref={badgeRef}
                onClick={isStatic ? undefined : handleBadgeClick}
                onKeyDown={isStatic ? undefined : handleKeyDown}
                tabIndex={isStatic ? -1 : 0}
                className={`${getStatusColor(status)} flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${isStatic ? "cursor-default" : "cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"} transition-all duration-200`}
                role={isStatic ? undefined : "button"}
                aria-expanded={isStatic ? undefined : isDropdownOpen}
                aria-haspopup={isStatic ? undefined : "listbox"}
            >
                {getStatusIcon(status)}
                <span className="capitalize">{status.replace(/-/g, " ")}</span>
                {!isStatic && (
                    <svg className="h-3 w-3 ml-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </span>

            {!isStatic && isDropdownOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute z-20 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden opacity-0 translate-y-[-10px] transition-all duration-200 ease-out"
                    style={{ opacity: isDropdownOpen ? 1 : 0, transform: isDropdownOpen ? "translateY(0)" : "translateY(-10px)" }}
                    role="listbox"
                >
                    {statusOptions.map((option, index) => (
                        <div
                            key={option}
                            onClick={() => handleStatusSelect(option)}
                            onKeyDown={(e) => handleOptionKeyDown(e, option)}
                            tabIndex={0}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm capitalize cursor-pointer transition-colors duration-200 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${index < statusOptions.length - 1 ? "border-b border-gray-100" : ""
                                } ${getStatusTextColor(option)}`}
                            role="option"
                            aria-selected={option === status}
                        >
                            {getStatusIcon(option)}
                            {option.replace(/-/g, " ")}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};