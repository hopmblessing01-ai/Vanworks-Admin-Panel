"use client";

import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    sidebar: {
      main: string;
      contrastText: string;
      hover: string;
      border: string;
    };
  }
  interface PaletteOptions {
    sidebar?: {
      main: string;
      contrastText: string;
      hover: string;
      border: string;
    };
  }
}

// Material Design defaults — we only customize the palette + a tiny font tweak.
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#455a64", // blue-grey 700
      light: "#718792",
      dark: "#1c313a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0288d1",
      light: "#5eb8ff",
      dark: "#005b9f",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    sidebar: {
      main: "#263238",
      contrastText: "#eceff1",
      hover: "#37474f",
      border: "rgba(255, 255, 255, 0.08)",
    },
  },
  typography: {
    fontFamily: `"Roboto", "Helvetica Neue", Arial, sans-serif`,
    fontSize: 15,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ".auth-pattern": {
          backgroundColor: "#eceff1",
          backgroundImage:
            "radial-gradient(at 20% 0%, #cfd8dc 0px, transparent 50%), radial-gradient(at 80% 100%, #b3e5fc 0px, transparent 50%)",
        },
      },
    },
  },
});
