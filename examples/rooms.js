var params, chatService, roomName, accountUsers = {}, roomUsers = {};

var chatUser = {
	id: 999190,
	login: 'Quick',
	pass: '123123123'
};

var accountOwner = 951337;

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
			
			$('.col-search .users').on('click', 'input:checkbox', function() {
				if (this.checked) {
					accountUsers[$(this).data('id')] = $(this).data('name');
				} else {
					delete accountUsers[$(this).data('id')];
				}
				console.log(accountUsers);
			});
			$('.col-occupants .users').on('click', 'input:checkbox', function() {
				if (this.checked) {
					roomUsers[$(this).data('id')] = $(this).data('name');
				} else {
					delete roomUsers[$(this).data('id')];
				}
				console.log(roomUsers);
			});
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
			
			debug: true
		};
		
		chatService = new QBChat(params);
		
		// connect to QB chat service
		chatService.connect(chatUser);
	}
}

function search() {
	var name, html = '';
	
	$('.col-search .alert, .col-search .users').hide();
	$('.col-search .col-content').append('<img src="../images/search-loading.gif" alt="loading" class="loading search-loading">');
	
	QB.users.listUsers({perPage: 100}, function(err, result) {
		if (err) {
			console.log(err.detail);
		} else {
			$(result.items).each(function() {
				// check if user is not owner
				if (this.user.id != accountOwner && this.user.id != chatUser.id) {
					name = this.user.full_name || this.user.login;
					html += '<li class="list-group-item checkbox"><label><input type="checkbox" data-id="' + this.user.id + '" data-name="' + name + '">' + name + '</label></li>';
				}
			});
			
			$('.col-search .list-group').html(html);
			$('.col-search .loading').remove();
			$('.col-search #search').hide();
			$('.col-search .users, .col-occupants .alert').show();
			$('.col-occupants .overlay').hide();
			$('.col-occupants h4').show();
		}
	});
}

function addUsers() {
	var html = '';
	if (Object.keys(accountUsers).length > 0) {
		chatService.addMembers({room: roomName, users: Object.keys(accountUsers)}, function(err, result) {
			if (result) {
				console.log(result);
				$(Object.keys(accountUsers)).each(function() {
					html += '<li class="list-group-item checkbox"><label><input type="checkbox" data-id="' + this + '" data-name="' + accountUsers[this] + '">' + accountUsers[this] + '</label></li>';
					$('.col-search input[data-id=' + this + ']').parents('li').hide();
				});
				$('.col-occupants .users').show().find('ul').append(html);
				$('.col-occupants .alert').hide();
				$('.col-occupants .occupant-count').text($('.col-occupants .users li').length);
				
				$('.col-search input').attr('checked', false);
				accountUsers = {};
			}
		});
	}
}

function deleteUsers() {
	if (Object.keys(roomUsers).length > 0) {
		chatService.deleteMembers({room: roomName, users: Object.keys(roomUsers)}, function(err, result) {
			if (result) {
				console.log(result);
				$(Object.keys(roomUsers)).each(function() {
					$('.col-occupants input[data-id=' + this + ']').parents('li').remove();
					$('.col-search input[data-id=' + this + ']').parents('li').show();
				});
				$('.col-occupants .occupant-count').text($('.col-occupants .users li').length);
				
				roomUsers = {};
				
				if ($('.col-occupants .users li').length == 0) {
					$('.col-occupants .alert').show();
					$('.col-occupants .users').hide();
				}
			}
		});
	}
}

function logout() {
	chatService.leave(roomName);
	chatService.disconnect();
	
	accountUsers = {};
	roomUsers = {};
}

/* Callbacks
----------------------------------------------------------*/
function onConnectFailed() {
	$('#loginForm .progress').hide();
	$('#loginForm form').show();
}

function onConnectSuccess() {
	$('.col-search .alert').show();
	$('.col-search .users').hide();
	$('.col-search #search').show();
	$('.col-occupants .overlay').show();
	$('.col-occupants .occupant-count').text(0);
	$('.col-occupants h4, .col-occupants .users, .col-occupants .alert').hide();
	$('.col-occupants .users ul').html('');
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
		} else {
			alert(err);
			onConnectFailed();
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
