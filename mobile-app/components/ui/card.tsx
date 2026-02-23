import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle
} from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../lib/utils';
import { cssInterop } from 'nativewind';

cssInterop(MotiView, {
  className: {
    target: 'style',
  },
});

export interface CardProps {
  children?: React.ReactNode;
  variant?: 'default' | 'viva' | 'emergency' | 'warning' | 'info' | 'ghost' | 'glass' | 'outline';
  className?: string;
  style?: ViewStyle;
  blurIntensity?: number;
  hoverEffect?: boolean;
}

const variantStyles = {
  default: { bg: '#18181b', border: '#27272a' },
  viva: { bg: 'rgba(113, 210, 77, 0.05)', border: '#71d24d' },
  emergency: { bg: 'rgba(239, 68, 68, 0.05)', border: '#ef4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.05)', border: '#f59e0b' },
  info: { bg: 'rgba(14, 165, 233, 0.1)', border: '#0ea5e9' },
  ghost: { bg: 'transparent', border: 'transparent' },
  glass: { bg: 'rgba(255, 255, 255, 0.03)', border: 'rgba(255, 255, 255, 0.1)' },
  outline: { bg: 'transparent', border: '#18181b' },
};

export const CardHeader = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: ViewStyle }) => (
  <View style={[styles.header, style]} className={cn("p-6 pb-2", className)}>
    {children}
  </View>
);

export const CardTitle = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: TextStyle }) => (
  <Text style={[styles.title, style]} className={cn("text-white font-black leading-none tracking-tight", className)}>
    {children}
  </Text>
);

export const CardDescription = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: TextStyle }) => (
  <Text style={[styles.description, style]} className={cn("text-zinc-500", className)}>
    {children}
  </Text>
);

export const CardContent = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: ViewStyle }) => (
  <View style={[styles.content, style]} className={cn("p-6 pt-0", className)}>
    {children}
  </View>
);

export const CardFooter = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: ViewStyle }) => (
  <View style={[styles.footer, style]} className={cn("flex-row items-center p-6 pt-0", className)}>
    {children}
  </View>
);

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  style,
  blurIntensity = 0,
  hoverEffect = false,
}) => {
  const vStyle = variantStyles[variant];

  return (
    <MotiView
      from={hoverEffect ? { scale: 1 } : undefined}
      animate={hoverEffect ? { scale: 1 } : undefined}
      className={cn("rounded-3xl overflow-hidden border", className)}
      style={[
        {
          backgroundColor: blurIntensity > 0 ? 'transparent' : vStyle.bg,
          borderColor: vStyle.border,
          borderWidth: variant === 'ghost' ? 0 : 1.5,
        },
        style
      ]}
    >
      {blurIntensity > 0 && (
        <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      
      {variant === 'glass' && (
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {children}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  header: { width: '100%' },
  title: { fontSize: 24 },
  description: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  content: { width: '100%' },
  footer: { width: '100%' },
});
