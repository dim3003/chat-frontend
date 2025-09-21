import React, { useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import "./App.css";

function App() {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");
  const [userColors, setUserColors] = useState({});

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5010/chathub") 
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    const newColors = {};
    messages.forEach(msg => {
      if (!userColors[msg.user] && msg.user !== user) {
        newColors[msg.user] = getRandomColor();
      }
    });
    if (Object.keys(newColors).length > 0) {
      setUserColors(prev => ({ ...prev, ...newColors }));
    }
  }, [messages, user]);

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
        {messages.map((msg, idx) => {
          const isMine = msg.user === user;
          const authorColor = isMine ? "#fff" : userColors[msg.user] || "#444";

          return (
            <div key={idx}>
              <strong style={{color: authorColor}}>{isMine ? "You said" : `${msg.user} says`}</strong>: {msg.text}{" "}
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
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

