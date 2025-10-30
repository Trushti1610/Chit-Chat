import React from "react";

const UserListItem = ({ user, handleFunction }) => {
  return (
    <div onClick={handleFunction} className="user-item">
      <div className="user-avatar">
        <img
          src={
            user.profilePicture ||
            "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
          }
          alt={user.name || user.username || "User Avatar"}
          className="avatar-img"
        />
      </div>
      <div className="user-details">
        <div className="user-name">{user.username}</div>
        {user.mobile && (
          <div className="user-last-seen">
            {user.mobile}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListItem;
