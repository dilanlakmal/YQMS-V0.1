import "./chatPage.css";
import { useEffect, useRef } from "react";
import NewPrompt from "../../components/newPrompt/NewPrompt";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Markdown from "react-markdown";
import { IKImage } from "imagekitio-react";
import { authJsonFetch } from "../../lib/api";

const ChatPage = () => {

  const { id: chatId } = useParams();
  const wrapperRef = useRef(null);
  const endRef = useRef(null);

  const { isPending, error, data } = useQuery({
    queryKey: ['chat', chatId],
    enabled: !!chatId,
    queryFn: async () => {
        return authJsonFetch(`/api/chats/${chatId}`, { method: "GET" });
    },
  });

  // Scroll to bottom when messages load or update
  useEffect(() => {
    if (endRef.current && data?.history) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 200);
    }
  }, [data?.history]);

  // Ensure initial scroll position is correct
  useEffect(() => {
    if (wrapperRef.current && data?.history) {
      setTimeout(() => {
        wrapperRef.current.scrollTop = wrapperRef.current.scrollHeight;
      }, 300);
    }
  }, [data]);

  return (
    <div className='chatPage'>
      <div className='wrapper' ref={wrapperRef}>
        <div className='chat'>
          {isPending ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              color: '#8e8e93',
              fontSize: '16px'
            }}>
              <div style={{ marginBottom: '12px' }}>Loading conversation...</div>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              color: '#ef4444',
              fontSize: '16px'
            }}>
              Error fetching messages. Please try again.
            </div>
          ) : (
            <>
              {data?.history?.length > 0 ? (
                data.history.map((message, i) => (
                  <div key={i} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                    {message.img && (
                      <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
                        <IKImage
                          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                          path={message.img}
                          height="300"
                          width="400"
                          transformation={[{ height: 300, width: 400 }]}
                          loading='lazy'
                          lqip={{ active: true, quality: 20 }}
                        />
                      </div>
                    )}
                    <div className={message.role === "user" ? "message user" : "message"}>
                      <Markdown>
                        {message.parts[0].text}
                      </Markdown>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 40px', 
                  color: '#8e8e93',
                  fontSize: '16px'
                }}>
                  No messages yet. Start the conversation!
                </div>
              )}
              {data && <NewPrompt data={data} />}
              <div ref={endRef} style={{ height: '1px', width: '100%' }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPage