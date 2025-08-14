import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FontState {
  fontFamily: string;
}

// Helper function to safely get font from localStorage
const getInitialFont = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const savedFont = localStorage.getItem('selectedFont');
      return savedFont ? JSON.parse(savedFont) : 'Poppins, sans-serif';
    } catch (error) {
      console.error('Error reading font from localStorage:', error);
      return 'Poppins, sans-serif';
    }
  }
  return 'Poppins, sans-serif';
};

const initialState: FontState = {
  fontFamily: getInitialFont(),
};

const fontSlice = createSlice({
  name: 'font',
  initialState,
  reducers: {
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.fontFamily = action.payload;
      // Save to localStorage whenever font changes
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('selectedFont', JSON.stringify(action.payload));
        } catch (error) {
          console.error('Error saving font to localStorage:', error);
        }
      }
    },
  },
});

export const { setFontFamily } = fontSlice.actions;
export default fontSlice.reducer;