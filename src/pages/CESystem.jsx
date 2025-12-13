import { CESidebar } from "@/components/inspection/ce/layout/Sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import {
  Buyer,
  CostPrice,
  Department,
  Machine,
  TargetSample,
  FabricType,
  ReworkName,
  WorkerBlackList,
  MainReason,
  SetGrade,
  ManagerWorker,
  MonthOff,
  SkillOfWorker,
} from "@/components/inspection/ce/features/masters";
import { TargetMaster } from "@/components/inspection/ce/features/target-master";
import { TargetMasterImport } from "@/components/inspection/ce/features/target-master/TargetMasterImport";

export default function CESystem() {
  const [activeTab, setActiveTab] = useState("welcome");

  // Scroll to top when component mounts or tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const getPageTitle = () => {
    const titles = {
      targetMaster: "Target Master",
      targetList: "Target List",
      welcome: "Welcome",
      buyerName: "Buyer",
      costPrice: "Cost Price",
      department: "Department",
      machine: "Machine",
      targetSample: "Target Sample",
      fabricType: "Fabric Type",
      reworkName: "Rework Name",
      workerBlackList: "Worker Black List",
      mainReason: "Main Reason",
      setGrade: "Set Grade",
      managerWorker: "Manager Worker",
      monthOff: "Month Off",
      skillOfWorker: "Skill Of Worker",
    };
    return titles[activeTab] || "CE System";
  };

  const renderContent = () => {
    switch (activeTab) {
      case "welcome":
        return (
          <Card className="mt-4 dark:bg-sidebar">
            <CardContent className="flex flex-col items-center justify-center min-h-52 p-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Welcome to CE System</h3>
                <p className="text-muted-foreground">
                  Select an item from the sidebar to begin managing your master data.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      case "targetMaster":
        return <TargetMaster onImport={() => setActiveTab("targetMasterImport")} />;
      case "targetList":
        return (
          <Card className="mt-4 dark:bg-sidebar">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold">Target List</h3>
              <p className="text-muted-foreground mt-2">Target List content goes here.</p>
            </CardContent>
          </Card>
        );
      case "targetMasterImport":
        return <TargetMasterImport onBack={() => setActiveTab("targetMaster")} />;
      case "buyerName":
        return <Buyer />;
      case "costPrice":
        return <CostPrice />;
      case "department":
        return <Department />;
      case "machine":
        return <Machine />;
      case "targetSample":
        return <TargetSample />;
      case "fabricType":
        return <FabricType />;
      case "reworkName":
        return <ReworkName />;
      case "workerBlackList":
        return <WorkerBlackList />;
      case "mainReason":
        return <MainReason />;
      case "setGrade":
        return <SetGrade />;
      case "managerWorker":
        return <ManagerWorker />;
      case "monthOff":
        return <MonthOff />;
      case "skillOfWorker":
        return <SkillOfWorker />;
      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Select a menu item</h3>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <SidebarProvider>
      <CESidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("welcome");
                  }}
                  className="cursor-pointer"
                >
                  CE System
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              {activeTab === "targetMasterImport" ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("targetMaster");
                      }}
                      className="cursor-pointer"
                    >
                      Target Master
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Import</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

