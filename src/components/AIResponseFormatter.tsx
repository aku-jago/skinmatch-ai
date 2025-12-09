import React from 'react';
import { cn } from '@/lib/utils';

interface AIResponseFormatterProps {
  content: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export const AIResponseFormatter: React.FC<AIResponseFormatterProps> = ({ 
  content, 
  className,
  variant = 'default'
}) => {
  if (!content) return null;

  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: 'bullet' | 'number' | null = null;

    const flushList = () => {
      if (currentList.length > 0 && listType) {
        if (listType === 'number') {
          elements.push(
            <ol key={`ol-${elements.length}`} className="space-y-1 my-2">
              {currentList.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary font-medium min-w-[18px]">{i + 1}.</span>
                  <span>{formatInlineText(item)}</span>
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="space-y-1 my-2">
              {currentList.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span>{formatInlineText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // Empty line
      if (trimmed === '') {
        flushList();
        elements.push(<div key={`space-${idx}`} className="h-2" />);
        return;
      }

      // Headers (## or **Header**)
      if (trimmed.startsWith('##') || trimmed.startsWith('# ')) {
        flushList();
        const headerText = trimmed.replace(/^#+\s*/, '');
        elements.push(
          <h4 key={`h-${idx}`} className="font-semibold text-foreground mt-3 mb-1.5 text-sm">
            {headerText}
          </h4>
        );
        return;
      }

      // Bold section headers (**text**)
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        flushList();
        const boldText = trimmed.slice(2, -2);
        elements.push(
          <p key={`b-${idx}`} className="font-medium text-foreground mt-2 mb-1 text-sm">
            {boldText}
          </p>
        );
        return;
      }

      // Numbered list
      const numMatch = trimmed.match(/^(\d+)[.)]\s*(.+)/);
      if (numMatch) {
        if (listType !== 'number') {
          flushList();
          listType = 'number';
        }
        currentList.push(numMatch[2]);
        return;
      }

      // Bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        if (listType !== 'bullet') {
          flushList();
          listType = 'bullet';
        }
        const bulletContent = trimmed.replace(/^[•\-\*]\s*/, '');
        currentList.push(bulletContent);
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${idx}`} className="text-sm text-foreground/90 leading-relaxed">
          {formatInlineText(trimmed)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Handle bold text **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-medium text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={cn(
      "space-y-1",
      variant === 'compact' && "text-[11px]",
      className
    )}>
      {parseContent(content)}
    </div>
  );
};

export default AIResponseFormatter;
