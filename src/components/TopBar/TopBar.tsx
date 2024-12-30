import React from 'react';

interface TopBarProps {
  onClearData: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onClearData }) => {
  return (
    <div className="bg-white shadow-md p-4 flex justify-between items-center w-full">
      <h2 className="text-lg font-semibold text-gray-800">Data explorer</h2>
      <button
        onClick={onClearData}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out"
      >
        Clear Data
      </button>
    </div>
  );
};

export default TopBar;

