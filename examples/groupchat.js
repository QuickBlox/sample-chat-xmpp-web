var params, chatUser, chatService;

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
			
			$('.tooltip-title').tooltip();
			updateTime();
			
			// events
			$('#login').click(login);
			$('#logout').click(logout);
			$('.sendMessage').click(sendMessage);
		}
	});
	
	window.onresize = function() {
		changeHeightChatBlock();
	};
	
	// delete chat user if window has been closed
	window.onbeforeunload = function() {
		if (chatUser) {
			$.ajax({
				async: false,
				url: QB.config.urls.base + QB.config.urls.users + '/' + chatUser.id + QB.config.urls.type,
				type: 'DELETE',
				beforeSend: function(jqXHR, settings) {
					jqXHR.setRequestHeader('QB-Token', QB.session.token);
				}
			});
		}
	};
});

function login(event) {
	event.preventDefault();
	
	params = {
		login: $('#nickname').val(),
		password: '123123123' // default password
	};
	
	// check if user did not leave the empty field
	if (trim(params.login)) {
		$('#loginForm form').hide();
		$('#loginForm .progress').show();
		
		// chat user creation
		QB.users.create(params, function(err, result) {
			if (err) {
				onConnectFailed();
				alertErrors(err);
			} else {
				chatUser = {
					id: result.id,
					login: params.login,
					pass: params.password
				};
				
				// chat user authentication
				QB.login(params, function(err, result) {
					if (err) {
						onConnectFailed();
						alertErrors(err);
					} else {
						connectChat();
					}
				});
			}
		});
	}
}

function connectChat() {
	params = {
		// set chat callbacks
		onConnectFailed: onConnectFailed,
		onConnectSuccess: onConnectSuccess,
		onConnectClosed: onConnectClosed,
		onChatMessage: onChatMessage,
		
		// set MUC callbacks
		onMUCPresence: onMUCPresence,
		onMUCRoster: onMUCRoster,
		
		debug: false
	};
	
	chatService = new QBChat(params);
	
	// connect to QB chat service
	chatService.connect(chatUser);
}

function sendMessage(event) {
	event.preventDefault();
	var text, message;
	
	text = $('.chat input:text').val();
	
	// check if user did not leave the empty field
	if (trim(text)) {
		message = {
			body: text,
			type: 'groupchat',
		};
		
		// send user message
		chatService.sendMessage(QBAPP.publicRoom, message);
		$('.chat input:text').val('');
	}
}

function logout() {
	// leave the public room
	chatService.leave(QBAPP.publicRoom);
	// close the connection
	chatService.disconnect();
}

/* Callbacks
----------------------------------------------------------*/
function onConnectFailed() {
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
}

function onConnectSuccess() {
	$('#loginForm').modal('hide');
	$('#wrap').show();
	$('.chat .chat-user-list').html('');
	$('.chat .messages').html('<img src="../images/loading.gif" alt="loading" class="loading">');
	$('.chat input:text').focus().val('');
	changeHeightChatBlock();
	
	// join to Public Room by default
	chatService.join(QBAPP.publicRoom, chatUser.login);
	
	// create a timer that will send presence each 60 seconds
	chatService.startAutoSendPresence(60);
	
	setTimeout(function() { $('.loading').remove() }, 2 * 1000);
}

function onConnectClosed() {
	$('#wrap').hide();
	$('#loginForm').modal('show');
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
	$('#nickname').focus().val('');
	
	// delete chat user
	QB.users.delete(chatUser.id, function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			chatUser = null;
			chatService = null;
		}
	});
}

function onChatMessage(nick, message) {
	var html, selector = $('.chat .messages');
	
	html = '<section class="message">';
	html += '<header><b>' + nick + '</b>';
	html += '<time datetime="' + message.time + '">' + $.timeago(message.time) + '</time></header>';
	html += '<div class="message-description">' + QBChatHelpers.parser(message.body) + '</div></section>';
	
	// hide old presences
	if (message.time < selector.find('.service-message:last').data('time'))
		selector.find('.service-message').addClass('hidden');
	
	$('.loading').remove();
	
	selector.append(html);
	selector.find('.message:even').addClass('white');
	selector.scrollTo('*:last', 0);
}

function onMUCPresence(nick, presence) {
	var selector = $('.chat .messages');
	
	if (presence.type === 'unavailable')
		selector.append('<div class="service-message bg-warning text-danger" data-time="' + presence.time + '">' + nick + ' has left this chat.</div>');
	else
		selector.append('<div class="service-message bg-warning text-success" data-time="' + presence.time + '">' + nick + ' has joined the chat.</div>');
	
	selector.find('.service-message:last').fadeTo(500, 1);
	selector.scrollTo('*:last', 0);
}

function onMUCRoster(users, room) {
	var occupants = Object.keys(users);
	var selector = $('.chat .chat-user-list');
	
	// filling of user list
	selector.html('');
	$(occupants).each(function(i) {
		selector.append('<a href="#" class="list-group-item btn"><span class="glyphicon glyphicon-user"></span> ' + this + '</a>');
		
		// disable current user's element
		if (occupants[i] === chatUser.login)
			selector.find('.list-group-item:last').addClass('disabled');
	});
}
