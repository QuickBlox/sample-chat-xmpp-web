/**
 * QuickBlox Chat library
 * version 0.2.0
 *
 * Author: Andrey Povelichenko (andrey.povelichenko@quickblox.com)
 *
 */

var QBCHAT_CONFIG = {
	server: 'chat.quickblox.com',
	bosh: 'http://chat.quickblox.com:5280'
};

function QBChat(userID, userPass, logs) {
	var _this = this;
	
	this.onConnectFailed = null;
	this.onConnectSuccess = null;
	this.onConnectClosed = null;
	this.onMessageReceived = null;
	
	this.getJID = function(id) {
		return id + "-" + QB.session.application_id + "@" + QBCHAT_CONFIG.server;
	};
	
	this.jid = this.getJID(userID);
	this.pass = userPass;
	
	this.connection = new Strophe.Connection(QBCHAT_CONFIG.bosh);
	if (logs && logs.debug) {
		this.connection.rawInput = function(data) {console.log('RECV: ' + data)};
		this.connection.rawOutput = function(data) {console.log('SENT: ' + data)};
	}
	
	this.onMessage = function(msg) {
		traceC('Message');
		var author, message;
		
		author = $(msg).attr('from');
		message = $(msg).find('body').context.textContent;
		
		_this.onMessageReceived(author, message);
		
		return true;
	};
}

QBChat.prototype.connect = function() {
	var _this = this;
	
	this.connection.connect(this.jid, this.pass, function (status) {
		switch (status) {
		case Strophe.Status.ERROR:
			traceC('Error');
			break;
		case Strophe.Status.CONNECTING:
			traceC('Connecting');
			break;
		case Strophe.Status.CONNFAIL:
			traceC('Failed to connect');
			_this.onConnectFailed();
			break;
		case Strophe.Status.AUTHENTICATING:
			traceC('Authenticating');
			break;
		case Strophe.Status.AUTHFAIL:
			traceC('Unauthorized');
			_this.onConnectFailed();
			break;
		case Strophe.Status.CONNECTED:
			traceC('Connected');
			_this.connection.addHandler(_this.onMessage, null, 'message', 'chat', null, null);
			_this.onConnectSuccess();
			break;
		case Strophe.Status.DISCONNECTING:
			traceC('Disconnecting');
			_this.onConnectClosed();
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
	this.connection.send(msg);
};

/*QBChat.prototype.disconnect = function() {
	this.connection.flush();
	this.connection.disconnect();
};*/
	
//connection.muc.join(CHAT.roomJID, chatUser.qbID, getMessage, getPresence, getRoster);


function traceC(text) {
	console.log("[qb_chat]: " + text);
}
