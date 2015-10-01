$(function() {
	
	//set the date and time
	
	
	getDateTime();
	setInterval(function() {
		getDateTime();
	}, 1000);
	
	//get the current bitcoin value, weather & news
	
	$('#news').append('<div id="ottawa-news" class="v">Ottawa news loading...</div>');
	$('#news').append('<div id="canada-news" class="v">Canada news loading...</div>');
	$('#news').append('<div id="world-news" class="v">World news loading...</div>');
	
	
	setInterval(function() {
		getHolidays();
	}, 1000*60*90);
	
	init();
	setInterval(function(){
		init();
		//getHolidays();
	}, 1000*60*5);
	
});

var authenticated = false;

var holidayToday = '';

//initialize content
function init() {
	getBtcStats();
	getWeather();
//	$('#weather').height('300px');
	getOttawaNews();
	getCanadaNews();
	getWorldNews();	
}

//get the bitcoin stats
function getBtcStats() {
	$.ajax({
		dataType: "json",	
		url: 'https://api.bitcoinaverage.com/ticker/CAD',
		crossOrigin: true,
		success: function(data){
			btcStats = $('#btc-stats')
			btcStats.html('<span></span>')
			btcStats.children('span').html('<h3>BTC - CAD Statistics</h3>')
			btcStats.children('span').append('last price: ' + data['last'] + '<br>');
			btcStats.children('span').append('bid: ' + data['bid'] + '<br>');
			btcStats.children('span').append('ask: ' + data['ask'] + '<br>');
		},
	});
}

function dateAppend(date) {
	var dateStr = date.toString();
	var append = 'th';
	if (dateStr.slice(-1) === '1') {
		append = 'st';
	} else if (dateStr.slice(-1) === '2') {
		append = 'nd';
	} else if (dateStr.slice(-1) === '3') {
		append = 'rd';
	}
	if (date === 11 || date === 12 || date === 13) {
		append = 'th';
	}
	return append;
}
//set the background image
function setBackground() {
	var date = new Date();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var hour = date.getHours();
	//var hour = 12;
	var specialBackground = false;
	
	if (holidayToday != '') {
		holidayList = []
		//console.log(holidayToday);
		for (holiday in holidayToday) {
			//console.log(holidayToday[holiday]);
			var holidayName = holidayToday[holiday]['summary'];
			holidayList.push(holidayName);
		}
		for (n in holidayList) {
			if (holidayList[n] in holidayMap) {
				if ((holidayList[n] === "New Year's Eve" || holidayList[n] === "Christmas Eve") && (hour > 6 && hour < 17)) {
					//do nothing
				} else {
					specialBackground = true;
					holidayInfo = holidayMap[holidayList[n]];
					$('body').css({'background-image': "url('../img/"+holidayInfo['nameNorm']+".jpg')"});
					$('.v').css({
						'background-color': 'rgba('+holidayInfo['bgColor']+',0.85)',
						'color': 'rgba('+holidayInfo["textColor"]+',1)'
					});
				}
			} 
		}
	}
	if (!specialBackground) {
		if ((month < 4 || month > 11) && (hour > 16 || hour < 7)) {
			$('body').attr('id', 'winter-night');
			$('.v').attr('class', 'winter-night');
		} else if ((month < 4 || month > 11) && (hour > 6 && hour < 17)) {
			$('body').attr('id', 'winter-day');
			$('.v').attr('class', 'winter-day');
		} else if ((month > 3 && month < 7) && (hour > 16 || hour < 7)) {
			$('body').attr('id', 'spring-night');
			$('.v').attr('class', 'spring-night');
		} else if ((month > 3 && month < 7) && (hour > 6 && hour < 17)) {
			$('body').attr('id', 'spring-day');
			$('.v').attr('class', 'spring-day');
		} else if ((month > 6 && month < 10) && (hour > 16 || hour < 7)) {
			$('body').attr('id', 'summer-night');
			$('.v').attr('class', 'summer-night');
		} else if ((month > 6 && month < 10) && (hour > 6 && hour < 17)) {
			$('body').attr('id', 'summer-day');
			$('.v').attr('class', 'summer-day');
		} else if ((month > 9 && month < 12) && (hour > 16 || hour < 7)) {
			$('body').attr('id', 'fall-night');
			$('.v').attr('class', 'fall-night');
		} else if ((month > 9 && month < 12) && (hour > 6 && hour < 17)) {
			$('body').attr('id', 'fall-day');
			$('.v').attr('class', 'fall-day');
		}
	}
	$('#q').focus();
		
		//TODO make birthday function!
}
function handleAuthResult(authResult) {
	if (authResult && !authResult.error) {
		//console.log('authenticated')
		makeApiCall();
	} else if (authResult.error) {
		//console.log(authResult);
	}
}

function googleAuth() {
	var clientId = "38688330194-kd2c0co2ft9q8n8ovtuqrgvp5teir4iu.apps.googleusercontent.com";
	var apiKey = "3hnoi3T0RibAklS3R__8MyKb";
	var scopes = "https://www.googleapis.com/auth/calendar.readonly";
	
	gapi.client.setApiKey(apiKey);
	
	if (authenticated === false) {
		gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
		authenticated = true;
	} else {
		gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
	}
	
}

function makeApiCall() {
	var calendarId = encodeURIComponent("en.canadian#holiday@group.v.calendar.google.com");
	var date = new Date();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var year = date.getFullYear();
//	var month = 12;
//	var day = 24;
	var timeMin = encodeURIComponent(year+"-"+month+"-"+day+"T00:00:00+00:00");
	var timeMax = encodeURIComponent(year+"-"+month+"-"+day+"T00:00:01+00:00");
	var req = gapi.client.request({
		"path": "/calendar/v3/calendars/"+calendarId+"/events?singleEvents=true&timeMin="+timeMin+"&timeMax="+timeMax+"&timeZone=UTC"
	});
	
	req.execute(function(resp) {
//		console.log(resp);
		if (resp['items'].length > 0) {
			if ($('#holiday').length === 0) {
			$('#date-time').after('<div id="holiday" class="v"></div>');
			}
			var holiday = $('#holiday');
			holidayToday = resp['items'];
			console.log(holidayToday);
			holiday.html("<h3>Today's holidays</h3>");
			for (n in holidayToday) {
				var holidayName = holidayToday[n]['summary'];
				holiday.append('<p id=' + n + '></p>');
				console.log(holidayName)
				var p = $('#' + n)
				p.append(holidayName);
				getWikiInfo(holidayName,n);
			}
			setBackground(holidayToday);
		} else {
			setBackground(holidayToday);
		}
	});
}

function getHolidays() {
	googleAuth();
}

function getWikiInfo(holidayName,n) {
	var wikiReqUri = "http://en.wikipedia.org/w/api.php?";
    var queryTerm = "&action=opensearch&search=" + holidayName;
    var query = wikiReqUri + queryTerm;
    $.ajax({
    	dataType: "jsonp",
    	url: query,
    	success: function(data) {
    		
    		console.log(holidayName);
    		
    		var wikiLink = data[3][0];
    		var item = $('#' + n);
    		item.append(' - <a href="'+wikiLink+'">More Information</a>');
    	}
    });
 }


//get the time
function getDateTime() {
	var date = new Date();
	var year, month, date, day, hours, minutes, seconds;
	year = date.getFullYear();
	month = date.getMonth();
	dayMonth = date.getDate();
	dayWeek = date.getDay();
	
	hours = date.getHours();
	minutes = date.getMinutes();
	seconds = date.getSeconds();
	
	hours = hours < 10 ? "0" + hours : hours;
	minutes = minutes < 10 ? "0" + minutes : minutes;
	seconds = seconds < 10 ? "0" + seconds : seconds;
	var greeting = "Good ";
	if (hours < 4 || hours > 22) {
		greeting += "night";
	} else if (hours > 3 && hours < 12) {
		greeting += "morning";
	} else if (hours > 11 && hours < 17) {
		greeting += "afternoon";
	} else {
		greeting += "evening";
	}
	var dateTime = $('#date-time');
	dateTime.html('<h2></h2>');
	dateTime.children('h2').text(greeting);
	dateTime.children('h2').append(", It's " + dayWeekMap[dayWeek] + " the " + dayMonth + dateAppend(dayMonth) + ' of ' + monthMap[month] + ', ' + year + ' at ' + hours + ':' + minutes + ':' + seconds);
}


//get the weather
function getWeather() {
	// fuck environment canada, find a new weather thing. hopefully one with a proper api.
	//$('#weather-area').html('<iframe id="weather" title="Environment Canada Weather" width="400px" height="175px" src="//weather.gc.ca/wxlink/wxlink.html?cityCode=on-118&amp;lang=e" allowtransparency="true" frameborder="0"></iframe>');
	$('#q').focus();
}

//get the news
function getOttawaNews() {
	$.ajax({
		//type: 'GET',
		dataType: "jsonp",
//		contentType: "application/json",
		//url: "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=8&q=http%3A%2F%2Fnews.google.com%2Fnews%3Foutput%3Drss",		
		url: "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=8&q=http%3A%2F%2Frss.cbc.ca%2Flineup%2Fcanada-ottawa.xml",
//		url: "http://news.google.ca/news?pz=1&cf=all&ned=ca&hl=en&geo=ottawa,on&output=rss",
		
		//crossOrigin: true,
		success: function(data) {
//			console.log(data);
			var feed = data.responseData.feed;	
			
			$('#news').children('#ottawa-news').html(populateRssDiv(feed));
		}
	});
}

function getCanadaNews() {
	$.ajax({
		//type: 'GET',
		dataType: "jsonp",
//		contentType: "application/json",
		//url: "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=8&q=http%3A%2F%2Fnews.google.com%2Fnews%3Foutput%3Drss",		
		url: "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=8&q=http%3A%2F%2Frss.cbc.ca%2Flineup%2Fcanada.xml",
//		url: "http://news.google.ca/news?pz=1&cf=all&ned=ca&hl=en&geo=ottawa,on&output=rss",
		
		//crossOrigin: true,
		success: function(data) {
//			console.log(data);
			var feed = data.responseData.feed;	
			
			$('#news').children('#canada-news').html(populateRssDiv(feed));
		}
	});
}

function getWorldNews() {
	$.ajax({
		//type: 'GET',
		dataType: "jsonp",
//		contentType: "application/json",
		//url: "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=8&q=http%3A%2F%2Fnews.google.com%2Fnews%3Foutput%3Drss",		
		url: "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=8&q=http%3A%2F%2Frss.cbc.ca%2Flineup%2Fworld.xml",
//		url: "http://news.google.ca/news?pz=1&cf=all&ned=ca&hl=en&geo=ottawa,on&output=rss",
		
		//crossOrigin: true,
		success: function(data) {
//			console.log(data);
			var feed = data.responseData.feed;	
			
			$('#news').children('#world-news').html(populateRssDiv(feed));
		}
	});
}

function populateRssDiv(feed) {
	var feedTitle = feed.title;
	var articles = feed.entries;
//	console.log(articles);
	var list = "<h4>" + feedTitle + "</h4>";
	for (i = 0; i < articles.length; i++) {
		var item = articles[i];
		list += '<h5><a href="' + item.link + '">' + item.title + '</a></h5>';
		var localDate = (new Date(item.publishedDate)).toLocaleString();
		list += '<p>' + localDate + '</p>';
		//console.log(localDate);
		list += '<p>' + item.content + '</p>';
	}
	return list;
}
