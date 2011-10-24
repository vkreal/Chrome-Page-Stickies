 var DEBUG = false;
 //application: pagestickies
 //serena
 var PageStickies = {};
 PageStickies.injectedTabs = [];
 var canvas, loggedInImage, canvasContext;
 var AppRoot = DEBUG ? 'http://127.0.0.1:9999/' : 'http://www.pagestickies.com/'; //'http://serena.appspot.com/';
 var logged_in_key = '39EBE46BB1C64D1E8983420623496747';
 var SkipURLS = [
  	"//127.0.0.1:9999",
	"chrome://"
  ]; 
  function doFetch(href) {
  	for(var i = 0; i<SkipURLS.length; i++){
		if( href.indexOf(SkipURLS[i]) != -1 ){
			return false;
		}
	}
	return true;
  };
  function attemptLogin(loginURL, callback){
  	if (loginURL) {
		var before_cb = function(){
			showLoggedOut();
		};
		var sucess_cb = function() {
			if( _isLoginJson ){
				_isLoginJson.isLogin = true;
			}
			showLoggedIn();
		};
		attemptLoginLogout('login', loginURL, before_cb, sucess_cb);
	}
  };
 
 var onUpdated = (function() {
  	var sucess_cb, lastTabId, action
  	chrome.tabs.onUpdated.addListener(function(id, event, tab){
		if(tab && 
			tab.status == "complete" &&
			tab.url && 
			tab.url.indexOf(logged_in_key) != -1 && 
			tab.url.indexOf('services/islogin/?guid=39EBE46BB1C64D1E8983420623496747') != -1)
		{
			// remove login tab
			chrome.tabs.remove(tab.id, function(){
        		console.log('login tab removed');
				chrome.tabs.update(
					lastTabId, 
					{
						selected: true
					}, function() {
						chrome.tabs.sendRequest(lastTabId, {action:action}, function(response) {});
					});
					
				if(sucess_cb){
					sucess_cb();
				}
       	 	});
		}
	});
	return function(actionType, lastId, sucess_callback) {
		sucess_cb = sucess_callback;
		lastTabId = lastId;
		action = actionType;
	};
  })();
  
  function attemptLoginLogout(action, url, before_cb, sucess_cb){
  	if (url) {
		if(before_cb) {
			before_cb();
		}
		chrome.tabs.getSelected(null, function(currenttab){
			// create new tab
			var lastTabId = currenttab.id;
			chrome.tabs.create({
				'url': url,
				'selected': true
			}, function(newtab){
				// detect when user is logged in
				onUpdated(action, lastTabId, sucess_cb);
			});
		});
	}
  };
  function signOut(){
  	if (_isLoginJson && _isLoginJson.logout) {
		var before_cb = function(){};
		var sucess_cb = function() {
			if( _isLoginJson ){
				_isLoginJson.isLogin = false;
			}
			showLoggedOut();
		};
		attemptLoginLogout('logout', _isLoginJson.logout, before_cb, sucess_cb);
	}
  };
  function onRequest(request, sender, callback) {
  		if(sender && sender.tab && sender.tab.id){
			PageStickies.injectedTabs[sender.tab.id] = true;
		}
		if (!_isLoginJson || (_isLoginJson && !_isLoginJson.isLogin)) {
			return;
		}
    	// generalized into a more robust RPC system.
		console.log('onRequest in background - action: ' + request.action);
		switch(request.action) {
			case 'fetch':
				$.post(AppRoot + 'services/get/', {payload:request.loc}, function(data){
					//console.log('onRequest in background - callback: ' + data);
					if (callback) {
						callback(data);
					}
				});
				break;
			case 'remove':
			case 'update':
				$.post(AppRoot + 'services/put/', {payload:JSON.stringify(request.payload)}, function(data){
					//console.log('onRequest in background - callback: ' + data);
					if (callback) {
						callback(data);
					}
				});
				break;
        }
  };
  // Wire up the listener.
  chrome.extension.onRequest.addListener(onRequest);
  
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
	if (changeInfo.url) { // ajax update url example: facebook
		//var callback = function(data){
		//	updateBrowserAction(data);
			
		//};
		isLogin(updateBrowserAction);
		chrome.tabs.sendRequest(tabId, {action:'changeInfo', changeInfo: {'url': changeInfo.url}}, function(response) {});
	}
  });
  var _isLoginJson = null;
 
  function isLogonClient() {
 		return _isLoginJson != null && _isLoginJson.isLogin == true;
  };
  function isLogin(callback, force) {
  		if(_isLoginJson && force != true) {
			callback(_isLoginJson); 
			return;
		}
		// TODO: CONVERT TO JQUERY GET
  		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(data){
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					_isLoginJson = JSON.parse(xhr.responseText);	
					if (callback) {
						callback(_isLoginJson);
					}
				}
			}
		}
		var url = AppRoot + 'services/islogin/';
		xhr.open('GET', url, true);
		xhr.send();
  };
  function isLoginOrAttemptLogin() {
 	isLogin(function(data){
		if( data && !data.isLogin ){
			showLoggedOut();
			attemptLogin(data.login, function() {
				showLoggedIn();
			});
		}
		else {
			showLoggedIn();
		}
	}, true);
  };
  function injectScriptIfNeeded(tabId){
  		if (!PageStickies.injectedTabs[tabId]) {
			chrome.tabs.insertCSS(tabId, {
				file: "sticky.css"
			});
			chrome.tabs.insertCSS(tabId, {
				file: "jquery-ui-1.8.11.custom/css/ui-lightness/jquery-ui-1.8.11.custom.css"
			});
			chrome.tabs.executeScript(tabId, {
				file: "jquery-ui-1.8.11.custom/js/jquery-1.5.1.min.js"
			});
			chrome.tabs.executeScript(tabId, {
				file: "jquery-ui-1.8.11.custom/js/jquery-ui-1.8.11.custom.min.js"
			});
			chrome.tabs.executeScript(tabId, {
				file: "jquery-ui.sticky.js"
			});
			chrome.tabs.executeScript(tabId, {
				file: "contentscript.js"
			});
			PageStickies.injectedTabs[tabId] = true;
		}
  };
  function showLoggedOut() {
	  chrome.browserAction.setIcon({path:"logged_out_icon.jpg"});
	  chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
	  chrome.browserAction.setBadgeText({text:"?"});
  };
  function showLoggedIn() {
		chrome.browserAction.setBadgeBackgroundColor({
		color: [208, 0, 24, 255]
	});
	chrome.browserAction.setIcon({
		path: "logged_in_icon.png"
	});
	chrome.browserAction.setBadgeText({text:""});
  };
  function updateBrowserAction(data, loginCallback){
	if (data && data.isLogin) {
		showLoggedIn();
		if( loginCallback ) {
			loginCallback();
		}
	}
	else {
		//alert(JSON.stringify(data))
		showLoggedOut();
	}
  };
  function init() {
  	canvas = document.getElementById('canvas');
	loggedInImage = document.getElementById('logged_in');
	canvasContext = canvas.getContext('2d');
	isLogin(updateBrowserAction);
	
	chrome.windows.getCurrent(function(currentWindow) {
	    var currentWindowId = currentWindow.id;
	    chrome.tabs.getAllInWindow(currentWindowId, function(tabs) {
			// reload tabs or inject css and script preferred    	
			$.each(tabs, function(i, tab){
				injectScriptIfNeeded(tab.id);
			});
		});	
	});
	
  };
  
  function oncontextItemClick(info, tab) {
  	if( !isLogonClient() ) {
		isLoginOrAttemptLogin();
	}
	else {
		var colorId = "pagestickies-yellow";
		if(yellowMenu == info.menuItemId) {
			colorId = "pagestickies-yellow";
		} 
		else if(blueMenu == info.menuItemId) {
			colorId = "pagestickies-blue";
		}
		else if(greenMenu == info.menuItemId) {
			colorId = "pagestickies-green";
		}
		else if(purpleMenu == info.menuItemId) {
			colorId = "pagestickies-purple";
		}
		else if(redMenu == info.menuItemId) {
			colorId = "pagestickies-red";
		}
		chrome.tabs.sendRequest(tab.id, {
				action: 'newsticky',
				colorCls: colorId
			}, function(response){
		});
	}
  };
  
  
  var parentMenu = chrome.contextMenus.create({"title": "Page Stickies"});
  var yellowMenu = chrome.contextMenus.create( {"title": "Yellow", "parentId": parentMenu, "onclick": oncontextItemClick});
  var blueMenu = chrome.contextMenus.create( {"title": "Blue", "parentId": parentMenu, "onclick": oncontextItemClick});
  var greenMenu = chrome.contextMenus.create( {"title": "Green", "parentId": parentMenu, "onclick": oncontextItemClick});
  var purpleMenu = chrome.contextMenus.create( {"title": "Purple", "parentId": parentMenu, "onclick": oncontextItemClick});
  var redMenu = chrome.contextMenus.create( {"title": "Red", "parentId": parentMenu, "onclick": oncontextItemClick});