"use client";

import { useCallback, useState } from "react";
import "./globals.css";
import ReactMarkdown from "react-markdown";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11 2C15.968 2 20 6.032 20 11C20 15.968 15.968 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2ZM11 18C14.867 18 18 14.867 18 11C18 7.132 14.867 4 11 4C7.132 4 4 7.132 4 11C4 14.867 7.132 18 11 18ZM19.485 18.071L22.314 20.899L20.899 22.314L18.071 19.485L19.485 18.071Z"
      fill="currentColor"
    />
  </svg>
);

const InternetIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM4 12C4 11.39 4.08 10.79 4.21 10.22L8 14V15C8 16.1 8.9 17 10 17V19.93C6.55 19.32 4 15.97 4 12ZM18.92 16.67C18.71 15.71 17.86 15 16.85 15H16V13C16 12.45 15.55 12 15 12H9V10H11C11.55 10 12 9.55 12 9V7H14C15.1 7 16 6.1 16 5V4.59C18.93 5.78 20.85 8.64 20.85 12C20.85 13.78 20.16 15.42 19.03 16.67H18.92Z" />
  </svg>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button className="copy-button" onClick={handleCopy} aria-label="Copy code">
      {copied ? (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="currentColor"
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
          />
        </svg>
      )}
    </button>
  );
};

const CodeBlock = ({ children }: { children: string }) => {
  return (
    <div className="code-block-wrapper">
      <CopyButton text={children} />
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useInternet, setUseInternet] = useState(false); // New state for internet toggle

  const components = {
    code: ({ children }: { children: any }) => {
      return <CodeBlock>{children as string}</CodeBlock>;
    },
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setAnswer("");
    setSearchResults([]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, useInternet }), // Add useInternet parameter
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === "searchResults") {
              setSearchResults(data.data);
            } else if (data.type === "token") {
              setAnswer((prev) => prev + data.data);
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1 className="title">Ollama Web Search</h1>

      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          placeholder="Enter your question..."
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <div className="search-controls">
          <div className="internet-toggle">
            <div className="toggle-container">
              <input
                type="checkbox"
                id="useInternet"
                checked={useInternet}
                onChange={(e) => setUseInternet(e.target.checked)}
              />
              <div className="icon-container">
                <InternetIcon />
              </div>
              <div className="tag">
                <span>联网搜索</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="search-button"
          >
            <SearchIcon />
          </button>
        </div>
      </div>

      {answer && (
        <div className="answer-container">
          <h2 className="section-title">Answer:</h2>
          <div className="answer-content">
            <ReactMarkdown components={components}>{answer}</ReactMarkdown>
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="results-container">
          <h2 className="section-title">Search Results:</h2>
          {searchResults.map((result: any, index: number) => (
            <div key={index} className="result-card">
              <h3 className="result-title">{result.title}</h3>
              <p className="result-snippet">{result.snippet}</p>
              <a
                href={result.link}
                className="result-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read more
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
