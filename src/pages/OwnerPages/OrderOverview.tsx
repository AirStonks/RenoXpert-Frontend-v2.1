import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { SessionManager } from '../../services/SessionManager';
import Loading from '../../components/Loading';
import { Order } from '../../types/index';

const API_URL = 'http://' + window.location.hostname + ':8000/api/';


const OrderOverview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [orderDetails, setOrderDetails] = useState<Order | null>(null);
    const [otpRequired, setOtpRequired] = useState(false);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');

    useEffect(() => {
        fetchOrderDetails();

        // verifyCredential
            // if verified
                // fetchOrderDetail
            // else
                // redirect to verifi OTP page

    }, []);

    const verifyCredential = async () => {
        // mobile = window.session.getItem('mobile')
        
        // verify otp
    }

    const fetchOrderDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}/order/public/view/${id}`);
            if (response.data.status === 'otp_required') {
                setOtpRequired(true);
                setMobile(response.data.mobile);
            } else {
                setOrderDetails(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    };

    const handleOtpRequest = async () => {
        try {
            await axios.post(`${API_URL}/sms-otp/request`, { mobile });
            // Show OTP input field
        } catch (error) {
            console.error('Error requesting OTP:', error);
        }
    };

    const handleOtpVerify = async () => {
        try {
            const response = await axios.post(`${API_URL}/sms-otp/verify`, {
                mobile,
                otp_code: otp,
                order_id: id
            });
            if (response.data.status === 'verified') {
                SessionManager.setSessionToken(response.data.session_token);
                setOtpRequired(false);
                fetchOrderDetails();
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
        }
    };

    if (otpRequired) {
        return (
            <div>
                <h2>OTP Verification Required</h2>
                <button onClick={handleOtpRequest}>Request OTP</button>
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                />
                <button onClick={handleOtpVerify}>Verify OTP</button>
            </div>
        );
    }

    if (!orderDetails) {
        return <Loading />;
    }

    return (
        <div>
            {orderDetails.id}
            <div className="card">
                <div className="card-body">
                    {orderDetails.order_no}
                </div>
            </div>
        </div>
    );
};

export default OrderOverview;
