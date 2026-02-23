import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle
} from 'react-native';
import { MotiView } from 'moti';
import { LucideIcon } from 'lucide-react-native';
import { cn } from '../../lib/utils';
import { cssInterop } from 'nativewind';

cssInterop(MotiView, {
  className: {
    target: 'style',
  },
});

export type PulseType = 'none' | 'subtle' | 'intense' | 'emergency';

const PULSE_CONFIGS = {
  subtle: { scale: 1.1, opacity: 0.2, duration: 2000 },
  intense: { scale: 1.5, opacity: 0, duration: 1000 },
  emergency: { scale: 2.2, opacity: 0, duration: 800 },
};

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'viva' | 'emergency' | 'warning' | 'info' | 'outline' | 'ghost' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  pulse?: PulseType;
  dot?: boolean;
  className?: string;
  style?: ViewStyle;
}

const variantStyles = {
  default: { bg: '#27272a', text: '#fafafa', border: '#3f3f46' },
  viva: { bg: 'rgba(113, 210, 77, 0.15)', text: '#71d24d', border: '#71d24d' },
  emergency: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' },
  info: { bg: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9', border: '#0ea5e9' },
  outline: { bg: 'transparent', text: '#fafafa', border: '#27272a' },
  ghost: { bg: 'transparent', text: '#71717a', border: 'transparent' },
  glass: { bg: 'rgba(255, 255, 255, 0.1)', text: '#fff', border: 'rgba(255, 255, 255, 0.2)' },
};

const sizeStyles = {
  xs: { h: 20, px: 6, font: 9, icon: 10 },
  sm: { h: 24, px: 8, font: 10, icon: 12 },
  md: { h: 28, px: 12, font: 11, icon: 14 },
  lg: { h: 36, px: 16, font: 13, icon: 18 },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'sm',
  icon: Icon,
  pulse = 'none',
  dot = false,
  className,
  style,
}) => {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <View style={[styles.outerWrapper, style]} className={cn(className)}>
      {pulse !== 'none' && (
        <MotiView
          from={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: PULSE_CONFIGS[pulse].scale, opacity: 0 }}
          transition={{ loop: true, type: 'timing', duration: PULSE_CONFIGS[pulse].duration }}
          style={[styles.pulseLayer, { backgroundColor: vStyle.text, height: sStyle.h, borderRadius: sStyle.h / 2 }]}
        />
      )}
      
      <View 
        style={[
          styles.badgeBase,
          { 
            backgroundColor: vStyle.bg, 
            borderColor: vStyle.border, 
            height: sStyle.h,
            paddingHorizontal: sStyle.px,
            borderRadius: sStyle.h / 2
          }
        ]}
      >
        {dot && <View style={[styles.dot, { backgroundColor: vStyle.text }]} />}
        {Icon && <Icon size={sStyle.icon} color={vStyle.text} style={styles.icon} />}
        <Text style={[styles.text, { color: vStyle.text, fontSize: sStyle.font }]}>
          {label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: { alignItems: 'center', justifyContent: 'center' },
  pulseLayer: { position: 'absolute', width: '100%' },
  badgeBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 5 },
  icon: { marginRight: 4 },
  text: { fontWeight: '900', letterSpacing: 0.5 },
});
