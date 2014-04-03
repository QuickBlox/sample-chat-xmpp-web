var params, chatUser = {}, chatService;

// Storage QB user ids by their logins
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
			chatUser.id = result.id;
			chatUser.login = params.login;
			chatUser.pass = params.password;
			
			connectChat();
		}
	});
}

function connectChat() {
	// setting parameters of Chat object
	params = {
		onConnectFailed: onConnectFailed,
		onConnectSuccess: onConnectSuccess,
		onConnectClosed: onConnectClosed,
		onChatMessage: onChatMessage,
		
		debug: false
	};
	
	chatService = new QBChat(params);
	
	// connect to QB chat service
	chatService.connect(chatUser);
}

function sendMessage(event) {
	event.preventDefault();
	var elem, message, recipientID;
	
	elem = $(this).parents('form').find('input:text');
	message = elem.val();
	
	// check if the user did not leave the empty field
	if (trim(message)) {
		recipientID = users[chooseOpponent(chatUser.login)];
		
		// send of user message
		chatService.sendMessage(recipientID, message, 'chat');
		
		showMessage(chatUser.login, message, new Date().toISOString());
		elem.val('');
	}
}

function showMessage(nick, message, time) {
	var html, selector = $('.chat .messages');
	
	html = '<section class="message">';
	html += '<header><b>' + nick + '</b>';
	html += '<time datetime="' + time + '">' + $.timeago(time) + '</time></header>';
	html += '<div class="message-description">' + QBChatHelpers.parser(message) + '</div></section>';
	
	selector.append(html);
	selector.find('.message:even').addClass('white');
	selector.scrollTo('*:last', 0);
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
	var opponent = chooseOpponent(chatUser.login);
	
	$('#loginForm').modal('hide');
	$('#wrap').show();
	$('.panel-title .opponent').text(opponent);
	$('.chat .chat-user-list').html('<li class="list-group-item"><span class="glyphicon glyphicon-user"></span> ' + opponent + '</li>');
	$('.chat .messages').empty();
	$('.chat input:text').focus().val('');
	changeHeightChatBlock();
	
	// create a timer that will send presence each 60 seconds
	chatService.startAutoSendPresence(60);
}

function onConnectClosed() {
	$('#wrap').hide();
	$('#loginForm').modal('show');
	$('#loginForm .progress').hide();
	$('#loginForm button').show();
	
	chatUser = {};
	chatService = null;
}

function onChatMessage(senderID, type, time, message) {
	var nick;
	
	// choose the nick by QB user id
	$(Object.keys(users)).each(function() {
		if (users[this] == senderID)
			nick = this;
	});
	
	showMessage(nick, message, time);
}
