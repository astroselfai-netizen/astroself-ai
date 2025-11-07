import React from 'react';
import { useRoute } from '@react-navigation/native';
import ChatWithPrompts from '../../components/ChatWithPrompts';

const ChatWithPromptsScreen = () => {
  const route = useRoute();
  const { userId, cardTitles, tab, planet, current_plan } = route.params as { 
    userId: string; 
    cardTitles?: string; 
    tab?: string; 
    planet?: string; 
    current_plan?: string;
  };

  console.log('userId---->', userId);
  console.log('cardTitles---->', cardTitles);

  return <ChatWithPrompts userId={userId} planet={planet} cardTitles={cardTitles} tab={tab} current_plan={current_plan} />;
};

export default ChatWithPromptsScreen;
