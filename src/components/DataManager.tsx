
import React from 'react';
import DataFetcher from './data/DataFetcher';
import AvailableData from './data/AvailableData';
import DataLimitations from './data/DataLimitations';

const DataManager = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Automatic Data Fetch */}
      <DataFetcher />

      {/* Cached Data */}
      <AvailableData />

      {/* Data Limitations Info */}
      <div className="lg:col-span-2">
        <DataLimitations />
      </div>
    </div>
  );
};

export default DataManager;
