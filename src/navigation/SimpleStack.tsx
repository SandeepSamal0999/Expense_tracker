import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

interface StackContextType {
  push: (name: string, params?: any) => void;
  goBack: () => void;
  params: any;
}

const StackContext = createContext<StackContextType>({
  push: () => {},
  goBack: () => {},
  params: undefined,
});

export function useStackNavigation() {
  return useContext(StackContext);
}

interface ScreenConfig {
  name: string;
  component: React.ComponentType<any>;
}

interface Props {
  screens: ScreenConfig[];
  initialScreen: string;
}

export default function SimpleStack({ screens, initialScreen }: Props) {
  const [stack, setStack] = useState<{ name: string; params?: any }[]>([
    { name: initialScreen },
  ]);

  const current = stack[stack.length - 1];
  const ScreenComponent = screens.find(s => s.name === current.name)?.component;

  const push = useCallback((name: string, params?: any) => {
    setStack(prev => [...prev, { name, params }]);
  }, []);

  const goBack = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const navigation = {
    navigate: push,
    push,
    goBack,
    params: current.params,
  };

  const route = { params: current.params };

  if (!ScreenComponent) return null;

  return (
    <StackContext.Provider value={{ push, goBack, params: current.params }}>
      <View style={styles.container}>
        <ScreenComponent navigation={navigation} route={route} />
      </View>
    </StackContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
