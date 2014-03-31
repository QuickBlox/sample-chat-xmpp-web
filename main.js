var params, chatUser, chatService;

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
			
			$('.panel-heading .btn').tooltip();
			updateTime();
			
			// events
			$('#login').click(login);
			$('#addRoom').click(addRoom);
			$('#logout').click(logout);
			$('.chat-container').on('click', '.sendMessage', sendMessage);
			$('.chat-container').on('click', '.user-list a', createPrivateChat);
		}
	});
	
	window.onresize = function() {
		changeHeightChatBlock();
	};
	
	// deleting of chat user if window has been closed
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

function addRoom() {
	
}

function login(event) {
	event.preventDefault();
	
	params = {
		login: $('#nickname').val(),
		password: '123123123' // default password
	};
	
	// check if the user did not leave the empty field
	if (trim(params.login)) {
		$('#loginForm form').hide();
		$('#loginForm .progress').show();
		
		// creation of chat user
		QB.users.create(params, function(err, result) {
			if (err) {
				onConnectFailed();
				alertErrors(err);
			} else {
				chatUser = result;
				chatUser.pass = params.password;
				
				// authentication of chat user
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
	chatService = new QBChat({
		// set chat callbacks
		onConnectFailed: onConnectFailed,
		onConnectSuccess: onConnectSuccess,
		onConnectClosed: onConnectClosed,
		onChatMessage: onChatMessage,
		
		// set MUC callbacks
		onMUCPresence: onMUCPresence,
		onMUCRoster: onMUCRoster,
		
		debug: false
	});
	
	// connect to QB chat service
	chatService.connect(chatUser.id, chatUser.pass);
}

function sendMessage(event) {
	event.preventDefault();
	var selector = $(this).parents('form').find('input:text');
	var message = selector.val();
	
	// check if the user did not leave the empty field
	if (trim(message)) {
		// send of user message
		chatService.send(QBAPP.publicRoom, message, 'groupchat');
		selector.val('');
	}
}

function logout() {
	// leave the public room
	chatService.leave(QBAPP.publicRoom, chatUser.login);
	// close the connection
	chatService.disconnect();
}

/* Private chat
----------------------------------------------------------*/
function createPrivateChat(event) {
	event.preventDefault();
	var nick, qbID, chatID, selector;
	
	nick = $(this).data('nick');
	qbID = $(this).data('qb') || getQBUserID(nick);
	
	// get QB user by login
	QB.users.get({login: login}, function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			qbID = result.id;
		}
	});
	
	
	chatID = '#chat-' + qbID;
	
	// check if this chat has already exist
	if ($('.chat').is(chatID)) {
		$('.chat:visible').hide();
		$(chatID).show();
		
		selector = $(chatID).find('.messages');
		selector.scrollTo('*:last', 0);
		//deleteMessageCount(chatID.substring(1));
	} else {
		htmlChatBuilder(chatID, nick, qbID, true);
	}
}

function htmlChatBuilder(chatID, nick, qbID, isOwner) {
	var obj, html;
	
	html = '<a href="#" class="list-group-item list-group-item-info" data-id="' + chatID + '">';
	html += '<img src="images/glyphicons_245_chat.png" alt="icon"> ' + nick + '</a>';
	
	$('.chat-list a').removeClass('list-group-item-info');
	$('.chat-list').append(html);
	
	html = '<a href="#" class="list-group-item btn disabled" data-nick="' + chatUser.login + '"><span class="glyphicon glyphicon-user"></span> ' + chatUser.login + '</a>';
	html += '<a href="#" class="list-group-item btn" data-nick="' + nick + '"  data-qb="' + qbID + '"><span class="glyphicon glyphicon-user"></span> ' + nick + '</a>';
	
	if (isOwner) {
		$('#chat-public').hide().clone().show().insertAfter('.chat:last');
		obj = $('.chat:visible');
	} else {
		$('#chat-public').clone().hide().insertAfter('.chat:last');
		obj = $('.chat:last');
	}
	
	obj.attr('id', chatID.substring(1));
	obj.find('.user-list').html(html);
	obj.find('.messages').empty();
	obj.find('input:text').focus().val('');
	$('.panel-title').text(nick);
}

/* Callbacks
----------------------------------------------------------*/
function onConnectFailed() {
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
}

function onConnectSuccess() {
	$('#loginForm').modal('hide');
	$('#wrap, #chat-public').show();
	$('#chat-public .user-list').html('');
	$('#chat-public .messages').html('<img src="images/loading.gif" alt="loading" class="loading">');
	$('#chat-public input:text').focus().val('');
	changeHeightChatBlock();
	
	// join to Public Room by default
	chatService.join(QBAPP.publicRoom, chatUser.login);
	
	setTimeout(function() { $('.loading').remove() }, 2 * 1000);
}

function onConnectClosed() {
	$('#wrap').hide();
	$('.chat:not(#chat-public)').remove();
	$('.chat-list:not(:first)').remove();
	
	$('#loginForm').modal('show');
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
	$('#nickname').focus().val('');
	
	// deleting of chat user
	QB.users.delete(chatUser.id, function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			chatService = null;
			chatUser = null;
		}
	});
}

function onChatMessage(nick, type, time, message) {
	var html;
	var selector = choseSelector().find('.messages');
	
	html = '<section class="message">';
	html += '<header><b>' + nick + '</b>';
	html += '<time datetime="' + time + '">' + $.timeago(time) + '</time></header>';
	html += '<div class="message-description">' + message + '</div></section>';
	
	// hide the old presences
	if (time < selector.find('.service-message:last').data('time'))
		selector.find('.service-message').addClass('hidden');
	
	$('.loading').remove();
	
	selector.append(html);
	selector.find('.message:even').addClass('white');
	selector.scrollTo('*:last', 0);
}

function onMUCPresence(nick, type, time) {
	var selector = choseSelector().find('.messages');
	
	if (type == 'unavailable')
		selector.append('<section class="service-message bg-warning text-danger" data-time="' + time + '">' + nick + ' has left this chat.</section>');
	else
		selector.append('<section class="service-message bg-warning text-success" data-time="' + time + '">' + nick + ' has joined the chat.</section>');
	
	selector.find('.service-message:last').fadeTo(500, 1);
	selector.scrollTo('*:last', 0);
}

function onMUCRoster(users, room) {
	var occupants = Object.keys(users);
	var selector = choseSelector().find('.user-list');
	
	// filling of user list
	selector.html('');
	$(occupants).each(function(i) {
		selector.append('<a href="#" class="list-group-item btn" data-nick="' + this + '"><span class="glyphicon glyphicon-user"></span> ' + this + '</a>');
		
		// disable of current user's element
		if (occupants[i] == chatUser.login)
			selector.find('a:last').addClass('disabled');
	});
}

/* Helper Functions
----------------------------------------------------------*/
function updateTime() {
	$('.message time').timeago().removeAttr('title');
	setTimeout(updateTime, 60 * 1000);
}

function trim(str) {
	if (str.charAt(0) == ' ')
		str = trim(str.substring(1, str.length));
	if (str.charAt(str.length-1) == ' ')
		str = trim(str.substring(0, str.length-1));
	return str;
}

function alertErrors(err) {
	alert(JSON.stringify($.parseJSON(err.detail).errors));
}

function changeHeightChatBlock() {
	var outerHeightWrapHeader = 90;
	var outerHeightControls = 38;
	$('.panel-body').height(window.innerHeight - outerHeightWrapHeader);
	$('.messages').height(window.innerHeight - outerHeightWrapHeader - outerHeightControls);
}

function choseSelector(id) {
	return $('#chat-public').add('#chat-' + id);
}
