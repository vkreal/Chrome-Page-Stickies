var PageStickies_IsLoaded_Once = false;
try {
	if($.ui.sticky) {
		console.log('ui.sticky is loaded');
		PageStickies_IsLoaded_Once = true;
	}
}
catch(e){ console.log('ui.sticky is not loaded'); PageStickies_IsLoaded_Once=false;}

if (PageStickies_IsLoaded_Once == false) {

	(function($){
		var cache = [];
		$.widget("ui.sticky", {
			isDeleted: false,
			key: '',
			options: {
				style: {
					top: '100px',
					left: '100px',
					width: '230px',
					height: '170px',
					zIndex: 1000000
				},
				colorCls: 'yellow'
			},
			_create: function(options){
				cache.push(this);
				var self = this, o = self.options, el = self.element;
				el.css('position', 'absolute');
				$.each(o.style, function(key, value){
					el.css(key, value);
				})//from(#FDF9B7), to(#FDED76)
				el.css('font-family', o.fontFamily);
				el.css('font-size', o.fontSize);
				var random = new Date().getTime();
				var id = 'sticky-' + random;
				el.attr('id', id);
				var text = o.text || '';
				var closeIMG = 'close.png';
				if (typeof(chrome) != 'undefined' && chrome.extension) {
					closeIMG = chrome.extension.getURL(closeIMG);
				}
				el.addClass('pagestickies ui-corner-all reset ' + o.colorCls);
				$(['<table class="reset" style="width:100%; height:100%; border-color:transparent !important;" border="0" cellspacing="0" cellpadding="0">', '<tr>', '<td class="reset" style="height:30px; padding:0;  background:transparent !important;" valign="middle">', '<div class="ui-corner-all reset ' + o.colorCls + '" style="height:30px;">', '<img class="resetXXX" id="' + id + '-close" border="0" style="float: right !important; position:relative !important; top:6px !important; padding-right:6px !important;" src="' + closeIMG + '"/>', '</div>', '</td>', '</tr>', '<tr>', '<td style="height:100%; padding:0; padding-top:5px; background:transparent !important;">', '<textArea maxlength="2500" class="reset pagestickies-text" id="' + id + '-textarea" style="resize: none !important; height:100%; width:100%; background:transparent !important; border:0;" placeholder="Add text here.">' + text + '</textArea>', '</td>', '</tr>', '</table>'].join('')).appendTo(el);
				var first = el.first();
				$(first).draggable({
					handle: 'div',
					iframeFix: true,
					stop: $.proxy(this._ondragStop, this)
				});
				$(first).resizable({
					iframeFix: true,
					stop: $.proxy(this._resizeStop, this)
				});
				el.mousedown(function(event){
					var zIndex = parseInt(o.style.zIndex) - 1;
					$.each(cache, function(i, widget){
						if (!widget.deleted && widget != self) {
							var c = parseInt(widget.element.css('zIndex'));
							if (widget && c > zIndex) {
								zIndex = c;
							}
						}
					});
					if (zIndex >= el.css('zIndex')) {
						zIndex += 1;
						el.css('zIndex', zIndex);
						self.options.style['zIndex'] = zIndex;
						self._doUpate();
						console.log('zIndex: ' + zIndex);
					}
				});
				$('#' + id + '-close').click(function(){
					self.destroy();
				});
				$('#' + id + '-textarea').blur(function(event){
					self._doUpate('textchange');
				});
				//alert(JSON.stringify(o))
				
				if (o.key) {
					this.key = o.key;
				}
				if(o.pagekey){
					//$.ui.sticky.pagekey = o.pagekey;
				}
				if (el.attr('isNew')) {
					this._doUpate('create new pagestickies');
				}
			},
			_ondragStop: function(event, ui){
				this.options.style['left'] = event.target.style.left;
				this.options.style['top'] = event.target.style.top;
				console.log('x: ' + event.target.style.left + ' y: ' + event.target.style.top);
				this._doUpate('drag stop');
			},
			_resizeStop: function(event, ui){
				this.isDirty = true;
				this.options.style['width'] = event.target.style.width;
				this.options.style['height'] = event.target.style.height;
				this._doUpate('resize stop');
				console.log('w: ' + event.target.style.width + ' h: ' + event.target.style.height);
			},
			_doUpate: function(action){
				//alert(action)
				//if (this.key) {
				var self = this;
				var json = this.toJson();
				//console.log('action: ' + action + '  doUpdate json: ' + JSON.stringify(json));
				$.ui.sticky.doAction('update', json, function(data){
					var json = JSON.parse(data);
					if (json) {
						self.key = json['key'];
					}
				});
				//}
			},
			destroy: function(save){
			
				//if(save != false) {
				//	if(!confirm("Are you sure you want to delete?")){
				//		return;
				//	}	
				//}
				$.Widget.prototype.destroy.apply(this, arguments); // default destroy
				this.isDeleted = true;
				this.element.remove();
				//if (this.key) {
				if (save != false) {
					$.ui.sticky.doAction('remove', {
						key: this.key
					}, function(){
					});
				}
				//}
			},
			toJson: function(){
				this.options['text'] = $('#' + this.element.attr('id') + '-textarea').val();
				this.options['key'] = this.key;
				return this.options;
			}
		});
		$.ui.sticky.destroy = function(){
			var a = [];
			$.each(cache, function(i, sticky){
				if (!sticky.isDeleted) {
					sticky.destroy(false);
				}
			});
			return a;
		};
		$.ui.sticky.getCount = function(action, data, callback){
			var count = 0;
			$.each(cache, function(i, sticky){
				if (!sticky.isDeleted) {
					count++;
				}
			});
			return count;
		};
		$.ui.sticky.doAction = function(action, data, callback){
			console.log('ui.sticky.doAction: ' + action);
			//alert(JSON.stringify(window.location))
			chrome.extension.sendRequest({
				action: action,
				payload: {
					action: action,
					loc: JSON.stringify({
						origin: window.location.origin,
						pathname: window.location.pathname,
						href: window.location.href
					}),
					data: data,
					pagekey: $.ui.sticky.pagekey
				}
			}, callback);
		};
		$.ui.sticky.pagekey = '';
		$.extend($.ui.sticky, {
			version: "@VERSION"
		});
		
	})(jQuery);
}