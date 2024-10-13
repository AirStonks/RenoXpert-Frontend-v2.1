import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Order } from '../../types/index';
import Loading from '../../components/Loading';

const API_URL = `http://${window.location.hostname}:8000/api/`;

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('guest_token')}`
});

const OrderOverview: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [orderDetails, setOrderDetails] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState('tab_1_1');

    useEffect(() => {
        fetchOrderHead();
    }, []);

    const fetchOrderHead = async () => {
        try {
            const headRes = await axios.get(`${API_URL}order/public/view/${id}/head`);
            if (headRes.data.status === 'success') {
                console.log('RESPONSE: ', headRes.data);
                fetchOrderDetails(headRes.data);
            } else {
                console.log('Order Not Found');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    };

    const fetchOrderDetails = async (headRes: any) => {
        try {
            const response = await axios.get(`${API_URL}order/public/view/${id}`, {
                headers: getAuthHeaders()
            });

            if (response.data.status === 'unauthenticated' || response.data.status === 'invalid_auth') {
                navigate('/otp/verify', { state: response.data });
            } else {
                setOrderDetails(response.data.data);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/otp/verify', { state: headRes });
            } else {
                console.error('Error fetching order details:', error);
            }
        }
    };

    if (!orderDetails) return <Loading />;

    return (
        <main className="grow content pt-5" id="content" role="content">
            <div className="container-fluid relative" id="content_container">
                <div className="flex flex-col flex-wrap gap-6 pb-28 justify-center items-center">
                    <img className="default-logo min-h-[22px] h-[52px] max-w-none" src="/app/RenoExpert_logo-01.svg" alt="RenoExpert Logo" />

                    <div className="card flex-auto w-full max-w-4xl">
                        <div className="card-header flex justify-between">
                            <span className="text-lg font-semibold">Order Agreement</span>
                            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0">
                                <i className="ki-filled ki-printer"></i>
                            </button>
                        </div>
                        <div className="card-body pt-2">
                            <div className="tabs mb-5">
                                <button 
                                    className={`tab ${activeTab === 'tab_1_1' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tab_1_1')}
                                >
                                    Terms and Condition
                                </button>
                                <button 
                                    className={`tab ${activeTab === 'tab_1_2' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tab_1_2')}
                                >
                                    Order Detail
                                </button>
                                <button 
                                    className={`tab ${activeTab === 'tab_1_3' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tab_1_3')}
                                >
                                    Quotation
                                </button>
                            </div>
                            <div className={activeTab === 'tab_1_1' ? '' : 'hidden'} id="tab_1_1">
                                Terms and Conditions content
                            </div>
                            <div className={activeTab === 'tab_1_2' ? '' : 'hidden'} id="tab_1_2">
                                Order Detail content
                            </div>
                            <div className={activeTab === 'tab_1_3' ? '' : 'hidden'} id="tab_1_3">
                                Quotation content
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2">
                    <button className="btn btn-lg btn-primary rounded-3xl shadow-lg">
                        Confirm
                    </button>
                </div>
            </div>
        </main>
    );
};

export default OrderOverview;