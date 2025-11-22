import React from "react";
import { Bell } from "lucide-react";

export default function SpecialNotifications() {
  // Logic for Special/Urgent notifications will go here later
  return (
    <button className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors relative">
      <Bell className="w-5 h-5 text-red-600 dark:text-red-500" />
      {/* Badge Placeholder */}
      {/* <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" /> */}
    </button>
  );
}
