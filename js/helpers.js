/* Helper Functions
----------------------------------------------------------*/
function changeInputFileBehavior() {
	$('input:file').change(function() {
		var file = $(this).val();
		$('.attach').show().html('<span class="file">' + file + '<button type="button" class="close">&times;</button></span>');
	});
}

function updateTime() {
	$('.message time').timeago().removeAttr('title');
	setTimeout(updateTime, 60 * 1000);
}

function closeFile() {
	$('.attach').hide();
	$('input:file').val('');
}

function changeHeightChatBlock() {
	var outerHeightWrapHeader = 90;
	var outerHeightControls = 42;
	$('.panel-body').height(window.innerHeight - outerHeightWrapHeader);
	$('.messages').height(window.innerHeight - outerHeightWrapHeader - outerHeightControls);
}

function chooseOpponent(currentLogin) {
	return currentLogin == 'Quick' ? 'Blox' : 'Quick';
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
