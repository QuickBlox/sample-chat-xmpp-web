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
	
	updateTime();
	
	$('#loginSubmit').click(login);
	$('.panel-chat').on('keydown', '.sendMessage', sendMessage);
	$('.panel-chat').on('click', '.btn-sendMessage', sendMessage);
	
	window.onresize = function() {
		$('.panel-body').height(this.innerHeight - 90);
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
				
				QB.createSession({login: chatUser.login, password: chatUser.pass}, function(err, result) {
					if (err) {
						onConnectFailed();
						alert(err.detail);
					} else {
						//console.log(result);
						connectChat();
					}
				});
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

function sendMessage(event) {
	var msg;
	
	if (event.type == 'keydown' && event.keyCode == 13 && !event.shiftKey) {
		msg = $(this).val();
		send();
		return false;
	} else if (event.type == 'click') {
		event.preventDefault();
		msg = $('.sendMessage').val();
		send();
	}
	
	function send() {
		if (trim(msg)) {
			chatService.send(QBAPP.publicRoom, msg, 'groupchat');
			$('.sendMessage').val('');
		}
	}
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
	$('.panel-body').height(window.innerHeight - 90);
	$('#loginForm').modal('hide');
	$('#wrap').show();
	
	chatService.join(QBAPP.publicRoom, chatUser.login);
	setTimeout(function() {$('.loading').remove()}, 2 * 1000);
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

function onChatMessage(author, message, createTime) {
	var html = '<section class="message white">';
	html += '<header><b>@' + chatService.getIDFromResource(author) + '</b> ';
	html += '<time datetime="' + createTime + '">' + $.timeago(createTime) + '</time>';
	html += '</header><div class="message-description">' + message + '</div></section>';
	
	$('.loading').remove();
	$('.chat .message-wrap').append(html);
	$('.chat .message').removeClass('white');
	$('.chat .message:even').addClass('white');
	$('.chat .message-wrap').scrollTo('*:last', 0);
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

function updateTime() {
	$('.message time').timeago().removeAttr('title');
	setTimeout(updateTime, 60 * 1000);
}
