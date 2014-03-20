var params, chatUser, chatService;

$(document).ready(function() {
	QB.init(QBAPP.appID, QBAPP.authKey, QBAPP.authSecret);
	QB.createSession(function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			$('#loginForm').modal({
				backdrop: 'static',
				keyboard: false
			});
		}
	});
	
	$('#loginSubmit').click(login);
});

function login(event) {
	event.preventDefault();
	
	params = {
		login: $('#nickname').val(),
		password: '123123123' // default password
	};
	
	if (!trim(params.login)) {
		alert('Nickname is required');
	} else {
		$('#loginForm form').hide();
		$('#loginForm .progress').removeClass('hidden');
		
		QB.users.create(params, function(err, result) {
			if (err) {
				onConnectFailed();
				alert(err.detail);
			} else {
				chatUser = result;
				chatUser.pass = params.password;
				connectChat();
			}
		});
	}
}

function connectChat() {
	chatService = new QBChat(chatUser.id, chatUser.pass);
	chatService.onConnectFailed = onConnectFailed;
	chatService.onConnectSuccess = onConnectSuccess;
	chatService.onConnectClosed = onConnectClosed;
	chatService.onMessageReceived = onMessageReceived;
	
	chatService.connect();
}

function sendMessage() {
	var msg = $('#message').val();
	chatService.send(opponent, msg);
}

function logout() {
	//chatService.disconnect();
	chatService.connection.sync = true;
	chatService.connection.flush();
	chatService.connection.disconnect();
}

/* callbacks
-------------------------------------------*/
function onConnectFailed() {
	$('#loginForm .progress').addClass('hidden');
	$('#loginForm form').show();
}

function onConnectSuccess() {
	$('.hidden').removeClass('hidden');
	$('#loginForm').modal('hide');
}

function onConnectClosed() {
	$('.show').show();
	$('.hidden').hide();
}

function onMessageReceived(author, message) {
	var html = '<div class="msg"><b>' + author + ': </b>';
	html += '<span>' + message + '</span></div>';
	$('#chat').append(html);
}

/* helper functions
-------------------------------------------*/
function trim(str) {
	if (str.charAt(0) == ' ')
		str = trim(str.substring(1, str.length));
	if (str.charAt(str.length-1) == ' ')
		str = trim(str.substring(0, str.length-1));
	return str;
}
