import React from "react";
 
function Footer() {
  return (
    <footer className="w-full bg-gray-100 text-center py-3 text-sm text-gray-600 mt-auto">
      © {new Date().getFullYear()} Version 1. Internal Use Only.
    </footer>
  );
}
 
export default Footer;
 
 