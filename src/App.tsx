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
import Test from './pages/Test';
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

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => (
  <ProtectedRoute>
    <MasterLayout>{children}</MasterLayout>
  </ProtectedRoute>
);

const routes = [
  { path: '/login', element: <Login /> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/dashboard', element: <Dashboard /> },

  /*--- TESt ---*/
  { path: '/test', element: <Test /> },


  /*--- PRODUCT ---*/
  { path: '/products', element: <ProductMain /> },
  // { path: '/products/:id', element: <Product /> },
  { path: '/products/create', element: <CreateProduct /> },
  { path: '/products/edit/:id', element: <EditProduct /> },
  { path: '/products/category', element: <ProductCategory /> },


  /*--- PACKAGES ---*/
  { path: '/packages', element: <PackageMain /> },
  // { path: '/packages/:id', element: <ProductEdit /> },
  { path: '/packages/create', element: <CreatePackage /> },
  // { path: '/packages/edit/:id', element: <ProductEdit /> },


  /*--- QUOTATION ---*/
  { path: '/quotations', element: <QuotationMain /> },
  // { path: '/quotations/:id', element: <ProductEdit /> },
  { path: '/quotations/create', element: <CreateQuotation /> },
  { path: '/quotations/edit/:id', element: <EditQuotation /> },


  /*--- CONTACT ---*/
  { path: '/contacts', element: <ContactMain /> },
  // { path: '/contacts/:id', element: <ProductEdit /> },
  // { path: '/contacts/create', element: <CreateQuotation /> },
  // { path: '/contacts/edit/:id', element: <EditQuotation /> },


  /*--- PROPERTY ---*/
  { path: '/properties', element: <PropertyMain /> },
  // { path: '/contacts/:id', element: <ProductEdit /> },
  // { path: '/contacts/create', element: <CreateQuotation /> },
  // { path: '/contacts/edit/:id', element: <EditQuotation /> },


  /*--- ORDER ---*/
  { path: '/orders', element: <OrderMain /> },
  // { path: '/contacts/:id', element: <ProductEdit /> },
  { path: '/orders/create', element: <CreateOrder /> },
  { path: '/orders/quotation/edit/:id', element: <EditNewOrderQuotation /> },
  { path: '/orders/edit/:id', element: <EditOrder /> },
  { path: '/orders/edit/:id/quotation/edit/:quoteId', element: <EditOrderQuotation /> },

  
  /*--- SALES ---*/
  { path: '/sales', element: <SalesMain /> },
  { path: '/sales/:id', element: <SaleDetail /> },

  
  /*--- DISCOUNT AND FEE ---*/
  { path: '/discountFee', element: <DiscountFeeMain /> },
  // { path: '/discountFee/create', element: <CreateDiscountFee /> },
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
      {routes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            path === '/login' ? element : <ProtectedLayout>{element}</ProtectedLayout>
          }
        />
      ))}
    </Routes>
  );
}



export default App;