import React from 'react';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import SimpleStack from './SimpleStack';

const screens = [
  { name: 'Login', component: LoginScreen },
  { name: 'Signup', component: SignupScreen },
];

export default function AuthStack() {
  return <SimpleStack screens={screens} initialScreen="Login" />;
}
