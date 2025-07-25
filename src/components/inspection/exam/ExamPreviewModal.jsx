import React from "react";

const ExamPreviewModal = ({ isOpen, onClose, topic, questions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl my-8 relative">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Exam Preview
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Topic:
            </h3>
            <p className="text-2xl text-indigo-600 dark:text-indigo-400 mt-1">
              {topic || "No Topic Provided"}
            </p>
          </div>

          {questions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No questions have been added yet.
            </p>
          ) : (
            questions.map((q, index) => (
              <div
                key={q.id}
                className="border-t border-gray-200 dark:border-gray-700 pt-6"
              >
                <p className="font-bold text-lg text-gray-800 dark:text-gray-200">
                  Question {index + 1}:
                </p>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {q.question.eng}
                </p>
                <p className="mt-1 text-gray-500 dark:text-gray-400 font-khmer">
                  {q.question.khmer}
                </p>

                <div className="mt-4 pl-4">
                  {q.type === "essay" && (
                    <p className="text-sm italic text-gray-500">
                      Answer Type: Essay (Max {q.maxLength} characters)
                    </p>
                  )}
                  {q.type === "correct_incorrect" && (
                    <p className="text-sm italic text-gray-500">
                      Answer Type: Correct/Incorrect. Correct Answer:{" "}
                      <span className="font-semibold">{q.correctAnswer}</span>
                    </p>
                  )}
                  {q.type === "picture" && (
                    <div>
                      <p className="text-sm italic text-gray-500">
                        Answer Type: Picture Quiz
                      </p>
                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt="Quiz"
                          className="my-2 rounded max-h-52"
                        />
                      )}
                    </div>
                  )}
                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-center p-2 rounded ${
                            q.correctOptionIndex === optIndex
                              ? "bg-green-100 dark:bg-green-900/50"
                              : "bg-gray-50 dark:bg-gray-700/50"
                          }`}
                        >
                          <span
                            className={`font-bold mr-3 ${
                              q.correctOptionIndex === optIndex
                                ? "text-green-700 dark:text-green-300"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <div>
                            <p
                              className={`${
                                q.correctOptionIndex === optIndex
                                  ? "font-semibold"
                                  : ""
                              }`}
                            >
                              {opt.eng}
                            </p>
                            <p
                              className={`text-sm text-gray-500 font-khmer ${
                                q.correctOptionIndex === optIndex
                                  ? "font-semibold"
                                  : ""
                              }`}
                            >
                              {opt.khmer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPreviewModal;
