import { createContext, useContext } from "react";
import { RenoXSale } from "../types";

export const RenoSaleContext = createContext<RenoXSale | undefined>(undefined);

export const useRenoSale = () => {
    const renoSale = useContext(RenoSaleContext);

    if (renoSale === undefined) {
        throw new Error("useRenoSaleContext must be used within a RenoSaleProvider");
    }

    return renoSale;
};