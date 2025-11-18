import { FaRobot } from "react-icons/fa"; // from Font Awesome set

export default function ChatIcon({ onClick }) {
  console.log("ChatIcon mounted");

  return (
    <div
      onClick={(e) => {
        console.log("ChatIcon clicked", e);
        onClick?.();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-600 transition duration-150"
    >
      <FaRobot className="w-6 h-6 text-white" aria-hidden="true" />
    </div>
  );
}
