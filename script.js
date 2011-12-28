if (!thinkup_api_url) {
	thinkup_api_url = installation_url + 'api/v1/post.php';
}
var currentDate = new Date();
// TODO Use Date objects and just convert them to strings when required
// TODO Create Date() to Thinkup date style string
var untilDate = (currentDate.getFullYear()+"-"+(currentDate.getMonth()+1)+"-"+currentDate.getDate()+" "+currentDate.getHours()+":"+currentDate.getMinutes()+":"+currentDate.getSeconds());
var fromDate = (currentDate.getFullYear()+"-"+(currentDate.getMonth()+1)+"-"+(currentDate.getDate())+" 00:00:00");


// Document ready
$(document).ready(function() {
	// Load the timeline
	load_day();
}); // end of $(document).ready


function load_day() {
	fetch_timeline();
	fetch_mentions();
	return true;
};

function parse_timeline(record) {
	// Add the update to the document output
	var placeholder = document.createElement('div');
	placeholder.className = 'placeholder';
	var conversation = document.createElement('div');
	conversation.className = 'conversation';
	var update = document.createElement('div');
	update.className = 'update';
	var updateTime = (new Date(record.created_at)).toLocaleTimeString();

	// TODO create function to build the profile_image block
	$(update).append('<img src="'+record.user.profile_image_url+'" width=36 height=36 class="profile_image" title="@'+record.user.screen_name+'">');
	$(update).append('<p class="update_text">'+filter_text(record.text)+'</p>');
	$(conversation).append(update);
	// Check if there's a url associated with it.
	if(record.links) {
		var links = record.links;
		for (var i=0; i < links.length; i++) {
			process_links(update, links[i]);
		};
	}
	// Check if there are replies
	if(record.replies) {
		$.each(record.replies, function(i, record){
			var reply = document.createElement('div');
			reply.className = 'reply';
			$(reply).append('<p class="reply_text">'+filter_text(record.text)+'</p>');
			$(reply).append('<p class="reply_screen_name">'+filter_text('@'+record.user.screen_name)+'</p>')
			$(reply).append('<a href="http://www.twitter.com/'+record.user.screen_name+'">'+'<img src="'+record.user.profile_image_url+'" width=36 height=36 class="profile_image_reply" title="@'+record.user.screen_name+'"></a>');
			$(conversation).append(reply);
			// Check if there's a url associated with it.
			if(record.links) {
				var links = record.links;
				for (var i=0; i < links.length; i++) {
					process_links(reply, links[i]);
				};
			}
		});
	}
	$(placeholder).append('<div class="updateTime">'+updateTime+'</div>');
	$(placeholder).append(conversation);
	$("#timeline").append(placeholder);
};

function fetch_timeline() {
	$.getJSON(thinkup_api_url,
	{
		type: "user_posts_in_range",
		include_replies: 1,
		username: twitterUser,
		from: fromDate,
		until: untilDate

	},
	function(data) {
		for (var i = 0; i < data.length; i++) {
			record = data[i];
			parse_timeline(record);
		};	
	}
	);
};

function process_links(update, link) {
	$.embedly(
		link.expanded_url,
	    { 
			maxWidth: 300,
			maxHeight: 400,
			key: embedly_key,
	        success: function(oembed, dict){
							// test the contents returned
							if(oembed.html) {
								$(update).append("<br/>"+oembed.html);
							}
							else {
								if(oembed.title) {
									$(update).append('<br/><a href="'+oembed.url+'">'+oembed.title+'</a><br/>');
								}
								if(oembed.description) {
									$(update).append('<p class="link_description">'+oembed.description+"</p>");
								}
								if(oembed.thumbnail_url) {
									// Thumbnails aren't subject to the maxWidth parameter in the embedly call above so scale the image
									var scaledWidth = oembed.thumbnail_width;
									var scaledHeight = oembed.thumbnail_height;
									if(oembed.thumbnail_width > 300) {
										scaledWidth = 300;
										scaledHeight = oembed.thumbnail_height*(300/oembed.thumbnail_width);
									}
									$(update).append('<img src="'+oembed.thumbnail_url+'" width='+scaledWidth+' height='+scaledHeight+'>');
								}
							}
			}

	});	
}

function fetch_mentions() {
	$.getJSON(thinkup_api_url,
	{
		type: "user_mentions",
		username: "tisJames",
		count: 40,
		include_rts: 1,
		include_replies: 0,
		page: 1
	},
	function(data) {
		for (var i = 0; i < data.length; i++) {
			record = data[i];
			parse_mentions(record);
		};	
	}
	);
};

function parse_mentions(record) {

	var updateTime = (new Date(record.created_at)).toLocaleTimeString();
	// Want freestanding mentions; replies are caught in the main timeline
	if(!record.in_reply_to_post_id && ((new Date(record.created_at)) > (new Date(fromDate)))) {
		var mention = document.createElement('div');
		mention.className = 'mention';
		var placeholder = document.createElement('div');
		placeholder.className = 'placeholder';
		$(placeholder).append('<div class="updateTime">'+updateTime+'</div>');
		$(mention).append('<p class="reply_text">'+record.text+'</p>');
		$(mention).append('<p class="reply_screen_name">@'+record.user.screen_name+'</p>')
		$(mention).append('<img src="'+record.user.profile_image_url+'" width=36 height=36 class="profile_image_reply" title="@'+record.user.screen_name+'">');
		$(placeholder).append(mention);
	
	}
	$("#mentions").append(placeholder);

};

function filter_text(input) {
	input = input.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,"<a href='$1'>$1</a>");
	input = input.replace(/(^|\s)@(\w+)/g, "$1<a href='http://www.twitter.com/$2'>@$2</a>");
	input = input.replace(/(^|\s)#(\w+)/g, "$1<a href='http://search.twitter.com/search?q=%23$2'>#$2</a>");
	return input;
};
