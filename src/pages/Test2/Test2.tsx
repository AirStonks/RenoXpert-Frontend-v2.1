import React from 'react';
import Quotation from './Quotation';

function Test2() {
    // Create styles

    // Sample data - replace with your actual data
    const company = {
        name: "Tech Solutions Inc.",
        address: "123 Business Street\nNew York, NY 10001",
        mobile: "+1 (555) 123-4567",
        email: "info@techsolutions.com",
        logo: "https://via.placeholder.com/150" // Replace with your actual image URL or Base64 string
    };

    const attn = {
        name: "Mr. John Doe",
        address: "456 Client Avenue\nSuite 789\nLos Angeles, CA 90001",
        mobile: "+1 (555) 987-6543",
        email: "john.doe@clientcompany.com"
    };

    const items = [
        { id: 1, description: "Web Development Service", quantity: 20, price: 75 },
        { id: 2, description: "Technical Consulting", quantity: 10, price: 100 },
        { id: 3, description: "Cloud Hosting", quantity: 12, price: 50 },
        { id: 4, description: "Cloud Hosting", quantity: 12, price: 50 },
        { id: 5, description: "Cloud Hosting", quantity: 12, price: 50 },
        { id: 6, description: "Cloud Hosting", quantity: 12, price: 50 },
    ];

    const quotationDetails = {
        number: "QT-2023-001",
        date: new Date().toLocaleDateString()
    };

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const tax = subtotal * 0.10; // Assuming 10% tax
    const total = subtotal + tax;

    // Helper function to convert an image URL to a Base64 string

    return (
        <div className='flex flex-col w-full'>
            <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
                {/* Download PDF Button */}
                <div className="mb-4 w-max">
                    <button
                        // onClick={downloadPDF}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                    >
                        Download PDF
                    </button>
                </div>

                {/* Quotation Content Rendered on the Page */}
                <div className='w-max'>
                    {/* Company Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{company.address}</p>
                            <p className="text-sm text-gray-600 mt-1">Mobile: {company.mobile}</p>
                            <p className="text-sm text-gray-600">Email: {company.email}</p>
                        </div>
                        <div className="flex self-start">
                            <img
                                src={'/app/RenoExpert_logo-01.jpg'}
                                alt="Company Logo"
                                className="w-32 h-32 object-contain rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Quotation Header */}
                    <div className="flex justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Quotation</h2>
                            <p className="text-sm text-gray-600">Number: {quotationDetails.number}</p>
                        </div>
                        <p className="text-sm text-gray-600">Date: {quotationDetails.date}</p>
                    </div>

                    {/* Attn Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Attn:</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{attn.name}</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{attn.address}</p>
                        <p className="text-sm text-gray-600 mt-1">Mobile: {attn.mobile}</p>
                        <p className="text-sm text-gray-600">Email: {attn.email}</p>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t border-gray-100">
                                    <td className="py-3 px-4 text-sm text-gray-600">{item.description}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 text-right">${item.price.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="text-right">
                        <div className="inline-block text-sm">
                            <p className="mb-2">
                                <span className="mr-4">Subtotal:</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </p>
                            <p className="mb-2">
                                <span className="mr-4">Tax (10%):</span>
                                <span>${tax.toFixed(2)}</span>
                            </p>
                            <p className="text-lg font-semibold">
                                <span className="mr-4">Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Quotation />
        </div>
    );
}

export default Test2;
