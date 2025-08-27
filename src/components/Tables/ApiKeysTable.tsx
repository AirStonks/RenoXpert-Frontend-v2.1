import React, { useState } from 'react';
import { ApiKey, ApiKeyCreateRequest, ApiKeyUpdateRequest } from '../../types';
import { createApiKey, updateApiKey, revokeApiKey, regenerateApiKey } from '../../services/api';
import { toast, Slide } from 'react-toastify';
import CreateApiKeyModal from '../Modals/CreateApiKeyModal';
import EditApiKeyModal from '../Modals/EditApiKeyModal';
import DeleteModal from '../Modals/DeleteModal';
import ViewApiKeyModal from '../Modals/ViewApiKeyModal';
import { useFetchApiKeys } from '../../hook/useFetchApiKeys';

function ApiKeysTable() {
    const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
    const [selectedApiKeyForDelete, setSelectedApiKeyForDelete] = useState<{ id: string, name: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const { apiKeys, loading, error, refetch, pagination } = useFetchApiKeys(
        currentPage,
        pageSize,
        searchTerm
    );

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    const handleCreateApiKey = async (apiKeyData: ApiKeyCreateRequest) => {
        try {
            const response = await createApiKey(apiKeyData);
            if (response) {
                notify('success', 'API key created successfully.');
                setShowCreateModal(false);
                refetch();
            }
        } catch (error) {
            notify('error', 'Failed to create API key.');
            console.error('API key creation failed:', error);
        }
    };

    const handleUpdateApiKey = async (apiKeyId: string, apiKeyData: ApiKeyUpdateRequest) => {
        try {
            const response = await updateApiKey(apiKeyId, apiKeyData);
            if (response) {
                notify('success', 'API key updated successfully.');
                setSelectedApiKey(null);
                setShowEditModal(false);
                refetch();
            }
        } catch (error) {
            notify('error', 'Failed to update API key.');
            console.error('API key update failed:', error);
        }
    };

    const handleDeleteApiKey = async (id: number): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await revokeApiKey(id.toString());
            if (response) {
                refetch();
                return { success: true, message: 'API key revoked successfully.' };
            }
            return { success: false, message: 'Failed to revoke API key.' };
        } catch (error) {
            console.error('API key revocation failed:', error);
            return { success: false, message: 'Failed to revoke API key.' };
        }
    };

    const handleRegenerateApiKey = async (apiKeyId: string) => {
        try {
            const response = await regenerateApiKey(apiKeyId);
            if (response) {
                notify('success', 'API key regenerated successfully.');
                refetch();
            }
        } catch (error) {
            notify('error', 'Failed to regenerate API key.');
            console.error('API key regeneration failed:', error);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatApiKey = (key?: string) => {
        if (!key) return '';
        return key.length > 20 ? `${key.substring(0, 20)}...` : key;
    };

    const getStatusBadge = (isActive?: boolean, expiresAt?: string) => {
        if (!isActive) {
            return <span className="badge badge-danger">Revoked</span>;
        }
        if (expiresAt && new Date(expiresAt) < new Date()) {
            return <span className="badge badge-warning">Expired</span>;
        }
        return <span className="badge badge-success">Active</span>;
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="d-flex justify-content-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="alert alert-danger" role="alert">
                        Error: {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <h3 className="fw-bold m-0 text-gray-800">API Keys Management</h3>
                    </div>
                    <div className="card-toolbar">
                        <div className="d-flex gap-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Search API keys..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ minWidth: '200px' }}
                            />
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <i className="ki-solid ki-plus fs-2"></i>
                                Create API Key
                            </button>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th className="w-25px">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid">
                                            <input className="form-check-input" type="checkbox" value="1" />
                                        </div>
                                    </th>
                                    <th className="min-w-125px">Name</th>
                                    <th className="min-w-125px">API Key</th>
                                    <th className="min-w-125px">Prefix</th>
                                    <th className="min-w-125px">Last Used</th>
                                    <th className="min-w-125px">Expires At</th>
                                    <th className="min-w-125px">Status</th>
                                    <th className="min-w-125px">Created At</th>
                                    <th className="min-w-125px">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apiKeys.map((apiKey) => (
                                    <tr key={apiKey.id}>
                                        <td>
                                            <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                <input className="form-check-input" type="checkbox" value="1" />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="d-flex justify-content-start flex-column">
                                                    <span className="text-dark fw-bold text-hover-primary fs-6">
                                                        {apiKey.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-dark fw-bold text-hover-primary d-block fs-6">
                                                {formatApiKey(apiKey.key)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-dark fw-bold text-hover-primary d-block fs-6">
                                                {apiKey.prefix}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-dark fw-bold text-hover-primary d-block fs-6">
                                                {formatDate(apiKey.last_used_at)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-dark fw-bold text-hover-primary d-block fs-6">
                                                {formatDate(apiKey.expires_at)}
                                            </span>
                                        </td>
                                        <td>
                                            {getStatusBadge(apiKey.is_active, apiKey.expires_at)}
                                        </td>
                                        <td>
                                            <span className="text-dark fw-bold text-hover-primary d-block fs-6">
                                                {formatDate(apiKey.created_at)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-light-info"
                                                    onClick={() => {
                                                        setSelectedApiKey(apiKey);
                                                        setShowViewModal(true);
                                                    }}
                                                    title="View Details"
                                                >
                                                    <i className="ki-solid ki-eye fs-2"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-light-primary"
                                                    onClick={() => {
                                                        setSelectedApiKey(apiKey);
                                                        setShowEditModal(true);
                                                    }}
                                                    title="Edit API Key"
                                                >
                                                    <i className="ki-solid ki-pencil fs-2"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-light-warning"
                                                    onClick={() => handleRegenerateApiKey(apiKey.id!)}
                                                    title="Regenerate API Key"
                                                >
                                                    <i className="ki-solid ki-refresh fs-2"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-light-danger"
                                                    onClick={() => {
                                                        setSelectedApiKeyForDelete({ id: apiKey.id!, name: apiKey.name || '' });
                                                        setShowDeleteModal(true);
                                                    }}
                                                    title="Revoke API Key"
                                                >
                                                    <i className="ki-solid ki-trash fs-2"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center flex-wrap">
                            <div className="d-flex flex-wrap py-2 mr-3">
                                <div className="d-flex align-items-center py-3">
                                    <span className="text-muted mr-2">Show</span>
                                    <select
                                        className="form-control form-control-sm font-weight-bold mr-4"
                                        style={{ width: '75px' }}
                                        value={pageSize}
                                        onChange={(e) => setPageSize(Number(e.target.value))}
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span className="text-muted mr-2">of {pagination.totalItems}</span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center py-3">
                                <button
                                    className="btn btn-icon btn-sm btn-light mr-2"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <i className="ki-solid ki-arrow-left"></i>
                                </button>
                                <span className="text-muted mr-2">
                                    Page {currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    className="btn btn-icon btn-sm btn-light"
                                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                                    disabled={currentPage === pagination.totalPages}
                                >
                                    <i className="ki-solid ki-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create API Key Modal */}
            {showCreateModal && (
                <CreateApiKeyModal onSubmit={handleCreateApiKey} />
            )}

            {/* Edit API Key Modal */}
            {showEditModal && (
                <EditApiKeyModal 
                    apiKey={selectedApiKey} 
                    onSubmit={handleUpdateApiKey} 
                />
            )}

            {/* View API Key Modal */}
            {showViewModal && (
                <ViewApiKeyModal 
                    apiKey={selectedApiKey} 
                />
            )}

            {/* Delete API Key Modal */}
            {showDeleteModal && (
                <DeleteModal
                    item={selectedApiKeyForDelete}
                    modalTitle="Revoke API Key"
                    modalPrompt="Are you sure you want to revoke this API key? This action cannot be undone."
                    notifySuccess="API key revoked successfully."
                    notifyError="Failed to revoke API key."
                    deleteFunction={handleDeleteApiKey}
                />
            )}
        </>
    );
}

export default ApiKeysTable;