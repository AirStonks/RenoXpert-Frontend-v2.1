// src/App.tsx
import { createBrowserRouter, RouterProvider, RouteObject } from 'react-router-dom';
import { useEffect } from 'react';
import KTComponent from './metronic/core';
import KTLayout from './metronic/app/layouts/demo1';
import Login from './pages/Login';
import ProtectedRoute from './utils/ProtectedRoute';
import MasterLayout from './pages/Master';
import Dashboard from './pages/Dashboard';
import ProductMain from './pages/Product/ProductMain';
import CreateProduct from './pages/Product/CreateProduct';
import EditProduct from './pages/Product/EditProduct';
import ProductCategory from './pages/Product/ProductCategory';
import PackageMain from './pages/Package/PackageMain';
import CreatePackage from './pages/Package/CreatePackage';
import QuotationMain from './pages/Quotation/QuotationMain';
import CreateQuotation from './pages/Quotation/CreateQuotation';
import EditQuotation from './pages/Quotation/EditQuotation';
import Loading from './components/Loading';
import PropertyMain from './pages/Property/PropertyMain';
import OrderMain from './pages/Order/OrderMain';
import CreateOrder from './pages/Order/CreateOrder';
import EditOrder from './pages/Order/EditOrder';
import SalesMain from './pages/Sales/SalesMain';
import SaleDetail from './pages/Sales/SaleDetail';
import DiscountFeeMain from './pages/DiscountFee/DiscountFeeMain';
import EditPackage from './pages/Package/EditPackage';
import ViewQuotation from './pages/OwnerPages/ViewQuotation';
import Test from './pages/Test';
import PaymentSuccess from './pages/OwnerPages/PaymentSuccess';
import PaymentError from './pages/OwnerPages/PaymentError';
import OrderDetail from './pages/Order/OrderDetail';
import OrderOverview from './pages/OwnerPages/OrderOverview';
import OTPVerifyPage from './pages/OTPVerifyPage';
import OTPConfirmOrder from './pages/OTPConfirmOrder';
import OwnerProtectedRoute from './utils/OwnerProtectedRoute';
import OwnerMasterLayout from './pages/OwnerPages/OwnerMasterLayout';
import OwnerHome from './pages/OwnerPages/OwnerHome';
import OwnerLogin from './pages/OwnerPages/OwnerLogin';
import UsersMain from './pages/User/UsersMain';
import AddInternalUser from './pages/User/AddInternalUser';
import OrderPreview from './pages/Order/OrderPreview';
import OwnerRenoRegistrationForm from './pages/OwnerPages/OwnerRenoRegistrationForm';
import OwnerFormSubmitSuccess from './pages/OwnerPages/FormSubmitSuccess';
import RegistrationFormMain from './pages/RegistrationForm/RegistrationFormMain';
import EditRegistrationForm from './pages/RegistrationForm/EditRegistrationForm';
import RegistrationFormDetail from './pages/RegistrationForm/RegistrationFormDetail';
import RenoRegistrationFormDetail from './pages/OwnerPages/RenoRegistrationFormDetail';
import CreatePO from './pages/PO/CreatePO';
import DeveloperTool from './pages/DeveloperTools';
import PackageDetail from './pages/Package/PackageDetail';
import QuotationDetail from './pages/Quotation/QuotationDetail';
import ProductDetail from './pages/Product/ProductDetail';
import MakeoverLanding from './pages/Test/MakeoverLanding';
import ChangePassword from './pages/Profile/ChangePassword';
import PMMain from './pages/ProjectManagement/PMMain';
import ProgressMgnt from './pages/ProjectManagement/ProgressMgnt';
import DefectInspectionReport from './pages/ProjectManagement/DefectInspectionReport';
import OperationLogin from './pages/OperationPages/OperationLogin';
import OperationProtectedRoute from './utils/OperationProtectedRoute';
import OperationMasterLayout from './pages/OperationPages/OperationMasterLayout';
import OperationHome from './pages/OperationPages/OperationHome';
import OpFormSubmitSuccess from './pages/OperationPages/FormSubmitSuccess';
import QCFormDetail from './pages/OperationPages/QCFormDetail';
import DefectInspectionFormPage from './pages/OperationPages/DefectInspectionFormPage';
import QCFormPage from './pages/OperationPages/QCFormPage';
import UserDetail from './pages/User/UserDetail';
import AddOwner from './pages/User/AddOwner';
import RenoAcceptanceForm from './pages/OwnerPages/RenoAcceptanceForm';
import PreviousOrderDetail from './pages/Order/PreviousOrderDetail';
import POMain from './pages/PO/POMain';
import AddUser from './pages/User/AddUser';
import InventoryMain from './pages/Inventory/InventoryMain';
import PODetail from './pages/PO/PODetail';
import POFulfillment from './pages/PO/POFulfillment';
import RenoProgressDetail from './pages/OwnerPages/RenoProgressDetail';
import RenoProgressManagement from './pages/OperationPages/RenoProgressManagement';
import OwnerInspectionReport from './pages/OwnerPages/OwnerInspectionReport';
import RenoProgressPhaseAttachments from './pages/OwnerPages/RenoProgressPhaseAttachments';
import ProductArchive from './pages/Product/ProductArchive';
import PackageArchive from './pages/Package/PackageArchive';
import QuotationArchive from './pages/Quotation/QuotationArchive';
import KeyManagementForm from './pages/OwnerPages/KeyManagementForm';
import KeyManagementOverview from './pages/ProjectManagement/KeyManagementOverview';
import UpdateKeyManagement from './pages/ProjectManagement/UpdateKeyManagement';
import Test2 from './pages/Test2/Test2';
import PMProgressTrack from './pages/ProjectManagement/PMProgressTrack';
import QuotationOrderPrint from './pages/Order/components/QuotationOrderPrint';
import POPrint from './pages/PO/components/POPrint';
import EditPO from './pages/PO/EditPO';
import VendorLogin from './pages/VendorLogin';
import SalesOrderPO from './pages/Finance/SalesOrderPO';
import POPaymentVoucher from './pages/PO/components/POPaymentVoucher';
import POPropertyOverview from './pages/PO/POPropertyOverview';
import POInvoice from './pages/PO/POInvoice';
import OTPRequestList from './pages/OTPRequestList';
import POInvoicePrint from './pages/PO/components/POInvoicePrint';
import DIFormMain from './pages/ProjectManagement/DIFormMain';
import PublicDIReport from './pages/ProjectManagement/PublicDIReport';
import CustomAddonPackage from './pages/OwnerPages/CustomAddonPackage';
import DetailedOrderPrint from './pages/Order/components/DetailedOrderPrint';
import PMMainV3 from './pages/ProjectManagement/PMMainV3';
import DIReport from './pages/ProjectManagement/DIReport';
import { PropertyDetail } from './pages/Property/PropertyDetail';
import { PropertyEdit } from './pages/Property/PropertyEdit';
import InvestorInterestForm from './pages/InvestorInterestForm';
import IIFMain from './pages/InvestorInterestForm/IIFMain';
import IIFDetail from './pages/InvestorInterestForm/IIFDetail';
import OrderConfirmSuccess from './pages/OwnerPages/OrderConfirmSuccess';

interface ProtectedLayoutProps {
    children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => (
    <ProtectedRoute>
        <MasterLayout>{children}</MasterLayout>
    </ProtectedRoute>
);

const OwnerProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => (
    <OwnerProtectedRoute>
        <OwnerMasterLayout>{children}</OwnerMasterLayout>
    </OwnerProtectedRoute>
);

const OperationProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => (
    <OperationProtectedRoute>
        <OperationMasterLayout>{children}</OperationMasterLayout>
    </OperationProtectedRoute>
);

// Define route configuration
const routeCat: { path: string; element: JSX.Element; layout?: React.FC<ProtectedLayoutProps> | null }[][] = [
    // Staff/Admin
    [
        { path: '/login', element: <Login />, layout: null },
        { path: '/', element: <Dashboard />, layout: ProtectedLayout },
        { path: '/dashboard', element: <Dashboard />, layout: ProtectedLayout },
        { path: '/profile/change-password', element: <ChangePassword />, layout: ProtectedLayout },
        { path: '/products', element: <ProductMain />, layout: ProtectedLayout },
        { path: '/products/create', element: <CreateProduct />, layout: ProtectedLayout },
        { path: '/products/:id', element: <ProductDetail />, layout: ProtectedLayout },
        { path: '/products/edit/:id', element: <EditProduct />, layout: ProtectedLayout },
        { path: '/products/category', element: <ProductCategory />, layout: ProtectedLayout },
        { path: '/products/archives', element: <ProductArchive />, layout: ProtectedLayout },
        { path: '/packages', element: <PackageMain />, layout: ProtectedLayout },
        { path: '/packages/create', element: <CreatePackage />, layout: ProtectedLayout },
        { path: '/packages/:id', element: <PackageDetail />, layout: ProtectedLayout },
        { path: '/packages/edit/:id', element: <EditPackage />, layout: ProtectedLayout },
        { path: '/packages/archives', element: <PackageArchive />, layout: ProtectedLayout },
        { path: '/quotations', element: <QuotationMain />, layout: ProtectedLayout },
        { path: '/quotations/create', element: <CreateQuotation />, layout: ProtectedLayout },
        { path: '/quotations/edit/:id', element: <EditQuotation />, layout: ProtectedLayout },
        { path: '/quotations/:id', element: <QuotationDetail />, layout: ProtectedLayout },
        { path: '/quotations/archives', element: <QuotationArchive />, layout: ProtectedLayout },
        { path: '/properties', element: <PropertyMain />, layout: ProtectedLayout },
        { path: '/properties/:id', element: <PropertyDetail />, layout: ProtectedLayout },
        { path: '/properties/:id/edit', element: <PropertyEdit />, layout: ProtectedLayout },
        { path: '/registration-forms', element: <RegistrationFormMain />, layout: ProtectedLayout },
        { path: '/registration-forms/edit/:id', element: <EditRegistrationForm />, layout: ProtectedLayout },
        { path: '/registration-forms/:id', element: <RegistrationFormDetail />, layout: ProtectedLayout },
        { path: '/investor-interest-forms', element: <IIFMain />, layout: ProtectedLayout },
        { path: '/investor-interest-forms/:id', element: <IIFDetail />, layout: ProtectedLayout },
        { path: '/orders', element: <OrderMain />, layout: ProtectedLayout },
        { path: '/orders/:id', element: <OrderDetail />, layout: ProtectedLayout },
        { path: '/orders/:id/ver/:verId', element: <PreviousOrderDetail />, layout: ProtectedLayout },
        { path: '/orders/create', element: <CreateOrder />, layout: ProtectedLayout },
        { path: '/orders/edit/:id', element: <EditOrder />, layout: ProtectedLayout },
        { path: '/preview/owner/order/overview/id/:id', element: <OrderPreview />, layout: null },
        { path: '/orders/print/:id', element: <QuotationOrderPrint />, layout: null },
        { path: '/orders/print/:id/internal', element: <DetailedOrderPrint />, layout: null },
        { path: '/sales', element: <SalesMain />, layout: ProtectedLayout },
        { path: '/sales/:id', element: <SaleDetail />, layout: ProtectedLayout },
        { path: '/purchase-orders', element: <POMain />, layout: ProtectedLayout },
        { path: '/purchase-orders/property/view', element: <POPropertyOverview />, layout: ProtectedLayout },
        { path: '/purchase-orders/create', element: <CreatePO />, layout: ProtectedLayout },
        { path: '/purchase-orders/:id', element: <PODetail />, layout: ProtectedLayout },
        { path: '/purchase-orders/edit/:id', element: <EditPO />, layout: ProtectedLayout },
        { path: '/purchase-orders/fulfillment/:id', element: <POFulfillment />, layout: ProtectedLayout },
        { path: '/purchase-orders/print/:id', element: <POPrint />, layout: null },
        { path: '/purchase-orders/print/payment-voucher/:id', element: <POPaymentVoucher />, layout: null },
        { path: '/purchase-orders/:id/invoices', element: <POInvoice />, layout: ProtectedLayout },
        { path: '/purchase-orders/:id/invoices/:invId/print', element: <POInvoicePrint />, layout: null },
        { path: '/discountFee', element: <DiscountFeeMain />, layout: ProtectedLayout },
        { path: '/reno-progress/overview', element: <PMMain />, layout: ProtectedLayout },
        { path: '/reno-progress/overview/v3', element: <PMMainV3 />, layout: ProtectedLayout },
        { path: '/reno-progress/progress-tracker', element: <PMProgressTrack />, layout: ProtectedLayout },
        { path: '/reno-progress/:id', element: <ProgressMgnt />, layout: ProtectedLayout },
        { path: '/reno-progress/:id/old-ver', element: <ProgressMgnt />, layout: ProtectedLayout },
        { path: '/reno-progress/:id/defect-inspection-report', element: <DefectInspectionReport />, layout: ProtectedLayout },
        { path: '/di-forms/:id', element: <DefectInspectionReport />, layout: ProtectedLayout },
        { path: '/reno-progress/:id/key-management', element: <KeyManagementOverview />, layout: ProtectedLayout },
        { path: '/reno-progress/:id/key-management/update', element: <UpdateKeyManagement />, layout: ProtectedLayout },
        { path: '/di-forms', element: <DIFormMain />, layout: ProtectedLayout },
        { path: '/users', element: <UsersMain />, layout: ProtectedLayout },
        { path: '/users/:id', element: <UserDetail />, layout: ProtectedLayout },
        { path: '/users/internal/add', element: <AddInternalUser />, layout: ProtectedLayout },
        { path: '/users/add', element: <AddUser />, layout: ProtectedLayout },
        { path: '/users/add/owner', element: <AddOwner />, layout: ProtectedLayout },
        { path: '/inventory', element: <InventoryMain />, layout: ProtectedLayout },
        { path: '/finance/sales-order-po', element: <SalesOrderPO />, layout: ProtectedLayout },
        { path: '/otp-requests', element: <OTPRequestList />, layout: ProtectedLayout },
        { path: '/developer-tools', element: <DeveloperTool />, layout: ProtectedLayout },
    ],
    // Owner
    [
        { path: '/login', element: <OwnerLogin />, layout: null },
        { path: '/', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/home', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/quotations', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/reno-progress', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/profile', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/home', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/invoice/:id/view', element: <ViewQuotation />, layout: OwnerProtectedLayout },
        { path: '/invoice/:id/payment/success', element: <PaymentSuccess />, layout: OwnerProtectedLayout },
        { path: '/invoice/:id/payment/error', element: <PaymentError />, layout: OwnerProtectedLayout },
        { path: '/success/test', element: <PaymentSuccess />, layout: null },
        { path: '/form/reno-registration-forms/:id', element: <RenoRegistrationFormDetail />, layout: OwnerProtectedLayout },
        { path: '/order/overview/id/:id', element: <OrderOverview />, layout: OwnerProtectedLayout },
        { path: '/confirm/order/otp/verify', element: <OTPConfirmOrder />, layout: null },
        { path: '/quotation-request-form', element: <OwnerRenoRegistrationForm />, layout: null },
        { path: '/quotation-request-form/success', element: <OwnerFormSubmitSuccess />, layout: null },
        { path: '/reno/progress/:id', element: <RenoProgressDetail />, layout: OwnerProtectedLayout },
        { path: '/reno/accept-form/:id', element: <RenoAcceptanceForm />, layout: OwnerProtectedLayout },
        { path: '/reno/:id/inspection', element: <OwnerInspectionReport />, layout: OwnerProtectedLayout },
        { path: '/reno/progress/:id/phase/:phase/attachments', element: <RenoProgressPhaseAttachments />, layout: OwnerProtectedLayout },
        { path: '/order/:id/customize-addons', element: <CustomAddonPackage />, layout: OwnerProtectedLayout },
    ],
    // Operation
    [
        { path: '/login', element: <OperationLogin />, layout: null },
        { path: '/', element: <OperationHome />, layout: OperationProtectedLayout },
        { path: '/home', element: <OperationHome />, layout: OperationProtectedLayout },
        { path: '/reno/defect-inspection-form/:id', element: <DefectInspectionFormPage />, layout: OperationProtectedLayout },
        { path: '/reno/qc-form', element: <QCFormPage />, layout: OperationProtectedLayout },
        { path: '/reno/qc-forms/:id/detail', element: <QCFormDetail />, layout: OperationProtectedLayout },
        { path: '/form/submit/success', element: <OpFormSubmitSuccess />, layout: OperationProtectedLayout },
        { path: '/reno/progress/:id', element: <RenoProgressManagement />, layout: OperationProtectedLayout },
    ],
    // Vendor
    [
        { path: '/login', element: <VendorLogin />, layout: null },
    ],
    // General
    [
        { path: '/test', element: <Test />, layout: null },
        { path: '/themakeover/test', element: <MakeoverLanding />, layout: null },
        { path: '/di-form/report', element: <PublicDIReport />, layout: null },
        { path: '/investor-interest-form', element: <InvestorInterestForm />, layout: null },
    ],
];

const routeCatLocal: { path: string; element: JSX.Element; layout?: React.FC<ProtectedLayoutProps> | null }[][] = [
    // Staff/Admin
    [
        { path: '/staff/login', element: <Login />, layout: null },
        { path: '/staff', element: <Dashboard />, layout: ProtectedLayout },
        { path: '/staff/dashboard', element: <Dashboard />, layout: ProtectedLayout },
        { path: '/staff/profile/change-password', element: <ChangePassword />, layout: ProtectedLayout },
        { path: '/staff/products', element: <ProductMain />, layout: ProtectedLayout },
        { path: '/staff/products/create', element: <CreateProduct />, layout: ProtectedLayout },
        { path: '/staff/products/:id', element: <ProductDetail />, layout: ProtectedLayout },
        { path: '/staff/products/edit/:id', element: <EditProduct />, layout: ProtectedLayout },
        { path: '/staff/products/category', element: <ProductCategory />, layout: ProtectedLayout },
        { path: '/staff/products/archives', element: <ProductArchive />, layout: ProtectedLayout },
        { path: '/staff/packages', element: <PackageMain />, layout: ProtectedLayout },
        { path: '/staff/packages/create', element: <CreatePackage />, layout: ProtectedLayout },
        { path: '/staff/packages/:id', element: <PackageDetail />, layout: ProtectedLayout },
        { path: '/staff/packages/edit/:id', element: <EditPackage />, layout: ProtectedLayout },
        { path: '/staff/packages/archives', element: <PackageArchive />, layout: ProtectedLayout },
        { path: '/staff/quotations', element: <QuotationMain />, layout: ProtectedLayout },
        { path: '/staff/quotations/create', element: <CreateQuotation />, layout: ProtectedLayout },
        { path: '/staff/quotations/edit/:id', element: <EditQuotation />, layout: ProtectedLayout },
        { path: '/staff/quotations/:id', element: <QuotationDetail />, layout: ProtectedLayout },
        { path: '/staff/quotations/archives', element: <QuotationArchive />, layout: ProtectedLayout },
        { path: '/staff/properties', element: <PropertyMain />, layout: ProtectedLayout },
        { path: '/staff/properties/:id', element: <PropertyDetail />, layout: ProtectedLayout },
        { path: '/staff/properties/:id/edit', element: <PropertyEdit />, layout: ProtectedLayout },
        { path: '/staff/registration-forms', element: <RegistrationFormMain />, layout: ProtectedLayout },
        { path: '/staff/registration-forms/edit/:id', element: <EditRegistrationForm />, layout: ProtectedLayout },
        { path: '/staff/registration-forms/:id', element: <RegistrationFormDetail />, layout: ProtectedLayout },
        { path: '/staff/investor-interest-forms', element: <IIFMain />, layout: ProtectedLayout },
        { path: '/staff/investor-interest-forms/:id', element: <IIFDetail />, layout: ProtectedLayout },
        { path: '/staff/orders', element: <OrderMain />, layout: ProtectedLayout },
        { path: '/staff/orders/:id', element: <OrderDetail />, layout: ProtectedLayout },
        { path: '/staff/orders/:id/ver/:verId', element: <PreviousOrderDetail />, layout: ProtectedLayout },
        { path: '/staff/orders/create', element: <CreateOrder />, layout: ProtectedLayout },
        { path: '/staff/orders/edit/:id', element: <EditOrder />, layout: ProtectedLayout },
        { path: '/staff/preview/owner/order/overview/id/:id', element: <OrderPreview />, layout: null },
        { path: '/staff/orders/print/:id', element: <QuotationOrderPrint />, layout: null },
        { path: '/staff/orders/print/:id/internal', element: <DetailedOrderPrint />, layout: null },
        { path: '/staff/sales', element: <SalesMain />, layout: ProtectedLayout },
        { path: '/staff/sales/:id', element: <SaleDetail />, layout: ProtectedLayout },
        { path: '/staff/purchase-orders', element: <POMain />, layout: ProtectedLayout },
        { path: '/staff/purchase-orders/property/view', element: <POPropertyOverview />, layout: ProtectedLayout },
        { path: '/staff/purchase-orders/create', element: <CreatePO />, layout: ProtectedLayout },
        { path: '/staff/purchase-orders/:id', element: <PODetail />, layout: ProtectedLayout },
        { path: '/staff/purchase-orders/edit/:id', element: <EditPO />, layout: ProtectedLayout },
        { path: '/staff/purchase-orders/fulfillment/:id', element: <POFulfillment />, layout: ProtectedLayout },
        { path: '/staff/purchase-orders/print/:id', element: <POPrint />, layout: null },
        { path: '/staff/purchase-orders/print/payment-voucher/:id', element: <POPaymentVoucher />, layout: null },
        { path: '/staff/purchase-orders/:id/invoices', element: <POInvoice />, layout: ProtectedLayout },
        { path: '/staff/purchase-orders/:id/invoices/:invId/print', element: <POInvoicePrint />, layout: null },
        { path: '/staff/discountFee', element: <DiscountFeeMain />, layout: ProtectedLayout },
        { path: '/staff/reno-progress/overview', element: <PMMain />, layout: ProtectedLayout },
        { path: '/staff/reno-progress/overview/v3', element: <PMMainV3 />, layout: ProtectedLayout },
        { path: '/staff/reno-progress/progress-tracker', element: <PMProgressTrack />, layout: ProtectedLayout },
        { path: '/staff/reno-progress/:id', element: <ProgressMgnt />, layout: ProtectedLayout },
        { path: '/staff/reno-progress/:id/old-ver', element: <ProgressMgnt />, layout: ProtectedLayout },
        { path: '/staff/reno-progress/:id/defect-inspection-report', element: <DefectInspectionReport />, layout: ProtectedLayout },
        { path: '/staff/di-forms/:id', element: <DIReport />, layout: ProtectedLayout },
        { path: '/staff/reno-progress/:id/key-management', element: <KeyManagementOverview />, layout: ProtectedLayout },
        { path: '/staff/reno-progress/:id/key-management/update', element: <UpdateKeyManagement />, layout: ProtectedLayout },
        { path: '/staff/di-forms', element: <DIFormMain />, layout: ProtectedLayout },
        { path: '/staff/users', element: <UsersMain />, layout: ProtectedLayout },
        { path: '/staff/users/:id', element: <UserDetail />, layout: ProtectedLayout },
        { path: '/staff/users/internal/add', element: <AddInternalUser />, layout: ProtectedLayout },
        { path: '/staff/users/add', element: <AddUser />, layout: ProtectedLayout },
        { path: '/staff/users/add/owner', element: <AddOwner />, layout: ProtectedLayout },
        { path: '/staff/inventory', element: <InventoryMain />, layout: ProtectedLayout },
        { path: '/staff/finance/sales-order-po', element: <SalesOrderPO />, layout: ProtectedLayout },
        { path: '/staff/otp-requests', element: <OTPRequestList />, layout: ProtectedLayout },
        { path: '/staff/developer-tools', element: <DeveloperTool />, layout: ProtectedLayout },
    ],
    // Owner
    [
        { path: '/owner/login', element: <OwnerLogin />, layout: null },
        { path: '/owner', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/owner/quotations', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/owner/reno-progress', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/owner/profile', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/owner/home', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/owner/invoice/:id/view', element: <ViewQuotation />, layout: OwnerProtectedLayout },
        { path: '/owner/invoice/:id/payment/success', element: <PaymentSuccess />, layout: OwnerProtectedLayout },
        { path: '/owner/invoice/:id/payment/error', element: <PaymentError />, layout: OwnerProtectedLayout },
        { path: '/owner/success/test', element: <PaymentSuccess />, layout: null },
        { path: '/owner/form/reno-registration-forms/:id', element: <RenoRegistrationFormDetail />, layout: OwnerProtectedLayout },
        { path: '/owner/order/overview/id/:id', element: <OrderOverview />, layout: OwnerProtectedLayout },
        { path: '/owner/confirm/order/otp/verify', element: <OTPConfirmOrder />, layout: null },
        { path: '/owner/confirm/order', element: <OrderConfirmSuccess />, layout: null },
        { path: '/owner/quotation-request-form', element: <OwnerRenoRegistrationForm />, layout: null },
        { path: '/owner/quotation-request-form/success', element: <OwnerFormSubmitSuccess />, layout: null },
        { path: '/owner/reno/progress/:id', element: <RenoProgressDetail />, layout: OwnerProtectedLayout },
        { path: '/owner/reno/accept-form/:id', element: <RenoAcceptanceForm />, layout: OwnerProtectedLayout },
        { path: '/owner/reno/:id/inspection', element: <OwnerInspectionReport />, layout: OwnerProtectedLayout },
        { path: '/owner/reno/progress/:id/phase/:phase/attachments', element: <RenoProgressPhaseAttachments />, layout: OwnerProtectedLayout },
        { path: '/owner/order/:id/customize-addons', element: <CustomAddonPackage />, layout: OwnerProtectedLayout },
    ],
    // Operation
    [
        { path: '/op/login', element: <OperationLogin />, layout: null },
        { path: '/op/home', element: <OperationHome />, layout: OperationProtectedLayout },
        { path: '/op', element: <OperationHome />, layout: OperationProtectedLayout },
        { path: '/op/reno/defect-inspection-form/:id', element: <DefectInspectionFormPage />, layout: OperationProtectedLayout },
        { path: '/op/reno/qc-form', element: <QCFormPage />, layout: OperationProtectedLayout },
        { path: '/op/reno/qc-forms/:id/detail', element: <QCFormDetail />, layout: OperationProtectedLayout },
        { path: '/op/form/submit/success', element: <OpFormSubmitSuccess />, layout: OperationProtectedLayout },
        { path: '/op/reno/progress/:id', element: <RenoProgressManagement />, layout: OperationProtectedLayout },
    ],
    // Vendor
    [
        { path: '/vendor/login', element: <VendorLogin />, layout: null },
    ],
    // General
    [
        { path: '/', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/public/test', element: <Test />, layout: null },
        { path: '/public/themakeover/test', element: <MakeoverLanding />, layout: null },
        { path: '/public/di-form/report', element: <PublicDIReport />, layout: null },
        { path: '/public/investor-interest-form', element: <InvestorInterestForm />, layout: null },
    ],
]

function App() {
    const hostname = window.location.hostname;

    // Define route groups based on domain
    const isMainDomain = hostname === 'renoxpert.my' || hostname === 'localhost';
    const isStaffDomain = hostname === 'app.renoxpert.my' || hostname === 'sapp.renoxpert.my' || hostname === 'localhost';
    const isClientDomain = hostname === 'client.renoxpert.my' || hostname === 'sclient.renoxpert.my' || hostname === 'localhost';
    const isOpDomain = hostname === 'op.renoxpert.my' || hostname === 'sop.renoxpert.my' || hostname === 'localhost';
    const isVendorDomain = hostname === 'ven.renoxpert.my' || hostname === 'sven.renoxpert.my' || hostname === 'localhost';
    const isPublicDomain = hostname === 'public.renoxpert.my' || hostname === 'staging.renoxpert.my' || hostname === 'localhost';

    useEffect(() => {
        KTComponent.init();
        KTLayout.init();
    }, []);

    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;

    if (isAuthenticated === null) {
        return <Loading />;
    }

    // Filter routes based on domain
    let filteredRoutes: { path: string; element: JSX.Element; layout?: React.FC<ProtectedLayoutProps> | null }[] = [];

    if (hostname === 'localhost') {
        // All routes in routeCatLocal
        filteredRoutes = [...routeCatLocal[0], ...routeCatLocal[1], ...routeCatLocal[2], ...routeCatLocal[3], ...routeCatLocal[4]];
    } else {
        if (isMainDomain) {
            // Main domain: Owner, Vendor, and General routes
            filteredRoutes = [...routeCat[1], ...routeCat[3], ...routeCat[4]]; // Owner, Vendor, General
        } else if (isStaffDomain) {
            // Staff domain: Staff/Admin routes
            filteredRoutes = routeCat[0]; // Staff/Admin
        } else if (isClientDomain) {
            // Client domain: Owner routes
            filteredRoutes = routeCat[1]; // Owner
        } else if (isOpDomain) {
            // Operation domain: Operation routes
            filteredRoutes = routeCat[2]; // Operation
        } else if (isVendorDomain) {
            // Vendor domain: Vendor routes
            filteredRoutes = routeCat[3]; // Vendor
        } else if (isPublicDomain) {
            // Vendor domain: Vendor routes
            filteredRoutes = routeCat[4]; // Vendor
        } else {
            // Fallback for invalid domains
            // filteredRoutes = [{ path: '*', element: <NotFound />, layout: null }];
        }
    }

    // Convert filtered routes to createBrowserRouter format
    const routes: RouteObject[] = filteredRoutes.map(({ path, element, layout: Layout }) => ({
        path,
        element: Layout ? <Layout>{element}</Layout> : element,
    }));

    // Create router with filtered routes
    const router = createBrowserRouter(routes, {
        future: {
            // v7_startTransition: true,
            // v7_relativeSplatPath: true,
        },
    });

    return <RouterProvider router={router} />;
}

export default App;