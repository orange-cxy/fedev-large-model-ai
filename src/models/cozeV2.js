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

// 添加流式响应解析函数
export const parseStreamChunk = (chunk) => {
  try {
    console.log('CozeV2 parsing chunk:', typeof chunk, chunk);
    
    // 如果chunk已经是解析好的对象，直接使用
    if (typeof chunk === 'object' && chunk !== null) {
      // 检查是否是嵌套结构
      if (chunk.event === 'message' && chunk.message && chunk.message.role === 'assistant') {
        return chunk.message.content || '';
      }
      // 检查message对象是否直接在顶层
      if (chunk.message && chunk.message.role === 'assistant') {
        return chunk.message.content || '';
      }
      return '';
    }
    
    // 如果chunk是字符串，尝试多种解析方式
    if (typeof chunk === 'string') {
      // 提取JSON部分（去掉可能的'data:'前缀）
      let jsonStr = chunk;
      if (chunk.startsWith('data:')) {
        jsonStr = chunk.substring(5).trim();
      }
      
      // 尝试解析JSON字符串
      const parsed = JSON.parse(jsonStr);
      
      // 检查多种可能的数据结构
      if (parsed.event === 'message' && parsed.message && parsed.message.role === 'assistant') {
        return parsed.message.content || '';
      }
      if (parsed.message && parsed.message.role === 'assistant') {
        return parsed.message.content || '';
      }
    }
    
    return '';
  } catch (error) {
    console.error('解析CozeV2流式响应失败:', error, 'Chunk:', chunk);
    return '';
  }
};