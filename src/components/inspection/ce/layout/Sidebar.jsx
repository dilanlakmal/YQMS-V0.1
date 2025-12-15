"use client"

import * as React from "react"
import {
  Target,
  Users,
  DollarSign,
  Building2,
  Cpu,
  ClipboardList,
  Shirt,
  RotateCcw,
  UserX,
  AlertCircle,
  Award,
  UserCheck,
  Calendar,
  Briefcase,
  Layout,
  Database,
  List,
} from "lucide-react"

import { NavMain } from "./NavMain"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navGroups = [
  {
    label: "Target Master",
    items: [
      {
        title: "Target Master",
        icon: Layout,
        value: "targetMaster",
        isActive: true,
      },
      {
        title: "Target List",
        icon: List,
        value: "targetList",
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        title: "Master Data",
        icon: Database,
        items: [
          {
            title: "Buyer",
            value: "buyerName",
            icon: Users,
          },
          {
            title: "Cost Price",
            value: "costPrice",
            icon: DollarSign,
          },
          {
            title: "Department",
            value: "department",
            icon: Building2,
          },
          {
            title: "Machine",
            value: "machine",
            icon: Cpu,
          },
          {
            title: "Target Sample",
            value: "targetSample",
            icon: ClipboardList,
          },
          {
            title: "Fabric Type",
            value: "fabricType",
            icon: Shirt,
          },
          {
            title: "Rework Name",
            value: "reworkName",
            icon: RotateCcw,
          },
          {
            title: "Worker Black List",
            value: "workerBlackList",
            icon: UserX,
          },
          {
            title: "Main Reason",
            value: "mainReason",
            icon: AlertCircle,
          },
          {
            title: "Set Grade",
            value: "setGrade",
            icon: Award,
          },
          {
            title: "Manager Worker",
            value: "managerWorker",
            icon: UserCheck,
          },
          {
            title: "Month Off",
            value: "monthOff",
            icon: Calendar,
          },
          {
            title: "Skill Of Worker",
            value: "skillOfWorker",
            icon: Briefcase,
          },
        ],
      },
    ],
  },
]

function CESystemSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Layout className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">CE System</span>
            <span className="truncate text-xs">Master Data</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function CESidebar({ activeTab, onTabChange, ...props }) {
  return (
    <Sidebar collapsible="icon" className="!top-16 !h-[calc(100vh-4rem)]" {...props}>
      <SidebarHeader>
        <CESystemSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain
            key={group.label}
            label={group.label}
            items={group.items}
            onLeafSelect={onTabChange}
            activeValue={activeTab}
          />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

