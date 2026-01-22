import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  FileText,
  Scissors,
  User
} from "lucide-react";
import axios from "axios";
import { useAuth } from "./authentication/AuthContext";
import { API_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";

export default function NormalNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  // 1. Fetch Data
  const fetchNotifications = async () => {
    if (!user?.emp_id) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/normal-notifications/${user.emp_id}`
      );
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  // 2. Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Action Handlers
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already
    if (!notification.readBy.includes(user.emp_id)) {
      try {
        // Optimistic UI update
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id
              ? { ...n, readBy: [...n.readBy, user.emp_id] }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        await axios.put(`${API_BASE_URL}/api/normal-notifications/read`, {
          notificationId: notification._id,
          emp_id: user.emp_id
        });
      } catch (error) {
        console.error("Error marking read", error);
      }
    }

    // Close menu
    setIsOpen(false);

    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/normal-notifications/read-all`, {
        emp_id: user.emp_id
      });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readBy: [...new Set([...n.readBy, user.emp_id])]
        }))
      );
    } catch (error) {
      console.error("Error marking all read", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // =========================================================
  // SCALABLE RENDERER: Add new cases here for future reports
  // =========================================================
  const renderNotificationContent = (notification) => {
    const { metadata, type, sender } = notification;

    // Shared Header style
    const Header = () => (
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          {/* Icon Logic based on Type */}
          {type === "CUTTING_INSPECTION_SUBMISSION" ? (
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
              <Scissors className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
          ) : (
            <FileText className="w-4 h-4 text-gray-600" />
          )}
          <span className="font-semibold text-sm text-slate-800 dark:text-white">
            {notification.title}
          </span>
        </div>
        <span className="flex items-center text-[10px] text-slate-400 whitespace-nowrap">
          <Clock className="w-3 h-3 mr-1" />
          {formatTimeAgo(notification.createdAt)}
        </span>
      </div>
    );

    // --- CASE 1: Cutting Inspection ---
    if (type === "CUTTING_INSPECTION_SUBMISSION") {
      return (
        <div>
          <Header />
          <div className="ml-7">
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              Report Finished by{" "}
              <span className="text-xs text-slate-900 dark:text-white">
                {sender?.emp_id} | {sender?.name}
              </span>
            </p>

            {/* Dynamic Metadata Grid */}
            <div className="grid grid-cols-3 gap-y-2 gap-x-4 bg-white/60 dark:bg-black/20 rounded-md p-2.5 border border-slate-100 dark:border-slate-600/50">
              {/* MO & Table */}
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  MO Number
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                  {metadata.moNo}
                </span>
              </div>
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Table No
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {metadata.tableNo}
                </span>
              </div>

              {/* Qty & Bundles (New Fields) */}
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Inspected Qty
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {metadata.totalInspectionQty}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Bundles
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {metadata.checkedBundles} / {metadata.totalBundles}
                </span>
              </div>

              {/* Sizes (New Field - Full Width) */}
              <div className="flex flex-col col-span-2 border-t border-slate-200 dark:border-slate-600 pt-1 mt-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Sizes Checked
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 break-words">
                  {metadata.sizes}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- CASE 2: Future Example (Washing) ---
    if (type === "WASHING_ALERT") {
      return (
        <div>
          <Header />
          <div className="ml-6">
            <p className="text-xs">Wash Load {metadata?.loadId} completed.</p>
          </div>
        </div>
      );
    }

    // --- DEFAULT FALLBACK ---
    return (
      <div>
        <Header />
        <div className="ml-6">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {notification.message}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors relative"
      >
        <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-lg shadow-xl bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 focus:outline-none z-50 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/50 rounded-t-lg">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 flex items-center transition-colors"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isRead = notification.readBy.includes(user.emp_id);
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      relative p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 
                      transition-all duration-200 cursor-pointer group
                      ${
                        isRead
                          ? "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          : "bg-green-50/40 dark:bg-green-900/10 hover:bg-green-50/80 dark:hover:bg-green-900/20"
                      }
                    `}
                  >
                    {/* Unread Indicator Line */}
                    {!isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                    )}

                    {/* Render the content dynamically based on Type */}
                    {renderNotificationContent(notification)}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 rounded-b-lg text-center">
            <span className="text-[10px] text-slate-400">
              Notifications appear for 30 days
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
