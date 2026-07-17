import React, { useMemo } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { fontFamily } from '../constant/theme';

type TextSegment = {
  text: string;
  bold: boolean;
};

/** Split text on `**bold**` markers into plain / bold segments. */
export function parseBoldSegments(text: string): TextSegment[] {
  if (!text) {
    return [];
  }

  const segments: TextSegment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  return segments.length ? segments : [{ text, bold: false }];
}

type FormattedMarkdownTextProps = {
  text: string;
  color: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
};

const FormattedMarkdownText: React.FC<FormattedMarkdownTextProps> = ({
  text,
  color,
  style,
  boldStyle,
}) => {
  const lines = useMemo(() => text.split('\n'), [text]);

  const baseStyle = useMemo(
    () => [{ color }, style],
    [color, style],
  );

  const emphasisStyle = useMemo(
    () => [{ fontFamily: fontFamily.bold, color }, boldStyle],
    [boldStyle, color],
  );

  if (!text.trim()) {
    return null;
  }

  return (
    <Text style={baseStyle}>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {parseBoldSegments(line).map((segment, index) =>
            segment.bold ? (
              <Text key={index} style={emphasisStyle}>
                {segment.text}
              </Text>
            ) : (
              segment.text
            ),
          )}
          {lineIndex < lines.length - 1 ? '\n' : null}
        </React.Fragment>
      ))}
    </Text>
  );
};

export default FormattedMarkdownText;
