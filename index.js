/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import serviceFactory from './src/services/serviceFactory';
// removed recoil global state
import { store } from './src/state/store';
import messaging from '@react-native-firebase/messaging';

serviceFactory.create();

// Register background handler
// IMPORTANT: This MUST be registered at the top level (outside any component/function)
// This handles notifications when app is in background or quit state
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📱 Background message received:', remoteMessage);
  console.log('📱 Notification data:', remoteMessage.data);
  console.log('📱 Notification payload:', remoteMessage.notification);
  
  // You can perform background tasks here
  // For example, update local storage, sync data, etc.
  // Note: You cannot show UI or navigate here - that happens when user taps notification
  
  return Promise.resolve();
});

const RootComponent = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

AppRegistry.registerComponent(appName, () => RootComponent);
