export type ChatAttachment = {
  url: string;
  name: string;
  type: "image" | "file";
};

export type ChatMessage = {
  id: string;
  user: string;
  text: string;
  createdAt: string;
  attachments?: ChatAttachment[];
};


