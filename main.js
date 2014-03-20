var chat, opponent;

$(document).ready(function() {
	QB.init(QBAPP.appID, QBAPP.authKey, QBAPP.authSecret);
});

function login() {
	var params = {
		login: $('#login').val(),
		password: $('#password').val()
	};
	
	QB.createSession(params, function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			console.log(result);
			
			chat = new QBChat(QBAPP.appID, false);
			chat.onFailed = null;
			chat.onConnected = onConnected;
			chat.onDisconnected = onDisconnected;
			chat.onMessageReceived = onMessage;
			
			opponent = params.login == 'anryogo' ? chat.getJID(801348) : chat.getJID(386);
			chat.connect(result.user_id, params.password);
		}
	});
}

function onConnected() {
	$('.show').hide();
	$('.hidden').show();
}

function onDisconnected() {
	$('.show').show();
	$('.hidden').hide();
}

function onMessage(author, message) {
	var html = '<div class="msg"><b>' + author + ': </b>';
	html += '<span>' + message + '</span></div>';
	$('#chat').append(html);
}

function send() {
	var msg = $('#message').val();
	chat.send(opponent, msg);
}

function logout() {
	//chat.disconnect();
	chat.conn.sync = true;
	chat.conn.flush();
	chat.conn.disconnect();
}
