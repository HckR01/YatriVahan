const Footer = () => {
  return (
    <footer className="bg-[#3B0D12]">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-11 sm:px-8 md:flex-row">
        <div>
          <p className="text-[23px] font-extrabold text-white">YatriVahan</p>

          <p className="mt-2 text-[16px] text-[#F2C9C2]">
            Shared local travel made simple.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-7 gap-y-4">
          <button className="text-[16px] text-white hover:underline">
            About
          </button>

          <button className="text-[16px] text-white hover:underline">
            Safety
          </button>

          <button className="text-[16px] text-white hover:underline">
            Help
          </button>

          <button className="text-[16px] text-white hover:underline">
            Contact
          </button>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
