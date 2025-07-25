import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusCircle,
  Type,
  CheckSquare,
  List,
  Image as ImageIcon,
  Eye,
  Trash2,
  X
} from "lucide-react";
import ExamPreviewModal from "./ExamPreviewModal";

const questionTypes = {
  ESSAY: "essay",
  MULTIPLE_CHOICE: "multiple_choice",
  CORRECT_INCORRECT: "correct_incorrect",
  PICTURE: "picture"
};

const CreateExam = ({ topic, setTopic, questions, setQuestions }) => {
  const { t } = useTranslation();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(), // Simple unique ID
      type: type,
      question: { eng: "", khmer: "" },
      // Type-specific properties
      ...(type === questionTypes.MULTIPLE_CHOICE && {
        options: [
          { eng: "", khmer: "" },
          { eng: "", khmer: "" }
        ],
        correctOptionIndex: 0
      }),
      ...(type === questionTypes.CORRECT_INCORRECT && {
        correctAnswer: "correct"
      }),
      ...(type === questionTypes.ESSAY && { maxLength: 250 }),
      ...(type === questionTypes.PICTURE && {
        image: null,
        imageUrl: "",
        answer: "",
        maxLength: 150
      })
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleQuestionTextChange = (id, lang, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, question: { ...q.question, [lang]: value } } : q
      )
    );
  };

  const handleOptionChange = (qId, optIndex, lang, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const newOptions = q.options.map((opt, i) =>
            i === optIndex ? { ...opt, [lang]: value } : opt
          );
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const setOptionCount = (id, count) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const currentOptions = q.options || [];
          const newOptions = Array.from(
            { length: count },
            (_, i) => currentOptions[i] || { eng: "", khmer: "" }
          );
          return {
            ...q,
            options: newOptions,
            correctOptionIndex: Math.min(q.correctOptionIndex, count - 1)
          };
        }
        return q;
      })
    );
  };

  const handleImageUpload = (id, file) => {
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      handleQuestionChange(id, "imageUrl", imageUrl);
      // In a real app you'd upload the file and store a permanent URL
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Create New Exam
          </h2>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Eye className="mr-2 -ml-1 h-5 w-5" />
            Preview
          </button>
        </div>

        <div>
          <label
            htmlFor="exam-topic"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Exam Topic
          </label>
          <input
            type="text"
            id="exam-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Final Inspection Procedure"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Add Question
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => addQuestion(questionTypes.MULTIPLE_CHOICE)}
            className="flex items-center btn-secondary"
          >
            <List className="h-4 w-4 mr-2" /> Multiple Choice
          </button>
          <button
            onClick={() => addQuestion(questionTypes.CORRECT_INCORRECT)}
            className="flex items-center btn-secondary"
          >
            <CheckSquare className="h-4 w-4 mr-2" /> Correct/Incorrect
          </button>
          <button
            onClick={() => addQuestion(questionTypes.ESSAY)}
            className="flex items-center btn-secondary"
          >
            <Type className="h-4 w-4 mr-2" /> Essay
          </button>
          <button
            onClick={() => addQuestion(questionTypes.PICTURE)}
            className="flex items-center btn-secondary"
          >
            <ImageIcon className="h-4 w-4 mr-2" /> Picture Quiz
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={index}
            onRemove={removeQuestion}
            onQuestionChange={handleQuestionChange}
            onQuestionTextChange={handleQuestionTextChange}
            onOptionChange={handleOptionChange}
            onSetOptionCount={setOptionCount}
            onImageUpload={handleImageUpload}
          />
        ))}
      </div>

      <ExamPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        topic={topic}
        questions={questions}
      />
    </div>
  );
};

// Sub-component for editing a single question
const QuestionEditor = ({
  question,
  index,
  onRemove,
  onQuestionChange,
  onQuestionTextChange,
  onOptionChange,
  onSetOptionCount,
  onImageUpload
}) => {
  const [activeLang, setActiveLang] = useState("eng");
  const inputClass =
    "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
          Quiz No: {index + 1}
        </h4>
        <button
          onClick={() => onRemove(question.id)}
          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Question
        </label>
        <div className="mt-1">
          <div className="border-b border-gray-200 dark:border-gray-600">
            <nav className="-mb-px flex space-x-4">
              <button
                onClick={() => setActiveLang("eng")}
                className={`lang-tab ${
                  activeLang === "eng" ? "lang-tab-active" : ""
                }`}
              >
                Eng
              </button>
              <button
                onClick={() => setActiveLang("khmer")}
                className={`lang-tab ${
                  activeLang === "khmer" ? "lang-tab-active" : ""
                }`}
              >
                Khmer
              </button>
            </nav>
          </div>
          {activeLang === "eng" && (
            <textarea
              value={question.question.eng}
              onChange={(e) =>
                onQuestionTextChange(question.id, "eng", e.target.value)
              }
              className={inputClass}
              rows="2"
            ></textarea>
          )}
          {activeLang === "khmer" && (
            <textarea
              value={question.question.khmer}
              onChange={(e) =>
                onQuestionTextChange(question.id, "khmer", e.target.value)
              }
              className={inputClass}
              rows="2"
            ></textarea>
          )}
        </div>
      </div>

      {/* Answer Section */}
      <div className="mt-4">
        {question.type === questionTypes.ESSAY && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Maximum Characters
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={question.maxLength}
              onChange={(e) =>
                onQuestionChange(
                  question.id,
                  "maxLength",
                  parseInt(e.target.value)
                )
              }
              className={inputClass + " w-32"}
            />
          </div>
        )}

        {question.type === questionTypes.CORRECT_INCORRECT && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Correct Answer:
            </p>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`correct-answer-${question.id}`}
                  checked={question.correctAnswer === "correct"}
                  onChange={() =>
                    onQuestionChange(question.id, "correctAnswer", "correct")
                  }
                  className="form-radio"
                />{" "}
                <span className="ml-2">Correct</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`correct-answer-${question.id}`}
                  checked={question.correctAnswer === "incorrect"}
                  onChange={() =>
                    onQuestionChange(question.id, "correctAnswer", "incorrect")
                  }
                  className="form-radio"
                />{" "}
                <span className="ml-2">Incorrect</span>
              </label>
            </div>
          </div>
        )}

        {question.type === questionTypes.MULTIPLE_CHOICE && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of Choices
              </label>
              <select
                value={question.options.length}
                onChange={(e) =>
                  onSetOptionCount(question.id, parseInt(e.target.value))
                }
                className={inputClass + " w-24"}
              >
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            {question.options.map((opt, optIndex) => (
              <div
                key={optIndex}
                className="flex items-center gap-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600"
              >
                <input
                  type="radio"
                  name={`mcq-correct-${question.id}`}
                  checked={question.correctOptionIndex === optIndex}
                  onChange={() =>
                    onQuestionChange(
                      question.id,
                      "correctOptionIndex",
                      optIndex
                    )
                  }
                  className="form-radio h-5 w-5"
                />
                <div className="flex-grow">
                  <label className="text-xs text-gray-500">
                    Option {optIndex + 1}
                  </label>
                  <input
                    type="text"
                    placeholder="English option"
                    value={opt.eng}
                    onChange={(e) =>
                      onOptionChange(
                        question.id,
                        optIndex,
                        "eng",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Khmer option"
                    value={opt.khmer}
                    onChange={(e) =>
                      onOptionChange(
                        question.id,
                        optIndex,
                        "khmer",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {question.type === questionTypes.PICTURE && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onImageUpload(question.id, e.target.files[0])}
                className="mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"
              />
            </div>
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt="Quiz preview"
                className="mt-2 rounded-md max-h-48"
              />
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Answer (Max Chars: {question.maxLength})
              </label>
              <input
                type="text"
                value={question.answer}
                onChange={(e) =>
                  onQuestionChange(question.id, "answer", e.target.value)
                }
                className={inputClass}
              />
              <input
                type="number"
                inputMode="numeric"
                value={question.maxLength}
                onChange={(e) =>
                  onQuestionChange(
                    question.id,
                    "maxLength",
                    parseInt(e.target.value)
                  )
                }
                className={inputClass + " w-32 mt-2"}
                placeholder="Max Length"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateExam;
