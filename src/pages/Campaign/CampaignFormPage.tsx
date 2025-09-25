import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createCampaign, updateCampaign } from '../../services/api';
import useFetchCampaign from '../../hook/useFetchCampaign';
import CampaignForm from '../../components/CampaignForm';
import Loading from '../../components/Loading';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

export default function CampaignFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { state } = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditMode = Boolean(id && id !== 'create');
    const campaignId = isEditMode ? id : null;
    
    const { campaign, loading, error: fetchError } = useFetchCampaign(campaignId);

    const handleBackClick = () => {
        if (state?.fromUrl) {
            navigate(state.fromUrl);
        } else {
            navigate(`${LOCAL_PATH_PREFIX}campaigns`);
        }
    };

    const handleSubmit = async (formData: any) => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (isEditMode && campaignId) {
                await updateCampaign(campaignId, formData);
            } else {
                await createCampaign(formData);
            }

            // Navigate back to campaigns list
            navigate(`${LOCAL_PATH_PREFIX}campaigns`);
        } catch (err) {
            console.error('Error saving campaign:', err);
            setError('Failed to save campaign. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        handleBackClick();
    };

    if (loading && isEditMode) {
        return <Loading />;
    }

    if (fetchError && isEditMode) {
        return (
            <div className="d-flex flex-column flex-column-fluid">
                <div className="app-content flex-column-fluid">
                    <div className="app-container container-xxl">
                        <div className="card">
                            <div className="card-body text-center py-10">
                                <i className="ki-duotone ki-information-5 fs-3x text-danger mb-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <h3 className="text-danger mb-3">Error Loading Campaign</h3>
                                <p className="text-muted mb-5">{fetchError}</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleBackClick}
                                >
                                    <ArrowLeft className="fs-4 me-2" />
                                    Back to Campaigns
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column flex-column-fluid">
            {/* Toolbar */}
            <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
                <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
                    <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
                        <h1 className="page-heading d-flex text-dark fw-bold fs-3 flex-column justify-content-center my-0">
                            {isEditMode ? 'Edit Campaign' : 'Create Campaign'}
                        </h1>
                        <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
                            <li className="breadcrumb-item text-muted">
                                <button 
                                    className="text-muted text-hover-primary"
                                    onClick={handleBackClick}
                                >
                                    Campaigns
                                </button>
                            </li>
                            <li className="breadcrumb-item">
                                <span className="bullet bg-gray-400 w-5px h-2px"></span>
                            </li>
                            <li className="breadcrumb-item text-muted">
                                {isEditMode ? 'Edit' : 'Create'}
                            </li>
                        </ul>
                    </div>
                    <div className="d-flex align-items-center gap-2 gap-lg-3">
                        <button 
                            className="btn btn-light"
                            onClick={handleBackClick}
                        >
                            <ArrowLeft className="fs-4 me-2" />
                            Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div id="kt_app_content" className="app-content flex-column-fluid">
                <div id="kt_app_content_container" className="app-container container-xxl">
                    {error && (
                        <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
                            <i className="ki-duotone ki-shield-cross fs-2hx text-danger me-4">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div className="d-flex flex-column">
                                <h4 className="mb-1 text-danger">Error</h4>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <CampaignForm
                        campaign={campaign}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isSubmitting}
                        mode={isEditMode ? 'edit' : 'create'}
                    />
                </div>
            </div>
        </div>
    );
}
