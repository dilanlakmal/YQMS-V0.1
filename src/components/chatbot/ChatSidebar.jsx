"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/Chatbot/ui/button";
import { ScrollArea } from "@/components/Chatbot/ui/scroll-area";
import {
  MessageSquare,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
} from "lucide-react";
import { cn } from "@/components/chatbot/lib/utils";
import { deleteConversation, editConversationTitle } from "./lib/api/conversation";

// Reusable user profile component
function UserProfile({ userData, center }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer",
        center && "justify-center"
      )}
    >
      <div className="h-8 w-8 rounded-full overflow-hidden">
        <img
          src={userData.profile}
          alt="User Avatar"
          className="h-full w-full object-cover"
        />
      </div>
      {!center && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{userData.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {userData.email}
          </p>
        </div>
      )}
    </div>
  );
}

// Reusable settings button
function SettingsButton({ iconOnly }) {
  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon" : "default"}
      className="w-full justify-start gap-3 hover:bg-secondary/60 transition-colors"
    >
      <Settings className="h-4 w-4" />
      {!iconOnly && <span className="text-sm">Settings</span>}
    </Button>
  );
}

//EDIT function
export function EditConversationTitle({
  isEditing,
  setIsEditing,
  title,
  onSave,
}) {
  const [value, setValue] = useState(title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // inputRef.current.select();
    }
  });

  const handleSave = () => {
    if (value.trim() && value !== title) {
      onSave(value.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setIsEditing(false);
  };

  return isEditing ? (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="
      w-full 
      border-b 
      border-primary/80 
      bg-primary/10 
      ring-2 
      ring-primary/40 
      bg-transparent 
      rounded-sm 
      text-sm 
      focus:outline-none"
    />
  ) : (
    <span className="flex-1 truncate text-left text-sm cursor-pointer">
      {title}
    </span>
  );
}

// Expanded sidebar
function ExpandedSidebar({
  conversations,
  setConversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  userData,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const updateConversationTitle = async (_id, newTitle) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === _id ? { ...conv, title: newTitle } : conv
      )
    );
    try {
      await editConversationTitle(_id, newTitle);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="flex h-full flex-col bg-background">
      {/* New Chat Button */}
      <div className="flex items-center justify-between border-border bg-background px-4 py-3 translate-y-1">
        <Button
          key="new_chat"
          variant="default"
          size="sm"
          className="gap-2 w-full justify-start hover:bg-primary/90 transition-colors"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className="relative group"
              onMouseEnter={() => setHoveredId(conv._id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Button
                variant={
                  activeConversationId === conv._id ? "secondary" : "ghost"
                }
                className={cn(
                  "w-full gap-3 py-2.5 h-auto justify-start px-3 transition-all",
                  activeConversationId === conv._id &&
                    "bg-secondary/80 font-medium",
                  "hover:bg-secondary/60"
                )}
                onClick={() => onSelectConversation(conv._id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <EditConversationTitle
                  isEditing={editingId === conv._id}
                  setIsEditing={(val) =>
                    !val ? setEditingId(null) : setEditingId(conv._id)
                  }
                  title={conv.title}
                  onSave={(newTitle) =>
                    updateConversationTitle(conv._id, newTitle)
                  }
                />
              </Button>

              {hoveredId === conv._id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-background/95 rounded-md p-1">
                  {[
                    {
                      icon: <Edit3 className="h-3 w-3" />,
                      onClick: () => {
                        setEditingId(conv._id);
                        setIsEditing(true);
                      },
                      type: "edit",
                    },
                    {
                      icon: <Trash2 className="h-3 w-3" />,
                      onClick: () => onDeleteConversation(conv._id),
                      type: "delete",
                    },
                  ].map((btn) => (
                    <Button
                      key={`${conv._id}-${btn.type}`}
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        btn.type === "delete"
                          ? "hover:bg-destructive hover:text-destructive"
                          : "hover:bg-secondary"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        btn.onClick();
                      }}
                    >
                      {btn.icon}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom User Profile + Settings */}
      <div className="border-t border-border/50 p-3">
        <SettingsButton />
        <UserProfile userData={userData} />
      </div>
    </div>
  );
}

// Collapsed sidebar
function CollapsedSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  userData,
}) {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* New Chat Button */}
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

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2 py-3, overflow-y-auto">
        <div className="space-y-1">
          {conversations.map((conv) => (
            <Button
              key={conv._id}
              variant={
                activeConversationId === conv._id ? "secondary" : "ghost"
              }
              className={cn(
                "w-full h-10 justify-center px-0 transition-all",
                activeConversationId === conv._id && "bg-secondary/80",
                "hover:bg-secondary/60"
              )}
              onClick={() => onSelectConversation(conv._id)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom User Profile + Settings */}
      <div className="border-t border-border/50 p-3 translate-y-[-0.27em]">
        <SettingsButton iconOnly />
        <UserProfile userData={userData} center />
      </div>
    </div>
  );
}

// Main ChatSidebar Component
export function ChatSidebar({
  isOpen,
  onClose,
  userData,
  isExpanded,
  onToggle,
  activeConversationId,
  setActiveConversationId,
  conversations,
  setConversations,
  handleNewChat,
}) {
  const handleDeleteConversation = (_id) => {
    setConversations(conversations.filter((conv) => conv._id !== _id));
    if (activeConversationId === _id && conversations.length > 1) {
      setActiveConversationId(conversations[0]._id);
    }
    deleteConversation(_id);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-border bg-card transition-all duration-300 md:relative md:translate-x-0 shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isExpanded ? "w-64" : "w-16"
        )}
      >
        {isExpanded ? (
          <ExpandedSidebar
            userData={userData}
            conversations={conversations}
            setConversations={setConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
          />
        ) : (
          <CollapsedSidebar
            userData={userData}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewChat={handleNewChat}
          />
        )}

        {/* Toggle Button */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full bg-background shadow-md hover:shadow-lg transition-all hover:scale-110"
            onClick={onToggle}
          >
            {isExpanded ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
