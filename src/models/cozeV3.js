// CozeV3模型的格式化函数
export const formatPayload = (messages, options = {}) => {
  return {
    "modelId": "cozeV3",
    "bot_id": import.meta.env.VITE_COZE_BOT_ID,
    "user_id": import.meta.env.VITE_COZE_USER_ID,
    "stream": false,
    query: '你好',
    chat_history: [], 
    custom_variables: { prompt: messages }
  };
};

export const formatResponse = (data) => {
  return {
    context: data.msg
  };
};