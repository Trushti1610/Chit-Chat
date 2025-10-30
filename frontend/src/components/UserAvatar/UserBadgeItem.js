import React from "react";

const UserBadgeItem = ({ user, handleFunction }) => {
  return (
    <div className="user-badge">
      <span className="badge-name">{user.username}</span>
      <i
        className="bi bi-x-circle-fill badge-close-icon"
        onClick={handleFunction}
      ></i>
    </div>
  );
};

export default UserBadgeItem;
