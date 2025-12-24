"use client"

import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  label = "Platform",
  onLeafSelect,
  activeValue,
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = item.items && item.items.length > 0
          const itemKey = item.value ?? item.title
          const itemContent = (
            <>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </>
          )

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={itemKey}>
                {onLeafSelect ? (
                  <SidebarMenuButton
                    isActive={activeValue === itemKey}
                    onClick={() => onLeafSelect(itemKey)}
                  >
                    {itemContent}
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url}>{itemContent}</a>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.value ?? subItem.title}>
                        {onLeafSelect ? (
                          <SidebarMenuSubButton
                            isActive={activeValue === (subItem.value ?? subItem.title)}
                            onClick={() =>
                              onLeafSelect(subItem.value ?? subItem.title)
                            }>
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        ) : (
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}


