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
		}
	});
	
	window.onresize = function() {
		var heightPanelHeaderAndPadding = 90;
		$('.panel-body').height(this.innerHeight - heightPanelHeaderAndPadding);
	};
	
	window.onbeforeunload = function() {
		if (chatService) {
				$.ajax({
					async: false,
							url:	QB.config.urls.base + QB.config.urls.users + '/' + chatUser.id + QB.config.urls.type,
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
	var msg;
	
	if (event.type == 'keydown' && event.keyCode == 13 && !event.shiftKey) {
		msg = $(this).val();
		send();
		return false;
	} else if (event.type == 'click') {
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
	chatService.leave(QBAPP.publicRoom, chatUser.login);
	chatService.disconnect();
}

/* Callbacks
----------------------------------------------------------*/
function onConnectFailed() {
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
}

function onConnectSuccess() {
	var heightPanelHeaderAndPadding = 90;
	$('.panel-body').height(window.innerHeight - heightPanelHeaderAndPadding);
	
	$('#loginForm').modal('hide');
	$('#wrap').show();
	$('.sendMessage').focus();
	
	chatService.join(QBAPP.publicRoom, chatUser.login);
	setTimeout(function() {$('.loading').remove()}, 2 * 1000);
}

function onConnectClosed() {
	$('#wrap').hide();
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
	$('#nickname').val('');
	$('.message-wrap').html('<img src="images/loading.gif" alt="loading" class="loading">');
	$('#loginForm').modal('show');
	
	QB.users.delete(chatUser.id, function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			chatService = null;
			chatUser = null;
		}
	});
}

function onChatMessage(author, message, createTime) {
	var html, time = new Date().toISOString();
	
	html = '<section class="message white">';
	html += '<header><b>' + chatService.getIDFromResource(author) + '</b> ';
	html += '<time datetime="' + createTime + '">' + $.timeago(createTime) + '</time>';
	html += '</header><div class="message-description">' + parser(message) + '</div></section>';
	
	if (createTime < time)
		$('.chat .service-message').addClass('hidden');
	
	$('.loading').remove();
	$('.chat .message-wrap').append(html);
	$('.chat .message').removeClass('white');
	$('.chat .message:even').addClass('white');
	$('.chat .message-wrap').scrollTo('*:last', 0);
}

function onMUCPresence(author, type, time) {
	if (type) {
		$('.chat .message-wrap').append('<section class="service-message bg-warning text-danger" data-time="' + time + '">' + author + ' has left this chat.</section>');
	} else {
		$('.chat .message-wrap').append('<section class="service-message bg-warning text-success" data-time="' + time + '">' + author + ' has joined the chat.</section>');
	}
	$('.chat .service-message:last').fadeTo(500, 1);
	$('.chat .message-wrap').scrollTo('*:last', 0);
}

function onMUCRoster(users, room) {
	//console.log(users);
	var occupants = Object.keys(users);
	$('.users .list-group').html('');
	$(occupants).each(function() {
		$('.users .list-group').append('<a href="#" class="list-group-item"><span class="glyphicon glyphicon-user"></span> ' + this + '</a>');
	});
}

/* Helper Functions
----------------------------------------------------------*/
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

function updateTime() {
	$('.message time').timeago().removeAttr('title');
	setTimeout(updateTime, 60 * 1000);
}

function parser(str) {
	var URL_REGEXP = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
	return str.replace(URL_REGEXP, function(match) {
		url = (/^[a-z]+:/i).test(match) ? match : 'http://' + match;
		url_text = match;
		return '<a href="' + escapeHTML(url) + '" target="_blank">' + escapeHTML(url_text) + '</a>';
	});
	
	function escapeHTML(s) {
		return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}
}
