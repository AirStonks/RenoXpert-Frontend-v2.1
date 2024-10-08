// src\App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import KTComponent from './metronic/core';
import KTLayout from './metronic/app/layouts/demo1';
import { useLocation } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './utils/ProtectedRoute';
import MasterLayout from './pages/Master';
import Dashboard from './pages/Dashboard';
import ProductMain from './pages/Product/ProductMain';
import CreateProduct from './pages/Product/CreateProduct';
import EditProduct from './pages/Product/EditProduct';
import ProductCategory from './pages/Product/ProductCategory';
import PackageMain from './pages/Product/Package/PackageMain';
import CreatePackage from './pages/Product/Package/CreatePackage';
import QuotationMain from './pages/Quotation/QuotationMain';
import CreateQuotation from './pages/Quotation/CreateQuotation';
import EditQuotation from './pages/Quotation/EditQuotation';
import Loading from './components/Loading';
import ContactMain from './pages/Contact/ContactMain';
import PropertyMain from './pages/Property/PropertyMain';
import OrderMain from './pages/Order/OrderMain';
import CreateOrder from './pages/Order/CreateOrder';
import EditNewOrderQuotation from './pages/Order/EditNewOrderQuotation';
import EditOrder from './pages/Order/EditOrder';
import EditOrderQuotation from './pages/Order/EditOrderQuotation';
import SalesMain from './pages/Sales/SalesMain';
import SaleDetail from './pages/Sales/SaleDetail';
import DiscountFeeMain from './pages/DiscountFee/DiscountFeeMain';
import EditPackage from './pages/Product/Package/EditPackage';
import ViewQuotation from './pages/OwnerPages/ViewQuotation';
import Test from './pages/Test';
import PaymentSuccess from './pages/OwnerPages/PaymentSuccess';
import PaymentError from './pages/OwnerPages/PaymentError';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => (
  <ProtectedRoute>
    <MasterLayout>{children}</MasterLayout>
  </ProtectedRoute>
);

const routes = [
  { path: '/login', element: <Login />, layout: null },
  { path: '/', element: <Navigate to="/dashboard" replace />, layout: ProtectedLayout },
  { path: '/dashboard', element: <Dashboard />, layout: ProtectedLayout },

  /*--- TEST ---*/
  { path: '/test', element: <Test />, layout: null },
  
  /*--- QUOTATION VIEW ---*/
  { path: '/invoice/:id/view', element: <ViewQuotation />, layout: null },
  { path: '/invoice/:id/payment/success', element: <PaymentSuccess />, layout: null },
  { path: '/invoice/:id/payment/error', element: <PaymentError />, layout: null },

  /*--- PRODUCT ---*/
  { path: '/products', element: <ProductMain />, layout: ProtectedLayout },
  { path: '/products/create', element: <CreateProduct />, layout: ProtectedLayout },
  { path: '/products/edit/:id', element: <EditProduct />, layout: ProtectedLayout },
  { path: '/products/category', element: <ProductCategory />, layout: ProtectedLayout },

  /*--- PACKAGES ---*/
  { path: '/packages', element: <PackageMain />, layout: ProtectedLayout },
  { path: '/packages/create', element: <CreatePackage />, layout: ProtectedLayout },
  { path: '/packages/edit/:id', element: <EditPackage />, layout: ProtectedLayout },

  /*--- QUOTATION ---*/
  { path: '/quotations', element: <QuotationMain />, layout: ProtectedLayout },
  { path: '/quotations/create', element: <CreateQuotation />, layout: ProtectedLayout },
  { path: '/quotations/edit/:id', element: <EditQuotation />, layout: ProtectedLayout },

  /*--- CONTACT ---*/
  { path: '/contacts', element: <ContactMain />, layout: ProtectedLayout },

  /*--- PROPERTY ---*/
  { path: '/properties', element: <PropertyMain />, layout: ProtectedLayout },

  /*--- ORDER ---*/
  { path: '/orders', element: <OrderMain />, layout: ProtectedLayout },
  { path: '/orders/create', element: <CreateOrder />, layout: ProtectedLayout },
  { path: '/orders/quotation/edit/:id', element: <EditNewOrderQuotation />, layout: ProtectedLayout },
  { path: '/orders/edit/:id', element: <EditOrder />, layout: ProtectedLayout },
  { path: '/orders/edit/:id/quotation/edit/:quoteId', element: <EditOrderQuotation />, layout: ProtectedLayout },

  /*--- SALES ---*/
  { path: '/sales', element: <SalesMain />, layout: ProtectedLayout },
  { path: '/sales/:id', element: <SaleDetail />, layout: ProtectedLayout },

  /*--- DISCOUNT AND FEE ---*/
  { path: '/discountFee', element: <DiscountFeeMain />, layout: ProtectedLayout },
];

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    KTComponent.init();
    KTLayout.init();

    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, [location]);

  if (isAuthenticated === null) {
    return <Loading />; // Show a loading indicator
  }

  return (
    <Routes>
      {routes.map(({ path, element, layout: Layout = ProtectedLayout }) => (
        <Route
          key={path}
          path={path}
          element={
            path === '/login' || Layout === null 
              ? element 
              : <Layout>{element}</Layout>
          }
        />
      ))}
    </Routes>
  );
}

export default App;
