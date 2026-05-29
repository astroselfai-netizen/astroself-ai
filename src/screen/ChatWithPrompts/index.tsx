import React from 'react';
import { useRoute } from '@react-navigation/native';
import ChatWithPrompts from '../../components/ChatWithPrompts';

const ChatWithPromptsScreen = () => {
  const route = useRoute();
  const { userId, cardTitles, tab, planet, current_plan, subCards, onOpen } =
    route.params as {
      userId: string;
      cardTitles?: string;
      tab?: string;
      subCards?: Array<{ id: number; title: string }>;
      planet?: string;
      current_plan?: string;
      onOpen?: boolean;
    };

  console.log('userId---->', userId);
  console.log('cardTitles---->', cardTitles);

  return (
    <ChatWithPrompts
      subCards={subCards}
      userId={userId}
      planet={planet}
      cardTitles={cardTitles}
      tab={tab}
      current_plan={current_plan}
      onOpen={onOpen}
    />
  );
};

export default ChatWithPromptsScreen;
