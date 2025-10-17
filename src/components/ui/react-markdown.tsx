import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface ReactMarkdownProps {
  children: string;
  className?: string;
}

export const ReactMarkdownComponent: React.FC<ReactMarkdownProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-200">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal text-gray-600 dark:text-gray-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300 my-4">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {children}
              </code>
            );
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700 dark:text-gray-200">
              {children}
            </em>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
