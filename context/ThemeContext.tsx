"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import LoginJson from "../pages/login-settings.json";

interface ThemeColors {
  primaryColor: string;
  primaryHover: string;
  textPrimary: string;
  textSecondary: string;
  textInfo: string;
  textDanger: string;
  textWarning: string;
  textBlue: string;
  textYellow: string;
  backgroundColor: string;
  bgSidebar: string;
  backgroundColor2: string;
  navActiveBg: string;
  navActiveColor: string;
  bgHeader: string;
  headerColor: string;
  navText: string;
  textLight: string;
  bodyBg: string;
  cardBg: string;
  cardTitle: string;
  cardValue: string;
  cardContent: string;
  alertColor: string;
  searchBg: string;
  borderColor: string;
  textColor: string;
  inputBorder: string;
  textWhite: string;
  boxShadow: string;
  boxShadow2: string;
  gradientStart: string;
  gradientEnd: string;
  gradientWarning1: string;
  gradientInfo1: string;
  gradientYellow1: string;
  gradientBlue1: string;

  loginBackgroundColor: string;
  paginationActiveColor: string;
  paginationActiveBg: string;
  paginationActiveBorderColor: string;
  // linear gradinets
  cardStatsGradient: string;
  primaryGradient: string;
  secondaryGradient: string;
  sidebarGradient: string;
  headerGradient: string;
  selectColorBtn: string;
  cardCustomBg: string;
  cardCustomBg2: string;
  cardCustomBg3: string;

  defaultTextColor: string;
  defaultBorder: string;
  defaultBorder2: string;
  defaultBackground: string;
  formControlBg: string;

  iconBgColor: string;

  tableHead: string;
  tableHoverColor: string;
  chartColor: string;
  primaryRgb: string;
}

interface Theme {
  id: string;
  name: string;
  icon: string;
  colors: ThemeColors;
}

interface ThemeContextType {
  theme: string;
  intensity: number;
  currentTheme: Theme;
  themes: Theme[];
  changeTheme: (newTheme: string) => void;
  changeIntensity: (newIntensity: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeDefinitions: Theme[] = [
  {
    id: "theme1",
    name: "Nature",
    icon: "🌿",
    colors: {
      primaryColor: "#0C21C1",
      selectColorBtn: "#0C21C1",
      primaryHover: "#0C21C1",
      textPrimary: "#0C21C1",
      textSecondary: "#0ea5e8",
      textInfo: "#00b69b",
      textDanger: "#f93c65",
      textWarning: "#ff9066",
      textBlue: "#8280ff",
      textYellow: "#fec53d",
      backgroundColor: "#d1d1d9b3",
      bgSidebar: "#38487C",
      headerColor: "#000",
      backgroundColor2: "#F5F6FA",
      navActiveBg: "#F5F6FA",
      navActiveColor: "#0C21C1",
      bgHeader: "#38487C",
      navText: "#64748B",
      textLight: "#999999",
      bodyBg: "#F5F6FA",
      cardTitle: "#202224",
      cardValue: "#4A4B4D",
      cardContent: "#000",
      cardBg: "#d1d1d9b3",
      alertColor: "#000",
      searchBg: "#fff",
      borderColor: "#fff",
      textColor: "#000",
      inputBorder: "#dee7f1",
      textWhite: "#fff",
      iconBgColor: "#E6EAF5",
      boxShadow: "0 0 5px rgba(106, 133, 51, 0.5)",
      boxShadow2: "0 4px 8px rgba(0, 0, 0, 0.1)",
      gradientStart: "#d2e4af",
      gradientEnd: "rgba(210, 228, 175, 0)",
      gradientWarning1: "rgba(255, 144, 102, 0.3)",
      gradientInfo1: "rgba(0, 182, 155, 0.3)",
      gradientYellow1: "rgba(254, 197, 61, 0.3)",
      gradientBlue1: "rgba(130, 128, 255, 0.3)",

      loginBackgroundColor: "#fff",
      paginationActiveColor: "#fff",
      paginationActiveBg: "#38487c",
      paginationActiveBorderColor: "#38487c",

      cardCustomBg: "#fff",
      cardCustomBg2: "#fff",
      cardCustomBg3: "#fff",

      defaultBackground: "#f9fafb",
      defaultTextColor: "#212b37",
      defaultBorder: "#ecf3fb",
      defaultBorder2: "#b9b9b9",

      formControlBg: "#ffffff",

      tableHead: "#F1F4F9",
      tableHoverColor: "#F5F6FA",
      chartColor: "#0284c7",
      // linear gradients
      cardStatsGradient:
        "linear-gradient(to bottom, rgba(56, 72, 124, 0.6), rgba(153, 153, 153, 0.6))",
      primaryGradient: "linear-gradient(135deg, #38487C 0%, #567029 100%)",
      secondaryGradient:
        "linear-gradient(135deg, #d2e4af 0%, rgba(210, 228, 175, 0) 100%)",
      sidebarGradient: "#ffff",
      headerGradient: "#ffff",
      primaryRgb: "#0c21c1",
    },
  },
  {
    id: "theme2",
    name: "green",
    icon: "🌿",
    colors: {
      primaryColor: "#779341",
      selectColorBtn: "#779341",
      primaryHover: "#779341",
      textPrimary: "#779341",
      textSecondary: "#0043FF",
      textInfo: "#00b69b",
      textDanger: "#f93c65",
      textWarning: "#ff9066",
      textBlue: "#8280ff",
      textYellow: "#fec53d",
      backgroundColor: "#d1d1d9b3",
      bgSidebar: "#38487C",
      headerColor: "#000",
      backgroundColor2: "#e5e5e596",
      navActiveBg: "#e5e5e596",
      navActiveColor: "#779341",
      bgHeader: "#38487C",
      navText: "#000",
      textLight: "#999999",
      bodyBg: "#F5F6FA",
      cardTitle: "#202224",
      cardValue: "#4A4B4D",
      cardContent: "#000",
      cardBg: "#d1d1d9b3",
      alertColor: "#000",
      searchBg: "#fff",
      borderColor: "#fff",
      textColor: "#000",
      inputBorder: "#dee7f1",
      textWhite: "#fff",
      iconBgColor: "#E6EAF5",
      boxShadow: "0 0 5px rgba(106, 133, 51, 0.5)",
      boxShadow2: "0 4px 8px rgba(0, 0, 0, 0.1)",
      gradientStart: "#d2e4af",
      gradientEnd: "rgba(210, 228, 175, 0)",
      gradientWarning1: "rgba(255, 144, 102, 0.3)",
      gradientInfo1: "rgba(0, 182, 155, 0.3)",
      gradientYellow1: "rgba(254, 197, 61, 0.3)",
      gradientBlue1: "rgba(130, 128, 255, 0.3)",

      loginBackgroundColor: "#fff",
      paginationActiveColor: "#fff",
      paginationActiveBg: "#38487c",
      paginationActiveBorderColor: "#38487c",

      cardCustomBg: "#fff",
      cardCustomBg2: "#fff",
      cardCustomBg3: "#fff",

      defaultBackground: "#f9fafb",
      defaultTextColor: "#212b37",
      defaultBorder: "#ecf3fb",
      defaultBorder2: "#b9b9b9",

      formControlBg: "#ffffff",

      tableHead: "#F1F4F9",
      tableHoverColor: "#F5F6FA",
      chartColor: "#0284c7",
      // linear gradients
      cardStatsGradient:
        "linear-gradient(to bottom, rgba(56, 72, 124, 0.6), rgba(153, 153, 153, 0.6))",
      primaryGradient: "linear-gradient(135deg, #38487C 0%, #567029 100%)",
      secondaryGradient:
        "linear-gradient(135deg, #d2e4af 0%, rgba(210, 228, 175, 0) 100%)",
      sidebarGradient: "#ffff",
      headerGradient: "#ffff",
      primaryRgb: "#779341",
    },
  },
  {
    id: "theme3",
    name: "Purple",
    icon: "🌿",
    colors: {
      primaryColor: "#6A1B9A",
      selectColorBtn: "#6A1B9A",
      primaryHover: "#6A1B9A",
      textPrimary: "#6A1B9A",
      textSecondary: "#069855",
      textInfo: "#00b69b",
      textDanger: "#f93c65",
      textWarning: "#ff9066",
      textBlue: "#8280ff",
      textYellow: "#fec53d",
      backgroundColor: "#d1d1d9b3",
      bgSidebar: "#38487C",
      headerColor: "#000",
      backgroundColor2: "#e5e5e596",
      navActiveBg: "#e5e5e596",
      navActiveColor: "#6A1B9A",
      bgHeader: "#38487C",
      navText: "#000",
      textLight: "#999999",
      bodyBg: "#F8F5FA",
      cardTitle: "#202224",
      cardValue: "#4A4B4D",
      cardContent: "#000",
      cardBg: "#d1d1d9b3",
      alertColor: "#000",
      searchBg: "#fff",
      borderColor: "#fff",
      textColor: "#000",
      inputBorder: "#dee7f1",
      textWhite: "#fff",
      iconBgColor: "#E6EAF5",
      boxShadow: "0 0 5px rgba(106, 133, 51, 0.5)",
      boxShadow2: "0 4px 8px rgba(0, 0, 0, 0.1)",
      gradientStart: "#d2e4af",
      gradientEnd: "rgba(210, 228, 175, 0)",
      gradientWarning1: "rgba(255, 144, 102, 0.3)",
      gradientInfo1: "rgba(0, 182, 155, 0.3)",
      gradientYellow1: "rgba(254, 197, 61, 0.3)",
      gradientBlue1: "rgba(130, 128, 255, 0.3)",

      loginBackgroundColor: "#fff",
      paginationActiveColor: "#fff",
      paginationActiveBg: "#38487c",
      paginationActiveBorderColor: "#38487c",

      cardCustomBg: "#fff",
      cardCustomBg2: "#fff",
      cardCustomBg3: "#fff",

      defaultBackground: "#f9fafb",
      defaultTextColor: "#212b37",
      defaultBorder: "#ecf3fb",
      defaultBorder2: "#b9b9b9",

      formControlBg: "#ffffff",

      tableHead: "#F1F4F9",
      tableHoverColor: "#F5F6FA",
      chartColor: "#0284c7",
      // linear gradients
      cardStatsGradient:
        "linear-gradient(to bottom, rgba(56, 72, 124, 0.6), rgba(153, 153, 153, 0.6))",
      primaryGradient: "linear-gradient(135deg, #38487C 0%, #567029 100%)",
      secondaryGradient:
        "linear-gradient(135deg, #d2e4af 0%, rgba(210, 228, 175, 0) 100%)",
      sidebarGradient: "#ffff",
      headerGradient: "#ffff",
      primaryRgb: "#691b9a",
    },
  },
  {
    id: "theme4",
    name: "Skyblue",
    icon: "🌿",
    colors: {
      primaryColor: "#03A9F4",
      selectColorBtn: "#03A9F4",
      primaryHover: "#03A9F4",
      textPrimary: "#03A9F4",
      textSecondary: "#0043FF",
      textInfo: "#00b69b",
      textDanger: "#f93c65",
      textWarning: "#ff9066",
      textBlue: "#8280ff",
      textYellow: "#fec53d",
      backgroundColor: "#d1d1d9b3",
      bgSidebar: "#38487C",
      headerColor: "#000",
      backgroundColor2: "#e5e5e596",
      navActiveBg: "#e5e5e596",
      navActiveColor: "#03A9F4",
      bgHeader: "#38487C",
      navText: "#000",
      textLight: "#999999",
      bodyBg: "#e8eff9",
      cardTitle: "#202224",
      cardValue: "#4A4B4D",
      cardContent: "#000",
      cardBg: "#d1d1d9b3",
      alertColor: "#000",
      searchBg: "#fff",
      borderColor: "#fff",
      textColor: "#000",
      inputBorder: "#dee7f1",
      textWhite: "#fff",
      iconBgColor: "#E6EAF5",
      boxShadow: "0 0 5px rgba(106, 133, 51, 0.5)",
      boxShadow2: "0 4px 8px rgba(0, 0, 0, 0.1)",
      gradientStart: "#d2e4af",
      gradientEnd: "rgba(210, 228, 175, 0)",
      gradientWarning1: "rgba(255, 144, 102, 0.3)",
      gradientInfo1: "rgba(0, 182, 155, 0.3)",
      gradientYellow1: "rgba(254, 197, 61, 0.3)",
      gradientBlue1: "rgba(130, 128, 255, 0.3)",

      loginBackgroundColor: "#fff",
      paginationActiveColor: "#fff",
      paginationActiveBg: "#38487c",
      paginationActiveBorderColor: "#38487c",

      cardCustomBg: "#fff",
      cardCustomBg2: "#fff",
      cardCustomBg3: "#fff",

      defaultBackground: "#f9fafb",
      defaultTextColor: "#212b37",
      defaultBorder: "#ecf3fb",
      defaultBorder2: "#b9b9b9",

      formControlBg: "#ffffff",

      tableHead: "#F1F4F9",
      tableHoverColor: "#F5F6FA",
      chartColor: "#0284c7",
      // linear gradients
      cardStatsGradient:
        "linear-gradient(to bottom, rgba(56, 72, 124, 0.6), rgba(153, 153, 153, 0.6))",
      primaryGradient: "linear-gradient(135deg, #38487C 0%, #567029 100%)",
      secondaryGradient:
        "linear-gradient(135deg, #d2e4af 0%, rgba(210, 228, 175, 0) 100%)",
      sidebarGradient: "#ffff",
      headerGradient: "#ffff",
      primaryRgb: "#03A9F4",
    },
  },
];

interface ThemeProviderProps {
  children: ReactNode;
}

const defaultThemeId: string = LoginJson?.Theme?.id || "theme1";

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<string>("theme1");
  const [intensity, setIntensity] = useState<number>(50);

  const currentTheme =
    themeDefinitions.find((t) => t.id === theme) || themeDefinitions[0];

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || defaultThemeId;
    const savedIntensity = parseInt(
      localStorage.getItem("theme-intensity") || "50",
      10
    );
    setTheme(savedTheme);
    setIntensity(savedIntensity);
    applyTheme(savedTheme);
    applyIntensity(savedIntensity);
  }, []);

  const applyTheme = (themeId: string) => {
    const theme =
      themeDefinitions.find((t) => t.id === themeId) || themeDefinitions[0];
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  };

  const applyIntensity = (value: number): void => {
    document.documentElement.style.setProperty("--intensity", `${value}%`);
    localStorage.setItem("theme-intensity", value.toString());
  };

  const changeTheme = (newTheme: string): void => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyIntensity(intensity);
  };

  const changeIntensity = (newIntensity: number): void => {
    setIntensity(newIntensity);
    applyIntensity(newIntensity);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        intensity,
        currentTheme,
        themes: themeDefinitions,
        changeTheme,
        changeIntensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
