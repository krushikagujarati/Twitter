import api from '../utils/api';
import axios from 'axios';
import { setAlert } from './alert';
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT
} from './types';

/*
  NOTE: we don't need a config object for axios as the
 default headers in axios are already Content-Type: application/json
 also axios stringifies and parses JSON for you, so no need for 
 JSON.stringify or JSON.parse
*/

// Load User
export const loadUser = () => async (dispatch) => {
  try {
    const res = await api.get('/auth');
    // axios.get(`${process.env.REACT_APP_SERVER_URL}/getuser`, { withCredentials: true }).then((res) => {
    //   console.log("res"+JSON.stringify(res))
    //         if (res.data) {
    //           dispatch({
    //             type: USER_LOADED,
    //             payload: res.data
    //           });
    //         }
    //         else{
    //           console.log("autherr");
    //           dispatch({
    //             type: AUTH_ERROR
    //           });
    //         }
    //     })
    //console.log("res"+JSON.stringify(res))
    dispatch({
      type: USER_LOADED,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR
    });
  }
};

// Register User
export const register = (formData) => async (dispatch) => {
  try {
    const res = await api.post('/users', formData);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data
    });
    //dispatch(loadUser());
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    }

    dispatch({
      type: REGISTER_FAIL
    });
  }
};

// Login User
export const login = (email, password, code, on2FARequested) => async (dispatch) => {
  const body = { email, password, code };

  try {
    const res = await api.post('/auth', body);
    
    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });

    dispatch(loadUser());
  } catch (err) {
    const errors = err.response.data.errors;
    if (errors) {
      errors.forEach((error) => {
      dispatch(setAlert(error.msg, 'danger'))
      if(error.msg === "2FA Code Requested"){
        on2FARequested(true);
      };
      });
    }


    dispatch({
      type: LOGIN_FAIL
    });
  }
};

// Logout
export const logout = () => async (dispatch) => {
  try {
    axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/logout`, { withCredentials: true }).then((res) => {
             
        })
        dispatch({
          type: LOGOUT
        });
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    }

    dispatch({
      type: LOGOUT
    });
  }
};

// sendPasswordResetEmail
export const sendPasswordResetEmail = (email, otp) => async (dispatch) => {
  try {
    const body = {email, otp};
    const res = await api.put('/users/sendcode', body);

    dispatch({
      type: REGISTER_FAIL,
      payload: res.data
    });
    dispatch(setAlert('Email Sent', 'success'));
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    }

    dispatch({
      type: REGISTER_FAIL
    });
  }
};

export const newPassword = (body) => async (dispatch) => {
    try {
      const res = await api.put('/users/resetpassword', body);
  
      dispatch({
        type: LOGIN_SUCCESS,
        payload: res.data
      });
      dispatch(loadUser());
    } catch (err) {
      const errors = err.response.data.errors;
  
      if (errors) {
        errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
      }
  
      dispatch({
        type: LOGIN_FAIL
      });
    }
};