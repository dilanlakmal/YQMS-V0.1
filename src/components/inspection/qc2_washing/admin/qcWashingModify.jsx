import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import QCWashingDefectsTab from "./QCWashingDefectsTab";
import QCWashingFirstOutputTab from "./QCWashingFirstOutputTab";
import QCWashingCheckpointsTab from "./QCWashingCheckpointsTab";
import QCWashingStandardTable from "./QCWashingStanderd";

const QcWashingModify = () => {
  const [activeTab, setActiveTab] = useState("defects");

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        QC Washing Management
      </h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-700">
          <TabsTrigger 
            value="defects"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 transition-colors"
          >
            Defect Management
          </TabsTrigger>
          <TabsTrigger 
            value="firstOutput"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 transition-colors"
          >
            First Output Check
          </TabsTrigger>
          <TabsTrigger 
            value="checkpoints"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 transition-colors"
          >
            Checkpoint Management
          </TabsTrigger>
          <TabsTrigger 
            value="standerds"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-white dark:text-gray-300 transition-colors"
          >
            Standard Values
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="defects" className="mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
            <QCWashingDefectsTab />
          </div>
        </TabsContent>
        
        <TabsContent value="firstOutput" className="mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
            <QCWashingFirstOutputTab />
          </div>
        </TabsContent>
        
        <TabsContent value="checkpoints" className="mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
            <QCWashingCheckpointsTab />
          </div>
        </TabsContent>
        
        <TabsContent value="standerds" className="mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
            <QCWashingStandardTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QcWashingModify;
