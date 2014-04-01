var params, chatUser, chatService;
var users = {
	Quick: '978815',
	Blox: '978816'
};

$(document).ready(function() {
	// Web SDK initialization
	QB.init(QBAPP.appID, QBAPP.authKey, QBAPP.authSecret);
	
	// creation of QuickBlox session
	QB.createSession(function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			$('#loginForm').modal({
				backdrop: 'static',
				keyboard: false
			});
			
			$('.panel-heading button').tooltip();
			updateTime();
			
			// events
			$('#loginForm button').click(login);
			$('#logout').click(logout);
			$('.sendMessage').click(sendMessage);
		}
	});
	
	window.onresize = function() {
		changeHeightChatBlock();
	};
});

function login() {
	$('#loginForm button').hide();
	$('#loginForm .progress').show();
	
	params = {
		login: $(this).val(),
		password: '123123123' // default password
	};
	
	// authentication of chat user
	QB.login(params, function(err, result) {
		if (err) {
			onConnectFailed();
			console.log(err.detail);
		} else {
			chatUser = result;
			chatUser.pass = params.password;
			
			connectChat();
		}
	});
}

function connectChat() {
	chatService = new QBChat({
		// set chat callbacks
		onConnectFailed: onConnectFailed,
		onConnectSuccess: onConnectSuccess,
		onConnectClosed: onConnectClosed,
		onChatMessage: onChatMessage,
		
		debug: false
	});
	
	// connect to QB chat service
	chatService.connect(chatUser.id, chatUser.pass);
}

function sendMessage(event) {
	event.preventDefault();
	var selector, message, receiver;
	
	selector = $(this).parents('form').find('input:text');
	message = selector.val();
	receiver = users[choseUser(chatUser.login)];
	
	// check if the user did not leave the empty field
	if (trim(message)) {
		// send of user message
		chatService.send(chatService.getJID(receiver), message, 'chat');
		showMessage(chatUser.login, new Date().toISOString(), message);
		selector.val('');
	}
}

function logout() {
	// close the connection
	chatService.disconnect();
}

/* Callbacks
----------------------------------------------------------*/
function onConnectFailed() {
	$('#loginForm .progress').hide();
	$('#loginForm button').show();
}

function onConnectSuccess() {
	var opponent = choseUser(chatUser.login);
	$('#loginForm').modal('hide');
	$('#wrap').show();
	$('.chat .user-list').html('<li class="list-group-item"><span class="glyphicon glyphicon-user"></span> ' + opponent + '</li>');
	$('.chat .messages').empty();
	$('.chat input:text').focus().val('');
	$('.opponent').text(opponent);
	changeHeightChatBlock();
}

function onConnectClosed() {
	$('#wrap').hide();
	$('#loginForm').modal('show');
	$('#loginForm .progress').hide();
	$('#loginForm button').show();
	
	chatService = null;
	chatUser = null;
}

function onChatMessage(nick, type, time, message) {
	var userName;
	
	$(Object.keys(users)).each(function() {
		if (users[this] == nick)
			userName = this;
	});
	
	showMessage(userName, time, message);
}

function showMessage(userName, time, message) {
	var html, selector = $('.chat .messages');
	
	html = '<section class="message">';
	html += '<header><b>' + userName + '</b>';
	html += '<time datetime="' + time + '">' + $.timeago(time) + '</time></header>';
	html += '<div class="message-description">' + chatService.parser(message) + '</div></section>';
	
	selector.append(html);
	selector.find('.message:even').addClass('white');
	selector.scrollTo('*:last', 0);
}
