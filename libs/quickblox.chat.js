/**
 * QuickBlox Chat library
 * version 0.3.0
 *
 * Author: Andrey Povelichenko (andrey.povelichenko@quickblox.com)
 *
 */

function QBChat(params) {
	var _this = this;
	
	this.config = {
		server: 'chat.quickblox.com',
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
		traceChat('message');
		var author, message, createTime;
		
		author = $(stanza).attr('from');
		message = $(stanza).find('body').context.textContent;
		createTime = $(stanza).find('delay').attr('stamp') || new Date().toISOString();
		
		_this.onChatMessage(author, message, createTime);
		return true;
	};
	
	this.onPresence = function(stanza, room) {
		traceChat('Presence');
		var user, type, time, author;
		
		user = $(stanza).attr('from');
		type = $(stanza).attr('type');
		time = new Date().toISOString();
		author = _this.getIDFromResource(user);
		
		_this.onChatPresence(author, type, time);
		return true;
	};
	
	this.onRoster = function(users, room) {
		_this.onChatRoster(users, room);
		return true;
	};
	
	// helpers
	this.getJID = function(id) {
		return id + "-" + QB.session.application_id + "@" + _this.config.server;
	};
	
	this.getIDFromResource = function(jid) {
		return Strophe.unescapeNode(Strophe.getResourceFromJid(jid));
	};
	
	this.getIDFromNode = function(jid) {
		return Strophe.getNodeFromJid(jid).split('-')[0];
	};
}

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

QBChat.prototype.send = function(jid, msg, type) {
	var params = {
		to: jid,
		from: this.connection.jid,
		type: type
	};
	
	msg = $msg(params).c('body').t(msg);
	this.connection.send(msg);
};

QBChat.prototype.disconnect = function() {
	this.connection.flush();
	this.connection.disconnect();
};

QBChat.prototype.join = function(roomJid, nick) {
	this.connection.muc.join(roomJid, nick, this.onMessage, this.onPresence, this.onRoster);
};

QBChat.prototype.leave = function(roomJid, nick) {
	this.connection.muc.leave(roomJid, nick);
};

function traceChat(text) {
	console.log("[qb_chat]: " + text);
}
