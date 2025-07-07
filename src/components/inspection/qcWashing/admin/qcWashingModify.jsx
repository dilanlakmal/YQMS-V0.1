import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import QCWashingDefectsTab from "./QCWashingDefectsTab";
import QCWashingFirstOutputTab from "./QCWashingFirstOutputTab";
import QCWashingCheckpointsTab from "./QCWashingCheckpointsTab";

const QcWashingModify = () => {
  const [activeTab, setActiveTab] = useState("defects");

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">QC Washing Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="defects">Defect Management</TabsTrigger>
          <TabsTrigger value="firstOutput">First Output Check</TabsTrigger>
          <TabsTrigger value="checkpoints">Checkpoint Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="defects" className="mt-6">
          <QCWashingDefectsTab />
        </TabsContent>
        
        <TabsContent value="firstOutput" className="mt-6">
          <QCWashingFirstOutputTab />
        </TabsContent>
        
        <TabsContent value="checkpoints" className="mt-6">
          <QCWashingCheckpointsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QcWashingModify;