/**
 * QuickBlox Chat library
 * version 0.1.0
 *
 * Author: Andrey Povelichenko (andrey.povelichenko@quickblox.com)
 *
 */

var QBCHAT_CONFIG = {
	server: 'chat.quickblox.com',
	bosh: 'http://chat.quickblox.com:5280'
};

function QBChat(appID, debug) {
	var _this = this;
	
	this.onFailed = null;
	this.onConnected = null;
	this.onDisconnected = null;
	this.onMessageReceived = null;
	
	this.conn = new Strophe.Connection(QBCHAT_CONFIG.bosh);
	if (debug) {
		this.conn.rawInput = function(data) {console.log('RECV: ' + data)};
		this.conn.rawOutput = function(data) {console.log('SENT: ' + data)};
	}
	
	this.onMessage = function(msg) {
		traceC('Message');
		var author, message;
		
		author = $(msg).attr('from');
		message = $(msg).find('body').context.textContent;
		
		_this.onMessageReceived(author, message);
		
		return true;
	};
	
	// helpers
	this.getJID = function(id) {
		return id + "-" + appID + "@" + QBCHAT_CONFIG.server;
	};
}

QBChat.prototype.connect = function(id, pass) {
	var _this = this;
	this.jid = this.getJID(id);
	
	this.conn.connect(this.jid, pass, function (status) {
		switch (status) {
		case Strophe.Status.ERROR:
			traceC('Error');
			break;
		case Strophe.Status.CONNECTING:
			traceC('Connecting');
			break;
		case Strophe.Status.CONNFAIL:
			traceC('Failed to connect');
			_this.onFailed();
			break;
		case Strophe.Status.AUTHENTICATING:
			traceC('Authenticating');
			break;
		case Strophe.Status.AUTHFAIL:
			traceC('Unauthorized');
			_this.onFailed();
			break;
		case Strophe.Status.CONNECTED:
			traceC('Connected');
			_this.conn.addHandler(_this.onMessage, null, 'message', 'chat', null, null);
			_this.onConnected();
			break;
		case Strophe.Status.DISCONNECTING:
			traceC('Disconnecting');
			_this.onDisconnected();
			break;
		case Strophe.Status.DISCONNECTED:
			traceC('Disconnected');
			break;
		case Strophe.Status.ATTACHED:
			traceC('Attached');
			break;
		}
	});
};

QBChat.prototype.send = function(jid, msg) {
	var params = {
		to: jid,
		from: this.jid,
		type: 'chat'
	}
	
	msg = $msg(params).c('body').t(msg);
	this.conn.send(msg);
};

/*QBChat.prototype.disconnect = function() {
	this.conn.flush();
	this.conn.disconnect();
};*/
	
//connection.muc.join(CHAT.roomJID, chatUser.qbID, getMessage, getPresence, getRoster);


function traceC(text) {
	console.log("[qb_chat]: " + text);
}
