import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

const MS_PER_TICK = 14;
const CATCHUP_THRESHOLD = 60;
const CATCHUP_BATCH = 4;
const MID_BATCH = 2;

const getRevealBatch = (remaining: number) => {
  if (remaining > CATCHUP_THRESHOLD) {
    return CATCHUP_BATCH;
  }
  if (remaining > 24) {
    return MID_BATCH;
  }
  return 1;
};

type TypewriterTextProps = Omit<TextProps, 'children'> & {
  text: string;
  active?: boolean;
  style?: TextStyle | TextStyle[];
  onProgress?: () => void;
  onComplete?: () => void;
  formatText?: (text: string) => string;
  renderContent?: (visibleText: string) => React.ReactNode;
};

const TypewriterText = ({
  text,
  active = true,
  style,
  onProgress,
  onComplete,
  formatText,
  renderContent,
  ...textProps
}: TypewriterTextProps) => {
  const chars = useMemo(() => Array.from(text), [text]);
  const [revealedCount, setRevealedCount] = useState(active ? 0 : chars.length);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onProgressRef.current = onProgress;
  }, [onComplete, onProgress]);

  useEffect(() => {
    completedRef.current = false;
    if (!active) {
      setRevealedCount(chars.length);
      return;
    }
    setRevealedCount(prev => Math.min(prev, chars.length));
  }, [active, chars.length]);

  useEffect(() => {
    if (chars.length > 0 && revealedCount < chars.length) {
      completedRef.current = false;
    }
  }, [chars.length, revealedCount]);

  useEffect(() => {
    if (!active) {
      return;
    }

    if (revealedCount >= chars.length) {
      if (chars.length > 0 && !completedRef.current && onCompleteRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    const remaining = chars.length - revealedCount;
    const batch = getRevealBatch(remaining);

    const timer = setTimeout(() => {
      setRevealedCount(prev => Math.min(prev + batch, chars.length));
      onProgressRef.current?.();
    }, MS_PER_TICK);

    return () => clearTimeout(timer);
  }, [active, revealedCount, chars.length]);

  const visibleText = active ? chars.slice(0, revealedCount).join('') : text;
  const displayText = formatText ? formatText(visibleText) : visibleText;

  if (renderContent) {
    return <>{renderContent(displayText)}</>;
  }

  return (
    <Text style={style} {...textProps}>
      {displayText}
    </Text>
  );
};

export default TypewriterText;
