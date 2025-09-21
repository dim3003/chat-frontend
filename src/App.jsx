import React, { useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import "./App.css";

function App() {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5010/chathub") 
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(async () => {
          console.log("Connected to SignalR!")
          const existingMessages = await connection.invoke("GetAllMessages");
          setMessages(existingMessages);
        })
        .catch(err => console.error("SignalR Connection Error: ", err));

      connection.on("ReceiveMessage", (user, text, timestamp) => {
        setMessages(prev => [...prev, { user, text, timestamp }]);
      });

      connection.on("ClearMessages", () => {
        setMessages([]);
      });
    }
  }, [connection]);

  const sendMessage = async () => {
    if (connection && user && message) {
      try {
        await connection.invoke("SendMessage", user, message);
        setMessage(""); 
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message">
            <strong>{msg.user}</strong>: {msg.text} <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="chat-inputs">
        <input
          type="text"
          placeholder="Name"
          value={user}
          onChange={e => setUser(e.target.value)}
        />
        <input
          type="text"
          placeholder="Type your message... (type /clear to clear the chat)"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;

