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
	$('#chats-wrap').on('keydown', '.sendMessage', sendMessage);
	
	window.onresize = function() {
		$('.panel-body').height(this.innerHeight - 80);
	}
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
		$('#loginForm .progress').show();
		
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
	chatService = new QBChat(chatUser.id, chatUser.pass, {debug: false});
	chatService.onConnectFailed = onConnectFailed;
	chatService.onConnectSuccess = onConnectSuccess;
	chatService.onConnectClosed = onConnectClosed;
	chatService.onChatMessage = onChatMessage;
	chatService.onChatRoster = onChatRoster;
	chatService.onChatPresence = onChatPresence;
	
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
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
}

function onConnectSuccess() {
	$('.panel-body').height(window.innerHeight - 80);
	$('#loginForm').modal('hide');
	$('#wrap').show();
	
	chatService.join(QBAPP.publicRoom, chatUser.login);
	
	QB.createSession({login: chatUser.login, password: chatUser.pass}, function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			//console.log(result);
		}
	});
}

function onConnectClosed() {
	$('.show').show();
	$('.hidden').hide();
}

function onChatRoster(users, room) {
	//console.log(users);
	var occupants = Object.keys(users);
	$('.users .list-group').html('');
	$(occupants).each(function() {
		$('.users .list-group').append('<a href="#" class="list-group-item"><span class="glyphicon glyphicon-user"></span> ' + this + '</a>');
	});
}

function onChatPresence(author, message) {
	//console.log(author);
}

function onChatMessage(author, message) {
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
