import "./newPrompt.css";
import { useRef, useEffect, useState } from "react";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import ai from "../../lib/gemini";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authJsonFetch } from "../../lib/api";

const NewPrompt = ({ data }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {}
  });

  const chatRef = useRef(null);
  const endRef = useRef(null);
  const formRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: "gemini-2.5-flash",
      history: []
    });
  }, []);

  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [question, answer, img.dbData]);

  const mutation = useMutation({
    mutationFn: async (messageData) =>
      authJsonFetch(`/api/chats/${data._id}`, {
        method: "PUT",
        body: JSON.stringify(messageData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", data._id] }).then(() => {
        formRef.current?.reset();
        setQuestion("");
        setAnswer("");
        setMutationError("");
        setImg({
          isLoading: false,
          error: "",
          dbData: {},
          aiData: {}
        });
      });
    },
    onError: (err) => {
      setMutationError(err.message || "Failed to save chat history.");
    }
  });

  const add = async (text, currentImg, isInitial = false) => {
    if (!isInitial) setQuestion(text);
    setAnswer("");

    try {
      if (!chatRef.current) {
        chatRef.current = ai.chats.create({
          model: "gemini-2.5-flash",
          history: []
        });
      }

      const contents = [text];
      if (currentImg?.aiData && Object.keys(currentImg.aiData).length > 0) {
        contents.push(currentImg.aiData);
      }

      let fullAnswer = "";
      const stream = await chatRef.current.sendMessageStream({
        message: contents
      });

      for await (const chunk of stream) {
        fullAnswer += chunk.text;
        setAnswer(fullAnswer);
      }

      if (!isInitial) {
        await mutation.mutateAsync({
          question: text,
          answer: fullAnswer,
          img: currentImg?.dbData?.filePath
        });
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setAnswer("Sorry, something went wrong. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = e.target.text.value.trim();
    if (!text && !img.aiData.inlineData) return;

    add(text, img);
    e.target.text.value = "";
  };

  const hasRun = useRef(false);
  useEffect(() => {
    if (!hasRun.current && data?.history?.length === 1) {
      const initialMessage = data.history[0].parts[0].text;
      hasRun.current = true;
      add(initialMessage, null, true);
    }
  }, [data]);

  return (
    <>
      {img.isLoading && <div>Uploading...</div>}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData?.filePath}
          width="250"
          transformation={{ width: 380 }}
        />
      )}

      {question && <div className="message user">{question}</div>}
      {answer && (
        <div className="message">
          {answer === "Thinking..." ? (
            <div className="typing-indicator"></div>
          ) : (
            <Markdown>{answer}</Markdown>
          )}
        </div>
      )}
      {mutationError && (
        <div className="message error">
          <span>{mutationError}</span>
        </div>
      )}
      <div className="endChat" ref={endRef} />
      <div className='newPrompt'>
        <form className='newForm' onSubmit={handleSubmit} ref={formRef}>
          <Upload setImg={setImg} />
          <input id="file" type="file" multiple={false} hidden />
          <input type="text" name='text' placeholder="Type your message here..." />
          <button type="submit">
            <img src="/arrow.png" alt="" />
          </button>
        </form>
      </div>
    </>
  );
};

export default NewPrompt;
