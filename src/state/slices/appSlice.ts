import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Api } from '../../types/api';
import { mergeUserProfile } from '../../utils/userRole';

export interface AppState {
  keyState: number;
  userToken?: string;
  user?: Api.User.Res.Detail | undefined;
  members?:any;
  membersUpdated?: boolean;
  showInfoContainer?: boolean;
}

const initialState: AppState = {
  keyState: 0,
  userToken: undefined,
  user: undefined,
  members: undefined,
  membersUpdated: false,
  showInfoContainer: false,
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
      if (!action.payload) {
        state.user = undefined;
        return;
      }
      state.user = mergeUserProfile(
        state.user,
        action.payload as Record<string, unknown>,
      ) as Api.User.Res.Detail;
    },
    setMembers(state, action: PayloadAction<Api.User.Res.Detail | undefined>) {
      state.members = action.payload;
    },
    setMembersUpdated(state, action: PayloadAction<boolean>) {
      state.membersUpdated = action.payload;
    },
    setShowInfoContainer(state, action: PayloadAction<boolean>) {
      state.showInfoContainer = action.payload;
    },
  },
});

export const { setKeyState, setUserToken, setUser, setMembers, setMembersUpdated, setShowInfoContainer } = appSlice.actions;
export default appSlice.reducer;


