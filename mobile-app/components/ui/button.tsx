import React, { useMemo, useCallback } from 'react';
import { 
  Pressable, 
  Text, 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  Platform
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { LucideIcon } from 'lucide-react-native';
import { cn } from '../../lib/utils';
import { cssInterop } from 'nativewind';

cssInterop(MotiView, {
  className: {
    target: 'style',
  },
});

export interface ButtonProps {
  label: string;
  subLabel?: string;
  variant?: 'default' | 'viva' | 'emergency' | 'warning' | 'info' | 'outline' | 'ghost' | 'glass' | 'tactical' | 'secondary';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  onPress?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  className?: string;
  textClassName?: string;
  hapticIntensity?: 'light' | 'medium' | 'heavy' | 'selection';
  glow?: boolean;
  pulse?: boolean;
  style?: ViewStyle;
}

const variantStyles = {
  default: { bg: '#27272a', text: '#fafafa', border: '#3f3f46' },
  viva: { bg: '#71d24d', text: '#000', border: '#71d24d' },
  emergency: { bg: '#ef4444', text: '#fff', border: '#ef4444' },
  warning: { bg: '#f59e0b', text: '#000', border: '#f59e0b' },
  info: { bg: '#0ea5e9', text: '#fff', border: '#0ea5e9' },
  outline: { bg: 'transparent', text: '#fafafa', border: '#27272a' },
  ghost: { bg: 'transparent', text: '#fafafa', border: 'transparent' },
  glass: { bg: 'rgba(255, 255, 255, 0.1)', text: '#fff', border: 'rgba(255, 255, 255, 0.2)' },
  tactical: { bg: '#18181b', text: '#71d24d', border: '#27272a' },
  secondary: { bg: '#3f3f46', text: '#fafafa', border: '#52525b' },
};

const sizeStyles = {
  xs: { h: 32, px: 12, font: 10, icon: 12, gap: 4 },
  sm: { h: 40, px: 16, font: 12, icon: 14, gap: 6 },
  md: { h: 52, px: 20, font: 14, icon: 16, gap: 8 },
  lg: { h: 64, px: 24, font: 16, icon: 18, gap: 10 },
  xl: { h: 80, px: 32, font: 18, icon: 22, gap: 12 },
  icon: { h: 52, px: 0, font: 0, icon: 24, gap: 0 },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  subLabel,
  variant = 'default',
  size = 'md',
  onPress,
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  textClassName,
  hapticIntensity = 'light',
  glow = false,
  pulse = false,
  style,
}) => {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  const handlePress = useCallback(() => {
    if (disabled || isLoading) return;
    
    switch (hapticIntensity) {
      case 'heavy': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
      case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'selection': Haptics.selectionAsync(); break;
      default: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    }

    onPress?.();
  }, [disabled, isLoading, onPress, hapticIntensity]);

  return (
    <MotiView style={[styles.outerWrapper, style]} className={cn(className)}>
      {pulse && (
        <MotiView
          from={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ loop: true, duration: 1500, type: 'timing' }}
          style={[styles.pulseLayer, { backgroundColor: vStyle.bg, height: sStyle.h, borderRadius: sStyle.h / 2 }]}
        />
      )}
      
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.buttonBase,
          {
            backgroundColor: vStyle.bg,
            borderColor: vStyle.border,
            height: sStyle.h,
            paddingHorizontal: sStyle.px,
            borderRadius: sStyle.h / 2,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          },
          glow && {
            shadowColor: vStyle.bg,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 15,
            elevation: 10
          }
        ]}
      >
        <AnimatePresence>
          {isLoading ? (
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ActivityIndicator color={vStyle.text} size="small" />
            </MotiView>
          ) : (
            <View style={[styles.contentWrapper, { gap: sStyle.gap }]}>
              {LeftIcon && <LeftIcon size={sStyle.icon} color={vStyle.text} strokeWidth={2.2} />}
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: vStyle.text, fontSize: sStyle.font }]} className={cn(textClassName)}>
                  {label.toUpperCase()}
                </Text>
                {subLabel && <Text style={[styles.subLabel, { color: vStyle.text, opacity: 0.6 }]}>{subLabel.toUpperCase()}</Text>}
              </View>
              {RightIcon && <RightIcon size={sStyle.icon} color={vStyle.text} strokeWidth={2.2} />}
            </View>
          )}
        </AnimatePresence>
      </Pressable>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  outerWrapper: { alignItems: 'center', justifyContent: 'center' },
  pulseLayer: { position: 'absolute', width: '100%', zIndex: -1 },
  buttonBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, width: '100%' },
  contentWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  textContainer: { alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '900', letterSpacing: 0.8 },
  subLabel: { fontSize: 8, fontWeight: '700', marginTop: -2, letterSpacing: 0.5 },
});
