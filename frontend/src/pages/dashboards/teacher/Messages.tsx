import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

type MessageItem = {
  _id: string;
  from: { firstName: string; lastName: string; _id?: string };
  conversationType: string;
  conversationId: string;
  text?: string | null;
  attachments?: any[];
  createdAt: string;
};

const Messages: React.FC = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [conversationType, setConversationType] = useState('class');
  const [conversationId, setConversationId] = useState('');
  const [page, setPage] = useState(1);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;
    const socket = io(process.env.REACT_APP_SOCKET_URL || '/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });

    socket.on('message.new', (msg: MessageItem) => {
      // only add if it belongs to current conversation
      if (msg.conversationType === conversationType && msg.conversationId === conversationId) {
        setMessages(prev => [msg, ...prev]);
      }
    });

    socket.on('message.read', (payload: any) => {
      // could update message status UI
    });

    socket.on('auth_error', (m: string) => setError(m));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, conversationType, conversationId]);

  const fetchPage = async (p = 1) => {
    if (!token || !conversationType || !conversationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?conversationType=${encodeURIComponent(conversationType)}&conversationId=${encodeURIComponent(conversationId)}&page=${p}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load messages');
      setMessages(data.data.messages || []);
      setPage(p);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, [conversationType, conversationId, token]);

  const sendMessage = async () => {
    if (!token) return setError('Not authenticated');
    if (!conversationType || !conversationId) return setError('Select a conversation');

    const payload = { conversationType, conversationId, text };

    // try socket first
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message.send', { ...payload, token });
      setText('');
      return;
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send message');
      setMessages(prev => [data.data, ...prev]);
      setText('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const markRead = async () => {
    if (!token || !conversationType || !conversationId) return;
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationType, conversationId })
      });
    } catch (err) {
      // ignore
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Messages</h1>

      <div className="mt-4">
        <div className="flex gap-2">
          <select value={conversationType} onChange={e => setConversationType(e.target.value)} className="border p-2">
            <option value="class">Class</option>
            <option value="user">User</option>
            <option value="group">Group</option>
          </select>
          <input
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            placeholder="Conversation ID (classId or userId)"
            className="border p-2 flex-1"
          />
          <button onClick={() => fetchPage(1)} className="px-3 py-2 bg-gray-200 rounded">Load</button>
        </div>

        <div className="mt-2 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message here"
            className="w-full border rounded p-2"
          />
          <button onClick={sendMessage} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
        </div>
      </div>

      {loading && <p>Loading messages...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {messages.map(m => (
          <div key={m._id} className="p-3 border rounded">
            <div className="flex justify-between">
              <div>
                <strong>{m.from.firstName} {m.from.lastName}</strong>
                <span className="ml-2 text-sm text-gray-600">• {m.conversationType}:{m.conversationId}</span>
              </div>
              <div className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
            </div>
            <p className="mt-2">{m.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => fetchPage(page + 1)} className="px-3 py-1 border rounded">Next Page</button>
        <button onClick={() => { fetchPage(Math.max(1, page - 1)); }} className="px-3 py-1 border rounded">Prev Page</button>
        <button onClick={markRead} className="px-3 py-1 border rounded">Mark Read</button>
      </div>
    </div>
  );
};

export default Messages;
