import React from 'react';
import { ChatScreen } from '../screens/chat/ChatScreen';

/** Chat tab content — inbox only; thread opens on root stack (no tab bar). */
export const ChatNavigator: React.FC = () => <ChatScreen />;
