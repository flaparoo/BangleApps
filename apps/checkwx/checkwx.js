/*
 * CheckWX Bangle Module
 *
 * CheckWX doco: https://www.checkwxapi.com/documentation
 * test CheckWX API request with eg.: curl 'https://api.checkwx.com/v2/metar/lat/.../lon/...?x-api-key=...'
 *
 */


const CHECKWX_BASE_URL = 'https://api.checkwx.com/';   // must end with a slash
const CHECKWX_CONFIG_FILE = 'checkwx.json';


// read in the settings
var CheckWXsettings = Object.assign({
  CheckWXkey: '',
}, require('Storage').readJSON(CHECKWX_CONFIG_FILE, true) || {});


/**
 * Make an CheckWX API request
 *
 * @param    {string}    requestPath   API path (after /), eg. 'v2/metar/KOSH'
 * @param    {string}    params        optional request parameters, eg. 'limit=1' (use '&' in the string to combine multiple params)
 * @param    {function}  successCB     callback if the API request was successful - will supply the returned data: successCB(data)
 * @param    {function}  failCB        callback in case the API request failed - will supply the error: failCB(error)
 *
 * @returns  {number}                  the HTTP request ID
 *
 * Example:
 *  reqID = checkwx.request('v2/metar/lat/'+lat+'/lon/'+lon+'/short',
 *                          'limit=1',
 *                          data => { console.log(data); },
 *                          error => { console.log(error); });
 *
 */
exports.request = function(requestPath, optParams, successCB, failCB) {
  if (! CheckWXsettings.CheckWXkey) {
    failCB('No CheckWX API Key defined!');
    return undefined;
  }
  let params = 'x-api-key='+CheckWXsettings.CheckWXkey;
  if (optParams)
    params += '&'+optParams;
  return Bangle.http(CHECKWX_BASE_URL+requestPath+'?'+params).then(successCB).catch(failCB);
};

