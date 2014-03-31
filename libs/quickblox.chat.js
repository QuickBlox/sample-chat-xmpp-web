/**
 * QuickBlox Chat library
 * version 0.4.0
 *
 * Author: Andrey Povelichenko (andrey.povelichenko@quickblox.com)
 *
 */

function QBChat(params) {
	var _this = this;
	
	this.config = {
		server: 'chat.quickblox.com',
		muc: 'muc.chat.quickblox.com',
		bosh: 'http://chat.quickblox.com:5280'
	};
	
	// create Strophe Connection object
	this.connection = new Strophe.Connection(_this.config.bosh);
	
	// set user callbacks
	if (params) {
		this.onConnectFailed = params.onConnectFailed || null;
		this.onConnectSuccess = params.onConnectSuccess || null;
		this.onConnectClosed = params.onConnectClosed || null;
		this.onChatMessage = params.onChatMessage || null;
		this.onMUCPresence = params.onMUCPresence || null;
		this.onMUCRoster = params.onMUCRoster || null;
		
		// logs
		if (params.debug) {
			this.connection.rawInput = function(data) {console.log('RECV: ' + data)};
			this.connection.rawOutput = function(data) {console.log('SENT: ' + data)};
		}
	}
	
	this.onMessage = function(stanza, room) {
		var jid, type, time, message, nick;
		
		if (params && params.debug) {
			traceChat('Message');
			console.log(stanza);
		}
		
		jid = $(stanza).attr('from');
		type = $(stanza).attr('type');
		time = $(stanza).find('delay').attr('stamp') || new Date().toISOString();
		message = $(stanza).find('body').context.textContent;
		
		if (type == 'groupchat')
			nick = _this.getNickFromResource(jid);
		else
			nick = _this.getNickFromNode(jid);
		
		_this.onChatMessage(nick, type, time, _parser(message));
		return true;
	};
	
	this.onPresence = function(stanza, room) {
		var jid, type, time, nick;
		
		if (params && params.debug) {
			traceChat('Presence');
			console.log(stanza);
		}
		
		jid = $(stanza).attr('from');
		type = $(stanza).attr('type');
		time = new Date().toISOString();
		
		nick = _this.getNickFromResource(jid);
		
		_this.onMUCPresence(nick, type, time);
		return true;
	};
	
	this.onRoster = function(users, room) {
		_this.onMUCRoster(users, room);
		return true;
	};
	
	// helpers
	this.getJID = function(id) {
		return id + "-" + QB.session.application_id + "@" + _this.config.server;
	};
	
	this.getNickFromNode = function(jid) {
		return Strophe.getNodeFromJid(jid).split('-')[0];
	};
	
	this.getNickFromResource = function(jid) {
		return Strophe.getResourceFromJid(jid);
	};
	
	// private methods
	function _parser(str) {
		var URL_REGEXP = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
		return str.replace(URL_REGEXP, function(match) {
			url = (/^[a-z]+:/i).test(match) ? match : 'http://' + match;
			url_text = match;
			return '<a href="' + escapeHTML(url) + '" target="_blank">' + escapeHTML(url_text) + '</a>';
		});
		
		function escapeHTML(s) {
			return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
	}
}

function traceChat(text) {
	console.log("[qb_chat]: " + text);
}

/* One to One Chat methods
----------------------------------------------------------*/
QBChat.prototype.connect = function(userID, userPass) {
	var _this = this;
	var userJID = this.getJID(userID);
	
	this.connection.connect(userJID, userPass, function(status) {
		switch (status) {
		case Strophe.Status.ERROR:
			traceChat('Error');
			break;
		case Strophe.Status.CONNECTING:
			traceChat('Connecting');
			break;
		case Strophe.Status.CONNFAIL:
			traceChat('Failed to connect');
			_this.onConnectFailed();
			break;
		case Strophe.Status.AUTHENTICATING:
			traceChat('Authenticating');
			break;
		case Strophe.Status.AUTHFAIL:
			traceChat('Unauthorized');
			_this.onConnectFailed();
			break;
		case Strophe.Status.CONNECTED:
			traceChat('Connected');
			_this.connection.addHandler(_this.onMessage, null, 'message', 'chat', null, null);
			_this.onConnectSuccess();
			break;
		case Strophe.Status.DISCONNECTING:
			traceChat('Disconnecting');
			_this.onConnectClosed();
			break;
		case Strophe.Status.DISCONNECTED:
			traceChat('Disconnected');
			break;
		case Strophe.Status.ATTACHED:
			traceChat('Attached');
			break;
		}
	});
};

QBChat.prototype.send = function(jid, body, type) {
	var params, msg;
	
	params = {
		to: jid,
		from: this.connection.jid,
		type: type
	};
	
	msg = $msg(params).c('body').t(body);
	this.connection.send(msg);
};

QBChat.prototype.disconnect = function() {
	this.connection.flush();
	this.connection.disconnect();
};

/* MUC methods
----------------------------------------------------------*/
QBChat.prototype.join = function(roomJid, nick) {
	this.connection.muc.join(roomJid, nick, this.onMessage, this.onPresence, this.onRoster);
};

QBChat.prototype.leave = function(roomJid, nick) {
	this.connection.muc.leave(roomJid, nick);
};

QBChat.prototype.createRoom = function(roomName, nick) {
	var _this = this;
	var roomJid = QB.session.application_id + '_' + roomName + '@' + this.config.muc;
	this.newRoom = roomJid;
	var pres =	$pres({"from": this.connection.jid, "to": roomJid + "/" + nick}).c("x", {"xmlns": Strophe.NS.MUC});
	this.connection.send(pres);
	
	setTimeout(function() {
		_this.connection.muc.createInstantRoom(roomJid,
		                                      function() {
		                                        console.log('Room created');
	                                            _this.connection.muc.configure(roomJid, handlerNEW, errorNEW);
	                                            console.log('Room !! OK');
		                                      },
		                                      function() {
		                                      	console.log('Room created error');
		                                      });
	}, 1 * 1000);
	
	function handlerNEW(config) {
		console.log('Room config set');
		$(config).find('field[var="muc#roomconfig_persistentroom"]').find('value').text(1);
		console.log($(config).find('field[var="muc#roomconfig_persistentroom"]')[0]);
		var arr = [$(config).find('field[var="muc#roomconfig_persistentroom"]')[0]];
		_this.connection.muc.saveConfiguration(roomJid, arr, successNEW, errorNEW);
	}
	
	function errorNEW(test) {
		console.log('errorNEW');
		console.log('test');
	}
	
	function successNEW(config) {
		console.log('Room config save complete');
	}
};

QBChat.prototype.destroy = function(roomName) {
	console.log('destroy');
	var roomJid = QB.session.application_id + '_' + roomName + '@' + this.config.muc;
	var iq = $iq({"from": this.connection.jid, "to": roomJid, "type": 'set'})
	         .c("query", {"xmlns": "http://jabber.org/protocol/muc#owner"})
	         .c('destroy').c('reason').t('Sorry, this room was removed');
	this.connection.send(iq);
};

QBChat.prototype.invite = function(receiver) {
	console.log('invite');
	var userJID = this.getJID(receiver);
	this.connection.muc.invite(this.newRoom, userJID);
};
