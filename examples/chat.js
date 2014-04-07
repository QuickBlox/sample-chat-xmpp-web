var params, chatUser, chatService, recipientID;

// Storage QB user ids by their logins
var users = {
	Quick: '978815',
	Blox: '978816'
};

$(document).ready(function() {
	// Web SDK initialization
	QB.init(QBAPP.appID, QBAPP.authKey, QBAPP.authSecret);
	
	// QuickBlox session creation
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
			$('.chat input:text').keydown(startTyping);
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
	
	// chat user authentication
	QB.login(params, function(err, result) {
		if (err) {
			onConnectFailed();
			console.log(err.detail);
		} else {
			chatUser = {
				id: result.id,
				login: params.login,
				pass: params.password
			};
			
			connectChat();
		}
	});
}

function connectChat() {
	// set parameters of Chat object
	params = {
		onConnectFailed: onConnectFailed,
		onConnectSuccess: onConnectSuccess,
		onConnectClosed: onConnectClosed,
		onChatMessage: onChatMessage,
		onChatState: onChatState,

		debug: false
	};
	
	chatService = new QBChat(params);
	
	// connect to QB chat service
	chatService.connect(chatUser);
}

function startTyping() {
	if (chatUser.isTyping) return true;
	
	var message = {
		state: 'composing',
		type: 'chat',
		extension: {
			nick: chatUser.login
		}
	};
	
	// send 'composing' as chat state notification
	chatService.sendMessage(recipientID, message);
	
	chatUser.isTyping = true;
	setTimeout(stopTyping, 5 * 1000);
}

function stopTyping() {
	if (!chatUser.isTyping) return true;
	
	var message = {
		state: 'paused',
		type: 'chat',
		extension: {
			nick: chatUser.login
		}
	};
	
	// send 'paused' as chat state notification
	chatService.sendMessage(recipientID, message);
	
	chatUser.isTyping = false;
}

function sendMessage(event) {
	event.preventDefault();
	var elem, text, message, file, fileUID;
	
	elem = $(this).parents('form').find('input:text');
	text = elem.val();
	
	// check if user did not leave the empty field
	if (trim(text)) {
		file = $('input:file')[0].files[0];
		
		if (file) {
			QB.content.createAndUpload({file: file, 'public': true}, function(err, result) {
				if (err) {
					console.log(err.detail);
				} else {
					console.log(result);
					fileUID = result.uid;
					makeMessage();
				}
			});
		} else {
			makeMessage();
		}
	}
	
	function makeMessage() {
		stopTyping();
		
		message = {
			body: text,
			type: 'chat',
			extension: {
				nick: chatUser.login,
				fileUID: fileUID || null
			}
		};
		
		// send user message
		chatService.sendMessage(recipientID, message);
		
		showMessage(chatUser.login, text, new Date().toISOString());
		elem.val('');
	}
}

function showMessage(nick, message, time) {
	var html, selector = $('.chat .messages');
	
	html = '<section class="message">';
	html += '<header><b>' + nick + '</b>';
	html += '<time datetime="' + time + '">' + $.timeago(time) + '</time></header>';
	html += '<div class="message-description">' + QBChatHelpers.parser(message) + '</div></section>';
	
	if ($('.typing-message')[0])
		$('.typing-message').before(html);
	else
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
	
	recipientID = users[opponent];
	
	// create a timer that will send presence each 60 seconds
	chatService.startAutoSendPresence(60);
}

function onConnectClosed() {
	$('#wrap').hide();
	$('#loginForm').modal('show');
	$('#loginForm .progress').hide();
	$('#loginForm button').show();
	
	chatUser = null;
	chatService = null;
}

function onChatMessage(senderID, message) {
	console.log(message);
	showMessage(message.extension.nick, message.body, message.time);
	if (message.extension && message.extension.fileUID) {
		QB.content.getFile(message.extension.fileUID, function(err, result) {
			if (err) {
				console.log(err.detail);
			} else {
				console.log(result);
			}
		});
	}
}

function onChatState(senderID, message) {
	switch (message.state) {
	case 'composing':
		$('.chat .messages').append('<div class="typing-message">' + message.extension.nick + ' ...</div>');
		$('.chat .messages').scrollTo('*:last', 0);
		break;
	case 'paused':
		QBChatHelpers.removeTypingMessage($('.typing-message'), message.extension.nick);
		break;
	}
}
