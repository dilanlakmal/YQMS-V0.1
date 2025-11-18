"use client"

import { Button } from "@/components/Chatbot/ui/button"
import { ScrollArea } from "@/components/Chatbot/ui/scroll-area"
import { MessageSquare, Plus, Settings, ChevronLeft, ChevronRight, Trash2, Edit3 } from "lucide-react"
import { cn } from "@/components/chatbot/lib/utils"
import { useState } from "react"

function ExpandedSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}) {
  const [hoveredId, setHoveredId] = useState(null)

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 translate-y-1">
        <Button
          variant="default"
          size="sm"
          className="gap-2 w-full justify-start hover:bg-primary/90 transition-colors"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="relative group"
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Button
                variant={activeConversationId === conv.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full gap-3 py-2.5 h-auto justify-start px-3 transition-all",
                  activeConversationId === conv.id && "bg-secondary/80 font-medium",
                  "hover:bg-secondary/60",
                )}
                onClick={() => onSelectConversation(conv.id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate text-left text-sm">{conv.title}</span>
              </Button>

              {hoveredId === conv.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-background/95 rounded-md p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle edit
                    }}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConversation(conv.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-secondary/60 transition-colors">
          <Settings className="h-4 w-4" />
          <span className="text-sm">Settings</span>
        </Button>

      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer">
        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-semibold">U</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">User</p>
          <p className="text-xs text-muted-foreground truncate">user@example.com</p>
        </div>
      </div>
      </div>
    </div>
  )
}

function CollapsedSidebar({ conversations, activeConversationId, onSelectConversation, onNewChat }) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 translate-y-1">
        <Button
          variant="default"
          size="icon"
          className="h-9 w-9 hover:bg-primary/90 transition-colors"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {conversations.map((conv) => (
            <Button
              key={conv.id}
              variant={activeConversationId === conv.id ? "secondary" : "ghost"}
              className={cn(
                "w-full h-10 justify-center px-0 transition-all",
                activeConversationId === conv.id && "bg-secondary/80",
                "hover:bg-secondary/60",
              )}
              onClick={() => onSelectConversation(conv.id)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-3 translate-y-[-0.27em]">
        <Button variant="ghost" size="icon" className="w-full h-10 hover:bg-secondary/60 transition-colors">
          <Settings className="h-4 w-4" />
        </Button> 

        <div className="flex items-center justify-center p-2">
        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-semibold">U</span>
        </div>
        </div>
      </div>
    </div>
  )
}

export function ChatSidebar({ isOpen, onClose, isExpanded, onToggle, activeConversationId, setActiveConversationId, conversations, setConversations, handleNewChat  }) {

  const handleDeleteConversation = (id) => {
    setConversations(conversations.filter((conv) => conv.id !== id))
    if (activeConversationId === id && conversations.length > 1) {
      setActiveConversationId(conversations[0].id)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-border bg-card transition-all duration-300 md:relative md:translate-x-0 shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isExpanded ? "w-64" : "w-16",
        )}
      >
        {isExpanded ? (
          <ExpandedSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
          />
        ) : (
          <CollapsedSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewChat={handleNewChat}
          />
        )}

        <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full bg-background shadow-md hover:shadow-lg transition-all hover:scale-110"
            onClick={onToggle}
          >
            {isExpanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        </div>
      </aside>
    </>
  )
}
