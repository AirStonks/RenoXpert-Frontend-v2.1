// src/hooks/useFetchDIForm.ts

import { useState, useEffect } from 'react';
import { fetchDefectInspectionForm } from '../services/api';
import { DefectInspectionForm } from '../types';

const useFetchDIForm = (id: number) => {
    const [diForm, setDIForm] = useState<DefectInspectionForm>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchDefectInspectionForm(id)
                .then((data) => {
                    setDIForm(data.data);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to fetch Defect Inspection Form');
                    setLoading(false);
                });
        }
    }, [id]);

    return { diForm, loading, error };
};

export default useFetchDIForm;
