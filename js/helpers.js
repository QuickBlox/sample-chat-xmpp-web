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
	var outerHeightControls = 42;
	$('.panel-body').height(window.innerHeight - outerHeightWrapHeader);
	$('.messages').height(window.innerHeight - outerHeightWrapHeader - outerHeightControls);
}

function choseSelector(id) {
	return $('#chat-public').add('#chat-' + id);
}

function choseUser(login) {
	return login == 'Quick' ? 'Blox' : 'Quick';
}