'use client';

import { useMemo } from 'react';

export interface ChatMessage {
  id: string;
  characterId: string;
  characterName: string;
  characterColor: string;
  message: string;
  timestamp: number;
  isUser?: boolean;
}

interface ChatMessageProps {
  messages: ChatMessage[];
  currentUserId?: string;
}

// 为每个角色生成唯一的颜色
const CHARACTER_COLORS: Record<string, string> = {
  user: '#8b5cf6', // 紫色 - 用户
  char1: '#ef4444', // 红色
  char2: '#f59e0b', // 橙色
  char3: '#eab308', // 黄色
  char4: '#22c55e', // 绿色
  char5: '#06b6d4', // 青色
  char6: '#3b82f6', // 蓝色
  char7: '#8b5cf6', // 紫色
  char8: '#ec4899', // 粉色
};

// 获取角色颜色
export function getCharacterColor(characterId: string): string {
  return CHARACTER_COLORS[characterId] || '#6b7280';
}

// 格式化时间戳（精确到秒）
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// 判断是否为今天
function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// 格式化完整时间
function formatFullTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const time = formatTimestamp(timestamp);
  return isToday(timestamp) ? time : `${month}-${day} ${time}`;
}

export default function ChatMessageList({ messages, currentUserId }: ChatMessageProps) {
  // 按时间分组消息
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: ChatMessage[] } = {};
    messages.forEach(msg => {
      const key = msg.characterId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(msg);
    });
    return groups;
  }, [messages]);

  // 按最新消息排序角色
  const sortedCharacterIds = useMemo(() => {
    const lastMessageTimes: { [key: string]: number } = {};
    messages.forEach(msg => {
      if (!lastMessageTimes[msg.characterId] || msg.timestamp > lastMessageTimes[msg.characterId]) {
        lastMessageTimes[msg.characterId] = msg.timestamp;
      }
    });
    return Object.entries(lastMessageTimes)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-3xl mb-2">💬</div>
          <p className="text-sm">开始对话吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCharacterIds.map(characterId => {
            const characterMessages = groupedMessages[characterId] || [];
            if (characterMessages.length === 0) return null;

            const firstMessage = characterMessages[0];
            const color = getCharacterColor(characterId);
            const isUser = firstMessage.isUser;

            return (
              <div
                key={characterId}
                className={`rounded-lg overflow-hidden ${isUser ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-200'}`}
              >
                {/* 角色头 */}
                <div
                  className="px-3 py-2 flex items-center gap-2 border-b"
                  style={{
                    borderColor: isUser ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    backgroundColor: isUser ? 'rgba(139, 92, 246, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-sm text-gray-800">
                    {firstMessage.characterName}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {characterMessages.length} 条消息
                  </span>
                </div>

                {/* 消息列表 */}
                <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                  {characterMessages.map((msg, index) => (
                    <div
                      key={msg.id}
                      className="flex gap-2 items-start"
                    >
                      <span
                        className="text-xs text-gray-400 whitespace-nowrap mt-0.5"
                        style={{ minWidth: '55px' }}
                      >
                        {formatFullTimestamp(msg.timestamp)}
                      </span>
                      <span className="text-sm text-gray-700 flex-1 break-words">
                        {msg.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
