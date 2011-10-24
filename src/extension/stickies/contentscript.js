// check to see if we already loaded
(function() {
if (typeof PageStickies == "undefined") {
	var PageStickies = {};
	var createCount = 0;
	PageStickies.createSticky = function(options, isNew){
		var dom = document.createElement('DIV');
		dom.className = "pagestickies-container reset";
		if (isNew === true) {
			dom.setAttribute('isNew', 'true');
		}
		document.body.appendChild(dom);
		return $(dom).sticky(options);
	};
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
		switch (request.action) {
			case 'logout':
				$.ui.sticky.destroy();
				break;
			case 'login':
				PageStickies.fetchStickiesData();
				sendResponse({});
				break;
			case 'newsticky':
				var scrollTop = $('body').scrollTop();
				var scrollLeft = $('body').scrollLeft();
				var width = $('body').width()
				var top = (scrollTop + 100) + ( createCount * 20 );
				createCount++;
				var left = (scrollLeft + width) - 300;
				if (!top) {
					top: 100;
				}
				if (!left) {
					left = 100;
				}
				var style = {
					top: top + 'px',
					left: left + 'px',
					width: '230px',
					height: '170px',
					zIndex: 1000000
				};
				var options = {
					style: style,
					colorCls: request.colorCls
				};
				var sticky = PageStickies.createSticky(options, true);
				break;
			case 'changeInfo':
				if (PageStickies.location &&
				(PageStickies.location['origin'] != window.location.origin ||
				PageStickies.location['pathname'] != window.location.pathname)) {
					PageStickies.fetchStickiesData();
				}
				break;
		}
	});
	PageStickies.location = null;
	PageStickies.fetchStickiesData = function(){
		// send first request
		var loc1 = {
			origin: window.location.origin,
			pathname: window.location.pathname
		};
		$.ui.sticky.destroy();
		chrome.extension.sendRequest({
			action: 'fetch',
			loc: JSON.stringify(loc1)
		}, function(response){
			// build stickies here
			PageStickies.location = loc1;
			var jsonArray = JSON.parse(response);
			for (var i = 0; i < jsonArray.length; i++) {
				PageStickies.createSticky(JSON.parse(jsonArray[i].content), false);
			}
		});
	};
	PageStickies.fetchStickiesData();	
}
})();