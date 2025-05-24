import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import nexusVotingService from '../services/nexusVotingService';

export const fetchVotes = createAsyncThunk('voting/fetchVotes', async () => {
  return await nexusVotingService.getAllVotes();
});

export const fetchVoteById = createAsyncThunk('voting/fetchVoteById', async (id) => {
  return await nexusVotingService.getVoteById(id);
});

const voteSlice = createSlice({
  name: 'voting',
  initialState: {
    votes: [],
    voteDetails: {},
    loading: false,
    error: null,
    userVotes: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVotes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVotes.fulfilled, (state, action) => {
        state.loading = false;
        state.votes = action.payload;
      })
      .addCase(fetchVotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchVoteById.fulfilled, (state, action) => {
        state.voteDetails[action.payload.id] = action.payload;
      });
  },
});

export const voteReducer = voteSlice.reducer;
