import { userSchema } from "./userSchema";
import { chatSchema } from "./chatSchema";
import { messageSchema } from "./messageSchema";
import { postSchema } from "./postSchema";
import { notificationSchema } from "./notificationSchema";
import { commentSchema } from "./commentSchema";

// Combine all schemas
export const schemas = {
  ...userSchema,
  ...chatSchema,
  ...messageSchema,
  ...postSchema,
  ...notificationSchema,
  ...commentSchema,
};
