// import { useEffect } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../../config";

// // Utility to convert VAPID key
// function urlBase64ToUint8Array(base64String) {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
//   const rawData = window.atob(base64);
//   const outputArray = new Uint8Array(rawData.length);
//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }
//   return outputArray;
// }

// const FincheckPushManager = ({ user }) => {
//   useEffect(() => {
//     // Only proceed if user exists and browser supports SW
//     if (
//       !user ||
//       !user.emp_id ||
//       !("serviceWorker" in navigator) ||
//       !("PushManager" in window)
//     ) {
//       return;
//     }

//     const subscribeToPush = async () => {
//       try {
//         // 1. Register Service Worker
//         // Note: '/sw.js' refers to the file in the public folder
//         const registration = await navigator.serviceWorker.register("/sw.js");

//         // 2. Check Permission
//         let permission = Notification.permission;
//         if (permission === "default") {
//           permission = await Notification.requestPermission();
//         }

//         if (permission !== "granted") {
//           console.log("Push Notification permission denied.");
//           return;
//         }

//         // 3. Get VAPID Public Key from Backend
//         const keyRes = await axios.get(
//           `${API_BASE_URL}/api/fincheck-reports/push/vapid-key`
//         );
//         const publicVapidKey = keyRes.data.publicKey;

//         // 4. Subscribe
//         const subscription = await registration.pushManager.subscribe({
//           userVisibleOnly: true,
//           applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
//         });

//         // 5. Send Subscription to Backend
//         await axios.post(
//           `${API_BASE_URL}/api/fincheck-reports/push/subscribe`,
//           {
//             empId: user.emp_id,
//             subscription: subscription,
//             userAgent: navigator.userAgent
//           }
//         );

//         console.log(
//           "✅ Fincheck Push Notification Subscribed for:",
//           user.emp_id
//         );
//       } catch (error) {
//         console.error("❌ Push Subscription Error:", error);
//       }
//     };

//     subscribeToPush();
//   }, [user]);

//   // This component is invisible
//   return null;
// };

// export default FincheckPushManager;

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { Bell, BellOff } from "lucide-react"; // Make sure you have lucide-react installed
// import { API_BASE_URL } from "../../../../../config";

// function urlBase64ToUint8Array(base64String) {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
//   const rawData = window.atob(base64);
//   const outputArray = new Uint8Array(rawData.length);
//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }
//   return outputArray;
// }

// const FincheckPushManager = ({ user }) => {
//   const [permission, setPermission] = useState("default");
//   const [isSubscribed, setIsSubscribed] = useState(false);

//   useEffect(() => {
//     if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
//     setPermission(Notification.permission);

//     // Check if already subscribed
//     navigator.serviceWorker.ready.then(async (registration) => {
//       const sub = await registration.pushManager.getSubscription();
//       if (sub) setIsSubscribed(true);
//     });
//   }, []);

//   const subscribeToPush = async () => {
//     if (!user || !user.emp_id) return;

//     try {
//       // 1. Request Permission (Must be triggered by user click)
//       const perm = await Notification.requestPermission();
//       setPermission(perm);

//       if (perm !== "granted") {
//         alert("Notifications blocked. Please enable them in browser settings.");
//         return;
//       }

//       // 2. Register Service Worker
//       const registration = await navigator.serviceWorker.register("/sw.js");

//       // 3. Get VAPID Key
//       const keyRes = await axios.get(
//         `${API_BASE_URL}/api/fincheck-reports/push/vapid-key`
//       );
//       const publicVapidKey = keyRes.data.publicKey;

//       // 4. Subscribe
//       const subscription = await registration.pushManager.subscribe({
//         userVisibleOnly: true,
//         applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
//       });

//       // 5. Send to Backend
//       await axios.post(`${API_BASE_URL}/api/fincheck-reports/push/subscribe`, {
//         empId: user.emp_id,
//         subscription: subscription,
//         userAgent: navigator.userAgent
//       });

//       setIsSubscribed(true);
//       alert("Device successfully subscribed to Notifications!");
//     } catch (error) {
//       console.error("Push Subscription Error:", error);
//       alert("Failed to subscribe. Check console.");
//     }
//   };

//   // IF already granted/subscribed, remain invisible
//   if (permission === "granted" && isSubscribed) {
//     return null;
//   }

//   // IF denied, don't show anything (don't annoy user)
//   if (permission === "denied") {
//     return null;
//   }

//   // ELSE: Show a Floating Button to ask for permission
//   return (
//     <div className="fixed bottom-20 right-4 z-50 animate-bounce">
//       <button
//         onClick={subscribeToPush}
//         className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg font-bold hover:bg-indigo-700 transition-colors"
//       >
//         <Bell className="w-5 h-5" />
//         Enable Notifications
//       </button>
//     </div>
//   );
// };

// export default FincheckPushManager;

// src/components/inspection/PivotY/QAReports/FincheckPushManager.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { Bell, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Utility: Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const FincheckPushManager = ({ user }) => {
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // State to hold error message for display on tablet
  const [debugError, setDebugError] = useState(null);

  useEffect(() => {
    // 1. Check Browser Support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push Messaging not supported");
      return;
    }

    setPermission(Notification.permission);

    // 2. Check if already subscribed
    navigator.serviceWorker.ready
      .then(async (registration) => {
        try {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
          }
        } catch (e) {
          console.error("Error checking subscription", e);
        }
      })
      .catch((e) => {
        // If this fails, SW isn't registered, likely due to SSL trust issues
        console.log("Service Worker not ready yet");
      });
  }, []);

  const subscribeToPush = async () => {
    if (!user || !user.emp_id) return;
    setLoading(true);
    setDebugError(null); // Clear previous errors

    try {
      // --- STEP 1: Request Permission ---
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        throw new Error(
          "Permission Denied. Please enable notifications in browser settings."
        );
      }

      // --- STEP 2: Register Service Worker ---
      // IMPORTANT: If SSL is invalid, this step fails.
      let registration;
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        // Wait for it to be active
        if (registration.installing) {
          console.log("Service worker installing");
        } else if (registration.waiting) {
          console.log("Service worker installed");
        } else if (registration.active) {
          console.log("Service worker active");
        }
      } catch (swError) {
        throw new Error(
          `SW Register Failed: ${swError.message}. (Check SSL/HTTPS trust)`
        );
      }

      // --- STEP 3: Get VAPID Public Key ---
      let publicVapidKey;
      try {
        const keyRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/push/vapid-key`
        );
        publicVapidKey = keyRes.data.publicKey;
      } catch (apiError) {
        throw new Error(`API VAPID Key Error: ${apiError.message}`);
      }

      // --- STEP 4: Subscribe to Push Manager ---
      let subscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      } catch (subError) {
        throw new Error(`PushManager Subscribe Error: ${subError.message}`);
      }

      // --- STEP 5: Send to Backend ---
      try {
        await axios.post(
          `${API_BASE_URL}/api/fincheck-reports/push/subscribe`,
          {
            empId: user.emp_id,
            subscription: subscription,
            userAgent: navigator.userAgent
          }
        );
      } catch (backendError) {
        throw new Error(`Backend Save Error: ${backendError.message}`);
      }

      // Success
      setIsSubscribed(true);
      alert("✅ Success! Tablet is now subscribed.");
    } catch (error) {
      console.error("Push Flow Error:", error);
      // Show the actual error message on the screen
      setDebugError(error.message || JSON.stringify(error));
      alert(`❌ ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Logic ---

  // 1. If already subscribed, hide button (or show tiny indicator if debugging)
  if (permission === "granted" && isSubscribed) {
    return null;
  }

  // 2. If blocked, show nothing
  if (permission === "denied") {
    return null;
  }

  // 3. Show Button + Error Box
  return (
    <div className="fixed bottom-20 right-4 z-[9999] flex flex-col items-end gap-2">
      {/* Debug Error Box (Visible on Tablet) */}
      {debugError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-sm mb-2 shadow-lg">
          <strong className="font-bold block">Setup Failed:</strong>
          <span className="block sm:inline text-xs break-words">
            {debugError}
          </span>
          <button
            className="absolute top-0 right-0 px-2 py-1"
            onClick={() => setDebugError(null)}
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={subscribeToPush}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl font-bold transition-all transform active:scale-95 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white animate-bounce"
        }`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {loading ? "Activating..." : "Enable Notifications"}
      </button>
    </div>
  );
};

export default FincheckPushManager;
