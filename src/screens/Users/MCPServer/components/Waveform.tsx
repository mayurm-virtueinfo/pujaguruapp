import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../../../../theme/theme';

const Waveform = () => {
  const bars = new Array(5)
    .fill(0)
    .map(() => useRef(new Animated.Value(10)).current);

  useEffect(() => {
    const animations = bars.map(bar => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: Math.random() * 20 + 10,
            duration: 200 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 10,
            duration: 200 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ]),
      );
    });
    Animated.parallel(animations).start();
    return () => animations.forEach(anim => anim.stop());
  }, []);

  return (
    <View style={styles.waveformContainer}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={[styles.waveBar, { height: bar }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    width: 50,
    justifyContent: 'space-between',
  },
  waveBar: {
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});

export default Waveform;
