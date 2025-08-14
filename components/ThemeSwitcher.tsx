"use client";
import { useTheme } from "../context/ThemeContext";

const ThemeSwitcher = () => {
  const { theme, themes, changeTheme } = useTheme();

  return (
    <div className="theme-control-panel">
      <p>Theme</p>
      <div className="theme-buttons">
        {themes.map(({ id, name, colors }) => (
          <button
            key={id}
            onClick={() => changeTheme(id)}
            className={`theme-button ${theme === id ? "active" : ""}`}
            data-theme={id}
            aria-label={`Switch to ${name} theme`}
            style={{
              background: colors.selectColorBtn,
            }}
          >
            {theme === id && ( // Only show check icon for active theme
              <span className="theme-icon">
                <i className="fa-solid fa-check"></i>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
