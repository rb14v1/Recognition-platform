function Footer() {
  return (
    <footer className="w-full bg-slate-100 text-center py-4 mt-auto border-t border-slate-200">
      <p className="text-sm text-slate-500 font-medium">
        © {new Date().getFullYear()} Version 1. Internal Platform. All Rights Reserved.
      </p>
    </footer>
  );
}

export default Footer;