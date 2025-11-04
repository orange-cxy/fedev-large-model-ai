// Deepseek模型的格式化函数
export const formatPayload = (messages, options = {}) => {
  return {
    "model": "deepseek-chat",
    "modelId": "deepseek",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": messages}
    ],
    "stream": options.stream || false,
  };
};

export const formatResponse = (data) => {
  return {
    context: data.choices[0].message.content
  };
};