// components/SearchBar.tsx
import { SearchIcon, InternetIcon } from "../Icons";
import styles from "./style.module.scss";

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  useInternet: boolean;
  setUseInternet: (useInternet: boolean) => void;
  handleSearch: () => void;
  loading: boolean;
}

const SearchBar = ({
  query,
  setQuery,
  useInternet,
  setUseInternet,
  handleSearch,
  loading,
}: SearchBarProps) => (
  <div className={styles.search_container}>
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className={styles.search_input}
      placeholder="Enter your question..."
      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
    />
    <div className={styles.search_controls}>
      <div className={styles.internet_toggle}>
        <div className={styles.toggle_container}>
          <input
            type="checkbox"
            id="useInternet"
            checked={useInternet}
            onChange={(e) => setUseInternet(e.target.checked)}
          />
          <div className={styles.icon_container}>
            <InternetIcon />
          </div>
          <div className={styles.tag}>
            <span>联网搜索</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleSearch}
        disabled={loading}
        className={styles.search_button}
      >
        <SearchIcon />
      </button>
    </div>
  </div>
);

export default SearchBar;
