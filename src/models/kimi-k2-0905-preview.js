// kimi模型的格式化函数
export const formatPayload = (messages, options = {}) => {
  return {
    "messages": [
      {
        "role": "system",
        "content": messages
      }
    ],
    "temperature": 0.3,
    "max_tokens": 8192,
    "top_p": 1,
    "stream": false,
  };
};

export const formatResponse = (data) => {
  return {
    context: data.choices[0].message.content
  };
};