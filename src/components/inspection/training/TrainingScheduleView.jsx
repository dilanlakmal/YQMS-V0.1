import React from "react";
import { useTranslation } from "react-i18next";

const TrainingScheduleView = () => {
  const { t } = useTranslation();

  // Data hardcoded from the provided image. In a real app, this would be fetched from the backend.
  const trainingData = [
    {
      id: 1,
      topic: "Munsell test",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "3 January 2025",
      startDate: "3 January 2025",
      endDate: "5 January 2025",
      time: "3:00-4:30",
      hours: 1.5
    },
    {
      id: 2,
      topic: "Clockwise - Garment Inspection",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "9 January 2025",
      startDate: "9 January 2025",
      endDate: "9 January 2025",
      time: "3:00-4:30",
      hours: 1.5
    },
    {
      id: 3,
      topic: "How to read Techpack / BOM",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "16 January 2025",
      startDate: "16 January 2025",
      endDate: "6 February 2025",
      time: "3:00-4:30",
      hours: 1.5
    },
    {
      id: 4,
      topic: "How to measure Training / Mathematics",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "5 February 2025",
      startDate: "5 February 2025",
      endDate: "5 February 2025",
      time: "12:30-2:00",
      hours: 1.5
    },
    {
      id: 5,
      topic: "Cutting Inspection Process",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "20 February 2025",
      startDate: "20 February 2025",
      endDate: "22 February 2025",
      time: "08:00-9:00",
      hours: 1.5
    },
    {
      id: 6,
      topic: "Trim Defect Classification",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "27 February 2025",
      startDate: "27 February 2025",
      endDate: "28 February 2025",
      time: "12:30-2:00",
      hours: 1.5
    },
    {
      id: 7,
      topic: "Garment Defect Classification",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "3 March 2025",
      startDate: "3 March 2025",
      endDate: "7 March 2025",
      time: "12:30-2:00",
      hours: 1.5
    },
    {
      id: 8,
      topic: "4 Point System Fabric Inspection Procedure",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "14 March 2025",
      startDate: "14 March 2025",
      endDate: "17 March 2025",
      time: "12:30-2:00",
      hours: 1.5
    },
    {
      id: 9,
      topic: "Fabric Defect Classification",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "21 May 2025",
      startDate: "21 May 2025",
      endDate: "22 March 2025",
      time: "3:00-4:30",
      hours: 1.5
    },
    {
      id: 10,
      topic: "Aqua Boy",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "7 April 2025",
      startDate: "7 April 2025",
      endDate: "9 April 2025",
      time: "3:00-4:30",
      hours: 1.5
    },
    {
      id: 11,
      topic: "Inline / Endline QA Procedure",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "8 May 2025",
      startDate: "8 May 2025",
      endDate: "9 May 2025",
      time: "12:30-2:00",
      hours: 1.5
    },
    {
      id: 12,
      topic: "Washing Process/ Defect Classification",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "16 May 2025",
      startDate: "16 May 2025",
      endDate: "17 May 2025",
      time: "12:30-2:00",
      hours: 1.5
    },
    {
      id: 13,
      topic: "Metal Free Policy Training",
      trainers: "CSR",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "24 July 2025",
      startDate: "24 July 2025",
      endDate: "30 July 2025",
      time: "",
      hours: ""
    },
    {
      id: 14,
      topic: "Printing Defect Classification",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "1 June 2025",
      startDate: "1 June 2025",
      endDate: "6 June 2025",
      time: "",
      hours: ""
    },
    {
      id: 15,
      topic: "Product Safety Training",
      trainers: "CSR",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "1 August 2025",
      startDate: "1 August 2025",
      endDate: "6 August 2025",
      time: "",
      hours: ""
    },
    {
      id: 16,
      topic: "Embroidery Defect Classification",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "8 June 2025",
      startDate: "8 June 2025",
      endDate: "14 June 2025",
      time: "",
      hours: ""
    },
    {
      id: 17,
      topic: "Heat Transfer Defect Classification/SCC",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "16 June 2025",
      startDate: "16 June 2025",
      endDate: "22 June 2025",
      time: "",
      hours: ""
    },
    {
      id: 18,
      topic: "Stitch Type",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "24 June 2025",
      startDate: "24 June 2025",
      endDate: "30 June 2025",
      time: "",
      hours: ""
    },
    {
      id: 19,
      topic: "Pattern Familiarization",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "1 July 2025",
      startDate: "1 July 2025",
      endDate: "6 July 2025",
      time: "",
      hours: ""
    },
    {
      id: 20,
      topic: "ACC Inspection Procedure",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "8 July 2025",
      startDate: "8 July 2025",
      endDate: "14 July 2025",
      time: "",
      hours: ""
    },
    {
      id: 21,
      topic: "Hangtag and Labelling Standards",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "16 July 2025",
      startDate: "16 July 2025",
      endDate: "22 July 2025",
      time: "",
      hours: ""
    },
    {
      id: 22,
      topic: "Right First Time Training",
      trainers: "Yuth / Dario",
      support: "QO/QA Leader",
      trainee: "All QA",
      method: "Lecture & Actual",
      planDate: "8 August 2025",
      startDate: "8 August 2025",
      endDate: "14 August 2025",
      time: "",
      hours: ""
    }
  ];

  const headers = [
    "#",
    "Training Topics",
    "Trainers",
    "Training Support",
    "Trainee",
    "Method of Training",
    "Plan date",
    "Start Date",
    "End date",
    "Training Time",
    "Number of Training Hours"
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {t(
                  `training.table.${header.toLowerCase().replace(/ /g, "_")}`,
                  header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {trainingData.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {row.id}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.topic}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.trainers}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.support}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.trainee}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.method}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.planDate}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.startDate}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.endDate}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.time}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {row.hours}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainingScheduleView;
