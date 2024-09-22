import React from 'react';

// Define the type for props
interface TooltipProps {
    id: string;
    content: string;
}

const Tooltip: React.FC<TooltipProps> = ({ id, content }) => {
    return (
        <div
            className="tooltip capitalize shadow-default transition-opacity duration-300"
            id={`${id}_tooltip`}
        >
            {content}
        </div>
    );
}

export default Tooltip;
