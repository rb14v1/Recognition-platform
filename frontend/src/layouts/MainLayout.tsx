import { Outlet } from "react-router-dom";
// Removed useLocation as we don't need to check paths anymore
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Toaster } from 'react-hot-toast';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f3f6f9]">
      <Toaster position="top-center" />
      
      {/* 1. Header is now ALWAYS rendered. 
          Result: Logo shows everywhere. Avatar shows only if logged in. */}
      <Header />
      
      {/* 2. We always add 'pt-14' because the header is fixed and always visible */}
      <main className="flex-grow pt-14">
        <Outlet /> 
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;