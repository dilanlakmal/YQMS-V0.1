import React, { useState } from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isOpen, toggleSidebar, addTab }) => {
  const { t } = useTranslation();
  const [subMenuOpen, setSubMenuOpen] = useState({
    orderData: false,
    qc2Inspection: false,
  });

  const toggleSubMenu = (menu) => {
    setSubMenuOpen((prevState) => ({
      ...prevState,
      [menu]: !prevState[menu],
    }));
  };

  const handleMenuClick = (optionName) => {
    addTab(optionName);
  };

  return (
    <>
      <div
        className={`
          fixed
          inset-y-0
          left-0
          transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          transition-transform
          duration-300
          ease-in-out
          w-64
          bg-gray-800
          h-screen
          text-white
          z-30
        `}
      >
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-2xl mt-16 font-bold">YQMS</h2>
          <button onClick={toggleSidebar} className="text-white mt-16 focus:outline-none">
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-4">
          <ul>
            <li className="px-4 py-2 hover:bg-gray-700">
              <button onClick={() => handleMenuClick('QC2 Order')} className="w-full text-left focus:outline-none">
               {t("sideBar.qc2_order")}
              </button>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <button onClick={() => toggleSubMenu('orderData')} className="w-full text-left focus:outline-none flex justify-between items-center">
              {t("home.order_data")}
                <ChevronDown className={`h-5 w-5 transition-transform ${subMenuOpen.orderData ? 'transform rotate-180' : ''}`} />
              </button>
              {subMenuOpen.orderData && (
                <ul className="pl-4 mt-2">
                  <li className="px-4 py-2 hover:bg-gray-600">
                    <button onClick={() => handleMenuClick('Washing')} className="w-full text-left focus:outline-none">
                    {t("home.washing")}
                    </button>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-600">
                    <button onClick={() => handleMenuClick('OPA')} className="w-full text-left focus:outline-none">
                    {t("home.opa")}
                    </button>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-600">
                    <button onClick={() => handleMenuClick('Ironing')} className="w-full text-left focus:outline-none">
                    {t("home.ironing")}
                    </button>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-600">
                    <button onClick={() => handleMenuClick('Packing')} className="w-full text-left focus:outline-none">
                    {t("home.packing")}
                    </button>
                  </li>
                </ul>
              )}
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <button onClick={() => toggleSubMenu('qc2Inspection')} className="w-full text-left focus:outline-none flex justify-between items-center">
              {t("home.qc2_inspection")}
                <ChevronDown className={`h-5 w-5 transition-transform ${subMenuOpen.qc2Inspection ? 'transform rotate-180' : ''}`} />
              </button>
              {subMenuOpen.qc2Inspection && (
                <ul className="pl-4 mt-2">
                  <li className="px-4 py-2 hover:bg-gray-600">
                    <button onClick={() => handleMenuClick('Output')} className="w-full text-left focus:outline-none">
                    {t("sideBar.output")}
                    </button>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-600">
                    <button onClick={() => handleMenuClick('Defect')} className="w-full text-left focus:outline-none">
                    {t("sideBar.defect")}
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      </div>
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-16 left-1 z-50 text-white bg-gray-800 p-2 rounded-md focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
    </>
  );
};

export default Sidebar;
