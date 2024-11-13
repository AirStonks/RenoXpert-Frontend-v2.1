// src\components\Buttons\AddProductButton.tsx

import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonOption {
    url: string;
    btnText: string;
    btnSize?: string;
    btnColor?: string;
    icon?: string;
}

const Button: React.FC<ButtonOption> = ({
    url,
    btnText,
    btnSize,
    btnColor = "btn-primary",
    icon,
}) => {
    return (
        <Link 
            to={url} 
            className={`btn ${btnSize} ${btnColor} text-white btn-`}
        >
            {icon && <i className={icon}></i>}

            {btnText}
        </Link>
    );
};

export default Button;
