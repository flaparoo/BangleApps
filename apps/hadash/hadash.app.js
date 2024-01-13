/*
 * Home-Assistant Dashboard - Bangle.js
 */

const APP_NAME = 'hadash';

// Load settings
var settings = Object.assign({
  menu: [
    { title: 'Query state 1', type: 'state', id: 'update.home_assistant_core_update' },
    { title: 'Call service 1', type: 'service', domain: 'persistent_notification', service: 'create', data: '{"message":"test notification","title":"Test"}' },
    { title: 'Submenu', type: 'menu', data: [
      { title: 'Query state 2', type: 'state', id: 'update.home_assistant_supervisor_update' },
      { title: 'Call service 2', type: 'service', domain: 'homeassistant', service: 'restart', data: '' },
    ], },
  ],
  HAbaseUrl: '',
  HAtoken: '',
}, require('Storage').readJSON(APP_NAME+'.json', true) || {});


// query an entity state
function queryState(title, id, level) {
  Bangle.http(settings.HAbaseUrl+'/states/'+id, {
    headers: {
      'Authorization': 'Bearer '+settings.HAtoken,
      'Content-Type': 'application/json'
    },
  }).then(data => {
    //console.log(data);
    let HAresp = JSON.parse(data.resp);
    let title4prompt = title;
    let msg = HAresp.state;
    if ('attributes' in HAresp) {
      if ('friendly_name' in HAresp.attributes)
        title4prompt = HAresp.attributes.friendly_name;
      if ('unit_of_measurement' in HAresp.attributes)
        msg += HAresp.attributes.unit_of_measurement;
    }
    E.showPrompt(msg, { title: title4prompt, buttons: {OK: true} }).then((v) => { E.showMenu(menus[level]); });
  }).catch( error => {
    console.log(error);
    E.showPrompt('Error querying state!', { title: title, buttons: {OK: true} }).then((v) => { E.showMenu(menus[level]); });
  });
}


// call a service
function callService(title, domain, service, data, level) {
  Bangle.http(settings.HAbaseUrl+'/services/'+domain+'/'+service, {
    method: 'POST',
    body: data,
    headers: {
      'Authorization': 'Bearer '+settings.HAtoken,
      'Content-Type': 'application/json'
    },
  }).then(data => {
    //console.log(data);
    E.showPrompt('Service called successfully', { title: title, buttons: {OK: true} }).then((v) => { E.showMenu(menus[level]); });
  }).catch( error => {
    console.log(error);
    E.showPrompt('Error calling service!', { title: title, buttons: {OK: true} }).then((v) => { E.showMenu(menus[level]); });
  });
}


// menu hierarchy
var menus = [];


// add menu entries
function addMenuEntries(level, entries) {
  let entryCBs = [];
  for (let i in entries) {
    let entry = entries[i];
    switch (entry.type) {
      case 'state':
        eval('entryCBs['+i+'] = function() { queryState("'+entry.title+'", "'+entry.id+'", '+level+'); }');
        break;
      case 'service':
        let serviceData = JSON.stringify(entry.data);
        eval('entryCBs['+i+'] = function() { callService("'+entry.title+'", "'+entry.domain+'", "'+entry.service+
                                                                              '", '+serviceData+', '+level+'); }');
        break;
      case 'menu':
        let menuData = JSON.stringify(entry.data);
        eval('entryCBs['+i+'] = function() { showSubMenu('+(level + 1)+', "'+entry.title+'", '+menuData+'); }');
        break;
    }
    menus[level][entry.title] = entryCBs[i];
  }
}


// create and show a sub menu
function showSubMenu(level, title, entries) {
  menus[level] = {
    '': {
      'title': title,
      'back': () => E.showMenu(menus[level - 1])
    },
  };
  addMenuEntries(level, entries);
  E.showMenu(menus[level]);
}


// create main menu
menus[0] = {
  '': {
    'title': 'HA-Dash',
    'back': () => load()
  },
};
addMenuEntries(0, settings.menu);

// check required configuration
if (! settings.HAbaseUrl || ! settings.HAtoken) {
  E.showAlert('The app is not yet configured!', 'HA-Dash').then(() => E.showMenu(menus[0]));
} else {
  E.showMenu(menus[0]);
}

