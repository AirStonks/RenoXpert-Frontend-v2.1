import { useState } from "react";
// import ActivityCenter from "../components/ActivityCenter";
// import { makePaymentIntent, testSms } from "../services/api";
// import axios from "axios";
import { submitRegistrationForm } from "../services/ownerApi";

function Test() {

    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await submitRegistrationForm(formData);
            console.log(response.data);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleFileChange} required />
            <button type="submit">Upload</button>
        </form>
    );

}

export default Test;