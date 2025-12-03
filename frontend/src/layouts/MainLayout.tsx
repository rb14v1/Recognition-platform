import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Toaster } from 'react-hot-toast';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f3f6f9]">
      <Toaster position="top-center" />
      <Header />
      <main className="flex-grow pt-14"> {/* pt-14 compensates for fixed header */}
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;