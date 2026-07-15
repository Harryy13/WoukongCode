import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register', userData);

      // Return the user data from the response
      return response.data.user;
    } catch (err) {
      // Return the error message from the server if available
      return rejectWithValue( err.message);
    }
  }
);


export const loginUser=createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/login', credentials);

      // Return the user data from the response
      return response.data.user;
    } catch (err) {
      // Return the error message from the server if available
      return rejectWithValue( err.message);
    }
  }
    
);

export const checkAuth=createAsyncThunk(
   'auth/check',
   async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/user/check');

      // Return the user data from the response
      return response.data.user;
    } catch (err) {
      // Return the error message from the server if available
      return rejectWithValue( err.message);
    }
}
  
);

export const logoutUser=createAsyncThunk(
   'auth/logout',
   async (_, { rejectWithValue }) => {
    try {
       await axiosClient.post('/user/logout');

      // Return the user data from the response
      return null;
    } catch (err) {
      // Return the error message from the server if available
      return rejectWithValue(err.message);
    }
  }
);

const authSlice=createSlice({
    name:'auth',
    initialState:{
        user:null,
        isAuthenticated:false,
        loading:false,
        error:null
    },
    reducers:{},
    extraReducers:(builder)=>{
        builder
        .addCase(registerUser.pending , (state)=>{
            state.loading=true;
            state.error=null;
        })
       .addCase(registerUser.fulfilled, (state, action) => {
    state.loading = false;
    state.isAuthenticated = !!action.payload;
    state.user = action.payload;
})
        .addCase(registerUser.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload?.message || "Something went wrong";
    state.isAuthenticated = false;
    state.user = null;
})
        .addCase(loginUser.pending ,(state)=>{
            state.loading=true;
            state.error=false;

        })
        .addCase(loginUser.fulfilled, (state, action) => {
    state.loading = false;
    state.isAuthenticated = !!action.payload;
    state.user = action.payload;
})
        .addCase(loginUser.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload?.message || "Something went wrong";
    state.isAuthenticated = false;
    state.user = null;
})
        .addCase(logoutUser.pending,(state)=>{
            state.loading=true;
            state.error=null;

        })
        .addCase(logoutUser.fulfilled , (state)=>{
            state.loading=false;
            state.user=null,
            state.isAuthenticated=false;
            state.error=null;
        })
       .addCase(logoutUser.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload?.message || "Something went wrong";
    state.user = null;
    state.isAuthenticated = false;
})

.addCase(checkAuth.pending, (state) => {
    state.loading = true;
})

.addCase(checkAuth.fulfilled, (state, action) => {
    state.loading = false;
    state.user = action.payload;
    state.isAuthenticated = !!action.payload;
})

.addCase(checkAuth.rejected, (state) => {
    state.loading = false;
    state.user = null;
    state.isAuthenticated = false;
})

    }
});


export default  authSlice.reducer;