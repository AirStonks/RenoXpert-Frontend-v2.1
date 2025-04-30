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
import EditNewOrderQuotation from './pages/Order/EditNewOrderQuotation';
import EditOrder from './pages/Order/EditOrder';
import EditOrderQuotation from './pages/Order/EditOrderQuotation';
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
import Error404 from './pages/Errors/Error404';
import DIReport from './pages/ProjectManagement/DIReport';


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
        { path: '/registration-forms', element: <RegistrationFormMain />, layout: ProtectedLayout },
        { path: '/registration-forms/edit/:id', element: <EditRegistrationForm />, layout: ProtectedLayout },
        { path: '/registration-forms/:id', element: <RegistrationFormDetail />, layout: ProtectedLayout },
        { path: '/orders', element: <OrderMain />, layout: ProtectedLayout },
        { path: '/orders/:id', element: <OrderDetail />, layout: ProtectedLayout },
        { path: '/orders/:id/ver/:verId', element: <PreviousOrderDetail />, layout: ProtectedLayout },
        { path: '/orders/create', element: <CreateOrder />, layout: ProtectedLayout },
        { path: '/orders/edit/:id', element: <EditOrder />, layout: ProtectedLayout },
        { path: '/orders/edit/:id/quotation/edit/:quoteId', element: <EditOrderQuotation />, layout: ProtectedLayout },
        { path: '/preview/owner/order/overview/id/:id', element: <OrderPreview />, layout: null },
        { path: '/orders/print/:id', element: <QuotationOrderPrint />, layout: null },
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
        { path: '/reno-progress/progress-tracker', element: <PMProgressTrack />, layout: ProtectedLayout },
        { path: '/reno-progress/:id', element: <ProgressMgnt />, layout: ProtectedLayout },
        { path: '/reno-progress/:id/defect-inspection-report', element: <DefectInspectionReport />, layout: ProtectedLayout },
        { path: '/reno-progress/:id/key-management', element: <KeyManagementOverview />, layout: ProtectedLayout },
        { path: '/reno-progress/:id/key-management/update', element: <UpdateKeyManagement />, layout: ProtectedLayout },
        { path: '/di-forms', element: <DIFormMain />, layout: ProtectedLayout },
        { path: '/di-forms/:id', element: <DIReport />, layout: ProtectedLayout },
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
        { path: '/invoice/:id/view', element: <ViewQuotation />, layout: OwnerProtectedLayout },
        { path: '/invoice/:id/payment/success', element: <PaymentSuccess />, layout: OwnerProtectedLayout },
        { path: '/invoice/:id/payment/error', element: <PaymentError />, layout: OwnerProtectedLayout },
        { path: '/success/test', element: <PaymentSuccess />, layout: null },
        { path: '/owner/form/reno-registration-forms/:id', element: <RenoRegistrationFormDetail />, layout: OwnerProtectedLayout },
        { path: '/owner/login', element: <OwnerLogin />, layout: null },
        { path: '/', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/owner/home', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/owner', element: <OwnerHome />, layout: OwnerProtectedLayout },
        { path: '/owner/order/overview/id/:id', element: <OrderOverview />, layout: OwnerProtectedLayout },
        { path: '/otp/verify', element: <OTPVerifyPage />, layout: null },
        { path: '/confirm/order/otp/verify', element: <OTPConfirmOrder />, layout: null },
        { path: '/owner/reno-registration-form', element: <OwnerRenoRegistrationForm />, layout: null },
        { path: '/owner/reno-registration-form/success', element: <OwnerFormSubmitSuccess />, layout: null },
        { path: '/owner/reno/progress/:id', element: <RenoProgressDetail />, layout: OwnerProtectedLayout },
        { path: '/reno/accept-form/:id', element: <RenoAcceptanceForm />, layout: OwnerProtectedLayout },
        { path: '/owner/reno/:id/inspection', element: <OwnerInspectionReport />, layout: OwnerProtectedLayout },
        { path: '/owner/reno/progress/:id/phase/:phase/attachments', element: <RenoProgressPhaseAttachments />, layout: OwnerProtectedLayout },
        { path: '/owner/order/:id/customize-addons', element: <CustomAddonPackage />, layout: OwnerProtectedLayout },
    ],
    // Operation
    [
        { path: '/op/login', element: <OperationLogin />, layout: null },
        { path: '/op/home', element: <OperationHome />, layout: OperationProtectedLayout },
        { path: '/op', element: <OperationHome />, layout: OperationProtectedLayout },
        { path: '/reno/defect-inspection-form/:id', element: <DefectInspectionFormPage />, layout: OperationProtectedLayout },
        { path: '/reno/qc-form', element: <QCFormPage />, layout: OperationProtectedLayout },
        { path: '/reno/qc-forms/:id/detail', element: <QCFormDetail />, layout: OperationProtectedLayout },
        { path: '/op/form/submit/success', element: <OpFormSubmitSuccess />, layout: OperationProtectedLayout },
        { path: '/op/reno/progress/:id', element: <RenoProgressManagement />, layout: OperationProtectedLayout },
    ],
    // Vendor
    [
        { path: '/vendor-login', element: <VendorLogin />, layout: null },
    ],
    // General
    [
        { path: '/test', element: <Test />, layout: null },
        { path: '/test2', element: <Test2 />, layout: null },
        { path: '/themakeover/test', element: <MakeoverLanding />, layout: null },
        { path: '/di-form/report', element: <PublicDIReport />, layout: null },
        // Add catch-all route for 404
        { path: '*', element: <Error404 />, layout: null },
    ],
];

// Convert routeCat to createBrowserRouter format
const routes: RouteObject[] = routeCat.flat().map(({ path, element, layout: Layout }) => ({
    path,
    element: Layout ? <Layout>{element}</Layout> : element,
}));

// Create router with future flags
const router = createBrowserRouter(routes, {
    future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
    },
});

function App() {
    useEffect(() => {
        KTComponent.init();
        KTLayout.init();
    }, []);

    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;

    if (isAuthenticated === null) {
        return <Loading />;
    }

    return <RouterProvider router={router} />;
}

export default App;