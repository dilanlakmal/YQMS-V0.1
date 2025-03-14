import { QrCode } from "lucide-react"; // Using QrCode as a placeholder for Power BI icon
import React, { useEffect, useState } from "react";

const PowerBI = () => {
  // State to track which card's iframe is visible and full-screen status
  const [activeCard, setActiveCard] = useState(null);
  const [fullScreenCard, setFullScreenCard] = useState(null);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth); // Track screen width dynamically

  // Array of card data with titles and iframe sources
  const cards = [
    {
      title: "Cutting BI",
      iframeSrc:
        "https://app.powerbi.com/reportEmbed?reportId=7f2389e7-6474-4fd7-855d-6a38a3fbc190&autoAuth=true&ctid=f984c19d-a2ed-4e64-8c7a-972829ca452c"
      //"https://app.powerbi.com/reportEmbed?reportId=607a70df-de55-4af9-9c2d-3e7aea027ac7&autoAuth=true&ctid=92fcc65f-272e-4d16-ba53-a9523f53980d",
      //"https://app.powerbi.com/view?r=eyJrIjoiOGZlOWZmZjYtYmQzMS00ZDgwLWI5NjQtZTZkNTI1YjM4MWJkIiwidCI6IjkyZmNjNjVmLTI3MmUtNGQxNi1iYTUzLWE5NTIzZjUzOTgwZCIsImMiOjEwfQ%3D%3D",
    },
    {
      title: "Washing BI",
      iframeSrc:
        "https://app.powerbi.com/reportEmbed?reportId=8d5cb249-8064-49dc-86fb-e70b57f27fe1&autoAuth=true&ctid=f984c19d-a2ed-4e64-8c7a-972829ca452c"

      //"https://app.powerbi.com/reportEmbed?reportId=5eb4eb9a-a7c3-4392-a381-40831829545a&autoAuth=true&ctid=92fcc65f-272e-4d16-ba53-a9523f53980d",
      //"https://app.powerbi.com/view?r=eyJrIjoiODhjNzU5ZWEtODc0YS00NDQ1LTljODMtOGVkZTQyZGE5YTU1IiwidCI6IjkyZmNjNjVmLTI3MmUtNGQxNi1iYTUzLWE5NTIzZjUzOTgwZCIsImMiOjEwfQ%3D%3D",
    },
    {
      title: "QA Audit BI",
      iframeSrc:
        "https://app.powerbi.com/reportEmbed?reportId=7f9ded0b-0ed4-4da3-9731-dd3fb4e79b97&autoAuth=true&ctid=f984c19d-a2ed-4e64-8c7a-972829ca452c"
      //"https://app.powerbi.com/reportEmbed?reportId=03aaa661-c46f-4c6c-9103-8374c63497ca&autoAuth=true&ctid=92fcc65f-272e-4d16-ba53-a9523f53980d",
      //"https://app.powerbi.com/view?r=eyJrIjoiYTE1OTgwOWQtMDg4MC00ODhkLWFmOGUtNGNhOTY2ZTk0NGI5IiwidCI6IjkyZmNjNjVmLTI3MmUtNGQxNi1iYTUzLWE5NTIzZjUzOTgwZCIsImMiOjEwfQ%3D%3D",
    },
    {
      title: "QC1 BI",
      iframeSrc:
        "https://app.powerbi.com/reportEmbed?reportId=595ae69a-7ff7-4b02-85de-854c740376b5&autoAuth=true&ctid=f984c19d-a2ed-4e64-8c7a-972829ca452c"

      //"https://app.powerbi.com/reportEmbed?reportId=5088363d-5166-4f18-ba8c-312b4155dee9&autoAuth=true&ctid=92fcc65f-272e-4d16-ba53-a9523f53980d",
      //"https://app.powerbi.com/view?r=eyJrIjoiMmI5MjFiZmYtNzk4Ny00YzlmLWIzMWItMjU0MDJhMDZmMWYzIiwidCI6IjkyZmNjNjVmLTI3MmUtNGQxNi1iYTUzLWE5NTIzZjUzOTgwZCIsImMiOjEwfQ%3D%3D",
    },
    {
      title: "QC2 BI",
      iframeSrc:
        "https://app.powerbi.com/reportEmbed?reportId=5dae5bbf-10c6-42e7-bbaa-39218bbc9540&autoAuth=true&ctid=f984c19d-a2ed-4e64-8c7a-972829ca452c"
      // "https://app.powerbi.com/reportEmbed?reportId=8e88232b-8619-4afd-aeca-7b3de90ab962&autoAuth=true&ctid=92fcc65f-272e-4d16-ba53-a9523f53980d",
      //"https://app.powerbi.com/view?r=eyJrIjoiZDA3YTY5MWQtNDlhZC00ZjI1LWFlZWEtMzg1NjBiZDlhYWI0IiwidCI6IjkyZmNjNjVmLTI3MmUtNGQxNi1iYTUzLWE5NTIzZjUzOTgwZCIsImMiOjEwfQ%3D%3D",
    },
    {
      title: "Sub Con BI",
      iframeSrc:
        "https://app.powerbi.com/reportEmbed?reportId=27937e8b-629e-44c7-bb1d-a0d86ea4a1d5&autoAuth=true&ctid=f984c19d-a2ed-4e64-8c7a-972829ca452c"

      // "https://app.powerbi.com/reportEmbed?reportId=6d2c0b1f-e41a-417a-b1c9-5f332de8484c&autoAuth=true&ctid=92fcc65f-272e-4d16-ba53-a9523f53980d",
      //"https://app.powerbi.com/view?r=eyJrIjoiMTBmOWNkNTItZTU5NC00NTdkLWE4ZTQtNTZiYTg4N2I0NjA0IiwidCI6IjkyZmNjNjVmLTI3MmUtNGQxNi1iYTUzLWE5NTIzZjUzOTgwZCIsImMiOjEwfQ%3D%3D",
    },
    {
      title: "QC Accuracy BI",
      iframeSrc:
        "https://app.powerbi.com/reportEmbed?reportId=1c018b13-d9b7-4ad1-9350-a0c706e995a3&autoAuth=true&ctid=f984c19d-a2ed-4e64-8c7a-972829ca452c"
      //"https://app.powerbi.com/reportEmbed?reportId=09c5c116-9067-40fc-9c83-b8263dd9b164&autoAuth=true&ctid=92fcc65f-272e-4d16-ba53-a9523f53980d",
      //"https://app.powerbi.com/view?r=eyJrIjoiMzZjOTA0NDItOGE4Yy00NmY5LTg2MmItNzk1MTkwYmU3MTRiIiwidCI6IjkyZmNjNjVmLTI3MmUtNGQxNi1iYTUzLWE5NTIzZjUzOTgwZCIsImMiOjEwfQ%3D%3D",
    }
  ];

  // Function to handle card clicks and toggle iframe visibility
  const handleCardClick = (index) => {
    setActiveCard(activeCard === index ? null : index);
  };

  // Function to handle full-screen mode
  const handleFullScreenClick = (index) => {
    setFullScreenCard(fullScreenCard === index ? null : index);
  };

  // Function to close full-screen mode
  const closeFullScreen = () => {
    setFullScreenCard(null);
  };

  // Effect to update screen width dynamically on resize
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize); // Cleanup
  }, []);

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50">
      {/* CHANGE: Updated page title to "Power BI Reports" with Power BI icon */}
      <h1 className="text-4xl font-bold mb-8 text-center flex items-center justify-center text-indigo-800 drop-shadow-md">
        <QrCode className="w-8 h-8 mr-2 text-indigo-600" />{" "}
        {/* Placeholder Power BI icon */}
        Power BI Reports
      </h1>

      {/* Grid of Smaller Square Cards - 4 on large, 2 on tablet, 1 on small */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-blue-100 to-indigo-200 shadow-lg rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 border-2 border-indigo-300 hover:border-indigo-500"
            onClick={() => handleCardClick(index)}
          >
            <div className="p-3 flex flex-col items-center justify-center h-60">
              {/* Card Title */}
              <h2 className="text-lg font-bold mb-2 text-indigo-800 text-center drop-shadow-sm">
                {card.title}
              </h2>

              {/* Conditionally render iframe when card is active */}
              {activeCard === index && (
                <iframe
                  title={card.title}
                  width="100%"
                  height="120"
                  src={card.iframeSrc}
                  frameBorder="0"
                  allowFullScreen="true"
                  className="rounded-md shadow-inner"
                ></iframe>
              )}

              {/* CHANGE: Ensure Full Screen Mode button is visible inside the box */}
              {activeCard === index && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click event
                    handleFullScreenClick(index);
                  }}
                  className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors duration-300 shadow-md hover:shadow-lg text-sm"
                >
                  Full Screen Mode
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Modal for Power BI Dashboard */}
      {fullScreenCard !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-full max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-indigo-800">
                {cards[fullScreenCard].title}
              </h2>
              <button
                onClick={closeFullScreen}
                className="text-red-500 hover:text-red-700 text-2xl"
              >
                ×
              </button>
            </div>
            <iframe
              title={cards[fullScreenCard].title}
              width={screenWidth} // Dynamically set to screen width
              height="800"
              src={cards[fullScreenCard].iframeSrc}
              frameBorder="0"
              allowFullScreen="true"
              className="rounded-md"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerBI;
