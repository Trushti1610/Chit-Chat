const mongoose = require("mongoose");

const deletedMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can only delete a message once
deletedMessageSchema.index({ messageId: 1, userId: 1 }, { unique: true });

const DeletedMessage = mongoose.model("DeletedMessage", deletedMessageSchema);

module.exports = DeletedMessage;
