import React, { useEffect, useState } from "react";
import { ChatState } from "../../context/ChatProvider";
import SingleChat from "./SingleChat";
import GroupChat from "./GroupChat";
import "../../styles/chatbox.css";

const ChatBox = ({
  fetchAgain,
  setFetchAgain,
  toggleSideDrawer,
  isMobileView,
}) => {
  const { selectedChat } = ChatState();
  const [showSideDrawer, setShowSideDrawer] = useState(true);

  useEffect(() => {
    if (window.innerWidth <= 768 && selectedChat) {
      setShowSideDrawer(false);
    }
  }, [selectedChat]);


  return (
    <div className="chatbox-container">
      {!selectedChat ? (
        <div className="no-chat-selected">
          <p>Select a user or group to start messaging</p>
        </div>
      ) : (
        <>
          {selectedChat.isGroupChat ? (
            <GroupChat
              fetchAgain={fetchAgain}
              setFetchAgain={setFetchAgain}
              toggleSideDrawer={toggleSideDrawer}
              isMobileView={isMobileView}
            />
          ) : (
            <SingleChat
              fetchAgain={fetchAgain}
              setFetchAgain={setFetchAgain}
              toggleSideDrawer={toggleSideDrawer}
              isMobileView={isMobileView}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ChatBox;
