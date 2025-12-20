export default function Page({ children }) {
  return (
    <div
      className="
        w-[210mm] h-[297mm]
        bg-white text-black
        p-[5mm]
        box-border
        overflow-hidden
        print:break-after-page
        shadow-lg print:shadow-none
        mx-auto my-4 print:my-0
      "
    >
      {children}
    </div>
  );
}
