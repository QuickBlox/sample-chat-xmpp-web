var params, chatService, roomName;

var chatUser = {
	id: 999190,
	login: 'Quick',
	pass: '123123123'
};

$(document).ready(function() {
	// Web SDK initialization
	QB.init(QBAPP.appID, QBAPP.authKey, QBAPP.authSecret);
	
	// QuickBlox session creation
	QB.createSession({login: chatUser.login, password: chatUser.pass}, function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			$('#loginForm').modal({
				backdrop: 'static',
				keyboard: false
			});
			
			$('.tooltip-title').tooltip();
			
			// events
			$('#createRoom').click(createRoom);
			$('#logout').click(logout);
			$('#search').click(search);
			$('#addUsers').click(addUsers);
			$('#deleteUsers').click(deleteUsers);
		}
	});
	
	window.onresize = function() {
		changeHeightChatBlock();
	};
});

function createRoom(event) {
	event.preventDefault();
	roomName = $('#roomName').val();
	
	// check if user did not leave the empty field
	if (trim(roomName)) {
		$('#loginForm form').hide();
		$('#loginForm .progress').show();
		
		params = {
			onConnectFailed: onConnectFailed,
			onConnectSuccess: onConnectSuccess,
			onConnectClosed: onConnectClosed,
			onChatMessage: onChatMessage,
			onMUCPresence: onMUCPresence,
			
			debug: true
		};
		
		chatService = new QBChat(params);
		
		// connect to QB chat service
		chatService.connect(chatUser);
	}
}

function logout() {
	chatService.leave(roomName);
	chatService.disconnect();
}

/* Callbacks
----------------------------------------------------------*/
function onConnectFailed() {
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
}

function onConnectSuccess() {
	$('.col-search .alert, .col-occupants .well').show();
	$('.col-search .well, .col-occupants .alert').hide();
	$('.col-occupants .list-group').html('<li class="list-group-item checkbox"><label><input type="checkbox">Quick</label></li>');
	$('.col-occupants .list-group').append('<li class="list-group-item checkbox"><label><input type="checkbox">Blox</label></li>');
	$('.occupant-count').text('2');
	changeHeightChatBlock();
	
	// Make the title
	$('.panel-title').text(roomName + ' (' + QBChatHelpers.getRoom(roomName) + ')');
	
	// create a timer that will send presence each 60 seconds
	chatService.startAutoSendPresence(60);
	
	params = {
		room: roomName,
		membersOnly: true,
		persistent: false
	};
	
	chatService.createRoom(params, function(err, result) {
		if (result) {
			$('#loginForm').modal('hide');
			$('#wrap').show();
			chatService.addUsers({room: roomName, users: [951337]}, function(err, result) {
				if (result) {
					console.log(result);
				}
			});
		}
	});
}

function onConnectClosed() {
	$('#wrap').hide();
	$('#loginForm').modal('show');
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
	$('#roomName').focus().val('');
	chatService = null;
}

function onChatMessage(nick, presence) {}
function onMUCPresence(nick, message) {}
