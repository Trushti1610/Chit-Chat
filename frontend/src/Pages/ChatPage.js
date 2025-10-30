import React, { useEffect, useState } from "react";
import { ChatState } from "../context/ChatProvider";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import ChatBox from "../components/Chat/ChatBox";

const ChatPage = () => {
  const { user, selectedChat } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 991);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 991);
    };

    window.addEventListener("resize", handleResize);

    if (window.innerWidth <= 991 && selectedChat) {
      setShowSideDrawer(false);
    }
    if (window.innerWidth > 991 && user) {
      setShowSideDrawer(true);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedChat, user]);

  const toggleSideDrawer = () => {
    setShowSideDrawer(!showSideDrawer);
  };

  return (
    <div
      className={`chat-container${
        isMobileView && selectedChat ? "chat-selected" : ""
      }`}
    >
      {user && (
        <SideDrawer
          fetchAgain={fetchAgain}
          setFetchAgain={setFetchAgain}
          show={showSideDrawer}
          isMobileView={isMobileView}
          onCloseDrawer={() => setShowSideDrawer(false)}
        />
      )}
      {user && (
        <ChatBox
          fetchAgain={fetchAgain}
          setFetchAgain={setFetchAgain}
          toggleSideDrawer={toggleSideDrawer}
          isMobileView={isMobileView}
        />
      )}
    </div>
  );
};

export default ChatPage;
