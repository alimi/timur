// Class imports.
import {getView} from '../api/view_api';
import {showMessages} from './message_actions';
import {Exchange} from './exchange_actions';
import * as ManifestActions from './manifest_actions';
import * as TabSelector from '../selectors/tab_selector';
import * as Cookies from '../utils/cookies';

// Flip a config variable.
export const toggleConfig = (key)=>{
  return {
    'type': 'TOGGLE_CONFIG',
    key
  };
};

export const addTab = (view_name, tab_name, tab)=>{
  return {
    type: 'ADD_TAB',
    view_name, // The view name also references a Magma Model.
    tab_name,
    tab
  };
};

export const addTokenUser = (user)=>{
  return {
    type: 'ADD_TOKEN_USER',
    token: Cookies.getItem(TIMUR_CONFIG.token_name)
  };
};

/*
 * Request a view for a given model/record/tab and send requests for additional 
 * data.
 */
export const requestView = (model_name, record_name, tab_name, success, error)=>{
  return (dispatch)=>{
    // Handle success from 'getView'.
    var localSuccess = (response)=>{
      // Add the tab view to the store.
      Object.values(response.view.tabs).forEach(
        tab => dispatch(addTab(model_name, tab.name, tab))
      )
      if(success != undefined) {
        success(response);
      }
    };

    // Handle an error from 'getView'.
    var localError = (e)=>{
      if(error != undefined) error(e);
    };

    var exchange = new Exchange(dispatch,`view for ${model_name} ${record_name}`);
    getView(model_name, tab_name, exchange)
      .then(localSuccess)
      .catch(localError);
  };
};
