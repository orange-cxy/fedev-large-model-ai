// CozeV2模型的格式化函数
export const formatPayload = (messages, options = {}) => {
  return {
    "modelId": "cozeV2",
    "bot_id": import.meta.env.VITE_COZE_BOT_ID,
    "user": import.meta.env.VITE_COZE_USER_ID,
    query: messages,
    chat_history: [],
    "stream": options.stream || false,
    custom_variables: { prompt: messages }
  };
};

export const formatResponse = (data) => {
  return {
    context: data.messages[0].content
  };
};