import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  keyState: number;
  userToken?: string;
  user?: Api.User.Res.Detail | undefined;
  members?:any;
  membersUpdated?: boolean;
}

const initialState: AppState = {
  keyState: 0,
  userToken: undefined,
  user: undefined,
  members: undefined,
  membersUpdated: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setKeyState(state, action: PayloadAction<number>) {
      state.keyState = action.payload;
    },
    setUserToken(state, action: PayloadAction<string | undefined>) {
      state.userToken = action.payload;
    },
    setUser(state, action: PayloadAction<Api.User.Res.Detail | undefined>) {
      state.user = action.payload;
    },
    setMembers(state, action: PayloadAction<Api.User.Res.Detail | undefined>) {
      state.members = action.payload;
    },
    setMembersUpdated(state, action: PayloadAction<boolean>) {
      state.membersUpdated = action.payload;
    },
  },
});

export const { setKeyState, setUserToken, setUser, setMembers, setMembersUpdated } = appSlice.actions;
export default appSlice.reducer;


