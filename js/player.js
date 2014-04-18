function get_random_color() {
	var letters = '0123456789ABCDEF';
    var possibilities = letters.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += possibilities[Math.round(Math.random() * (letters.length-1))];
    }
    return color;
}

generateHierarchy = function(container) {
	var myLis = container.find('li[name]');
	myLis.each(function(){
		var that = $(this);
		that.wrap('<ul class="expandable closed"></ul>');
		that.parent().wrap('<li></li>');
		that.before('<li><a href="javascript://">'+that.attr('name')+'<span class="icon-expand"></span><span class="icon-reduce"></span></a></li>');
	});

	//MUTE not active
	//----------------------------------------------
	container.on('click', '.expandable > :first-child a', function() {
		$(this).closest(".expandable").removeClass("closed").toggleClass("opened");
		return false;
	});
};

generateHtml = function(container) {
	var containerID = container.attr('id');	
	var preload = container.attr("preload") == "none" ? false : true;
	var srcAttr = 'url';
	if(preload) srcAttr = "src";

	//specify containercount to parent
	var nbContainer = container.parent().attr("containers");
	if(nbContainer) {
		nbContainer = parseInt(nbContainer)+1;
		container.parent().attr("containers", nbContainer);
	} else {
		container.parent().attr("containers", 1);
	}
	//insert main control
	container.prepend('<h1>'+container.attr('name')+'</h1><div class="main-control"><ul class="control"><li class="play"><a href="javascript://">play</a></li> <li class="pause"><a href="javascript://">pause</a></li> <li class="stop"><a href="javascript://">stop</a></li> <li class="repeat"><a href="javascript://">repeat</a></li></ul><div class="timebar-wrapper"><div class="timebar"></div></div></div>');
	var audioTags = container.find("audio");
	audioTags.detach();
	
	//insert tracks
	container.append(($.browser.mozilla ? '<canvas width="400"></canvas><a href="javascript://" class="canvas-toggle">▼</a>':"")+'<ul class="tracks"></ul>');
	var containerTracks = container.find('.tracks');
	audioTags.each(function(i){
		var randomColor = get_random_color();
		if (container.hasClass( "nomute" )) {
			containerTracks.append('<li class="track"><ul class="control"><li class="solo"><a href="javascript://"><span></span></a></li></ul><span class="status"></span><audio index="'+i+'" container="'+containerID+'" color="'+randomColor+'" preload="auto" '+srcAttr+'="'+$(this).attr("url")+'"></audio><span class="track-name">'+$(this).attr("name")+'</span>'+($.browser.mozilla ? '<span class="color" style="background-color:'+randomColor+'"></span>':"")+'</li>');
		} else {
			containerTracks.append('<li class="track"><ul class="control"><li class="mute"><a href="javascript://">mute</a></li><li class="solo"><a href="javascript://"><span></span></a></li></ul><span class="status"></span><audio index="'+i+'" container="'+containerID+'" color="'+randomColor+'" preload="auto" '+srcAttr+'="'+$(this).attr("url")+'"></audio><span class="track-name">'+$(this).attr("name")+'</span>'+($.browser.mozilla ? '<span class="color" style="background-color:'+randomColor+'"></span>':"")+'</li>');
		}
	});	
	container.append('<span class="loader"></span>');
	if(!preload) {
		container.append('<a class="loading-link" href="javascript://"></a>').addClass("waiting");
	}
	audioTags.remove();
};
players = {};

initPlayer = function(containerID) {
	
	var container = $("#"+containerID);	
	generateHtml(container);
	
	//fast access to main control buttons and timebar
	players[containerID] = {
		tracks :  Array(), 
	 	playButton : container.find(".main-control .play"),
		pauseButton : container.find(".main-control .pause"),
		stopButton : container.find(".main-control .stop"),
		repeatButton : container.find(".main-control .repeat"),
		timebar : container.find(".main-control .timebar"),
		timebarWrapper : container.find(".main-control .timebar-wrapper"),
		canvas : container.find("canvas"),
		canvasToggle : container.find(".canvas-toggle"),
		firstTrack : null, 
		loadedAudio:0,
		playing:false, 
		canvasCleared:false,
		fft : Array(),
		canvasVisible:false,
		repeat : false
	};
	players[containerID].playButton.attr('container', containerID);
	players[containerID].pauseButton.attr('container', containerID);
	players[containerID].stopButton.attr('container', containerID);
	players[containerID].repeatButton.attr('container', containerID);
	players[containerID].timebar.attr('container', containerID);
	players[containerID].timebarWrapper.attr('container', containerID);
	players[containerID].canvas.attr('container', containerID);
	players[containerID].canvasToggle.attr('container', containerID);

	container.find(".tracks audio").each(function(i, value){
		var that = $(this);
		that.attr('container', containerID);
		players[containerID].tracks.push(that[0]);
		//load track
		that[0].load();
		that[0].addEventListener("canplaythrough", function() {
			players[containerID].loadedAudio++;
			if(players[containerID].loadedAudio==players[containerID].tracks.length) container.trigger("ready");
		}, false);
		that[0].addEventListener("error", function() {
			container.trigger("error", i+1);
		}, false);
		that.attr("index", i);
	});
	players[containerID].trackCount=players[containerID].tracks.length;
	players[containerID].firstTrack = players[containerID].tracks[0];
	container.on("ready", function(){
		$(this).addClass("ready");
	});
	container.on("error", function(e,i){
		$(this).addClass("error");
		$(this).find('.track:nth-child('+i+')').addClass("error");
	});
	
	
	
	//MUTE not active
	//----------------------------------------------
	container.on('click', '.tracks .track:not(.locked):not(.solo) .mute:not(.active) > a', function() {
		//switch button aspect
		var dad = $(this).parent();
		dad.addClass("active");
		dad.closest(".track").addClass("mute");
		
		//get track
		var track = $(this).closest('.track').find('audio:first')[0];
		
		//add volume to the track
		track.volume=0;
	});
	
	//MUTE active
	//----------------------------------------------
	container.on('click', '.tracks .track:not(.locked):not(.solo) .mute.active > a', function() {
		//switch button aspect
		var dad = $(this).parent();
		dad.removeClass("active");
		dad.closest(".track").removeClass("mute");
		
		//get track
		var track = $(this).closest('.track').find('audio:first')[0];
		
		//mute the track
		track.volume=1;
	});
	

	//SOLO not active
	//----------------------------------------------
	container.on('click', '.tracks .solo:not(.active) > a', function() {
		//switch button aspect
		var dad = $(this).parent();
		
		//mute all others
		dad.closest('.tracks').find(".track").removeClass("solo").addClass("locked").each(function() {
			//remove potential active solo track
			$(this).find(".solo.active").removeClass("active");

			//get track
			var track = $(this).find('audio:first')[0];
			track.volume=0;
		});

		dad.addClass("active");
		
		//remove locked class to my track and get audio track
		var track = dad.closest(".track").addClass("solo").removeClass("locked").find('audio:first')[0];
		
		//add volume to the track
		track.volume=1;

	});
	
	//SOLO active
	//----------------------------------------------
	container.on('click', '.tracks .solo.active > a', function() {
		//switch button aspect
		var dad = $(this).parent();
		
		//mute all others
		dad.closest('.tracks').find(".track").removeClass("locked solo").each(function() {
			//remove potential active solo track
			$(this).find(".solo.active").removeClass("active");

			//get track
			var track = $(this).find('audio:first')[0];
			if($(this).hasClass("mute"))
				track.volume=0;
			else
				if (container.hasClass( "nomute" )) {
					track.volume=0;
				} else {
					track.volume=1;
				}
		});
		dad.removeClass("active");
	});

	//PLAY
	//----------------------------------------------
	container.on('click', '.main-control .play:not(.active)', function() {
		var containerID = $(this).attr('container');
		players[containerID].pauseButton.removeClass("active");
		players[containerID].playButton.addClass("active");
		$.each(players[containerID].tracks, function(){
			this.play();
			if (container.hasClass( "nomute" )) {
				// mute all tracks
				this.volume=0;
				// and lock them
				var dad = $(this).parent();
				dad.addClass("locked")
			} else {
				this.volume=1;
			}			
		});
		players[containerID].playing=true;
		if (container.hasClass( "nomute" )) {
			// set volume to first track back to 1
			players[containerID].firstTrack.volume = 1;		
			var dad = $(players[containerID].firstTrack).parent();
			dad.addClass("active");
			dad.closest(".track").addClass("solo").removeClass("locked");
			dad.find(".solo").addClass("active");
		} 
	});
	
	//LOAD
	//----------------------------------------------
	container.on('click', '.loading-link', function() {
		var container = $(this).closest(".audio-container");
		container.removeClass("waiting").find('audio').each(function(){
			$(this).attr("src", $(this).attr("url"));
		});
	});
	//REPEAT
	//----------------------------------------------
	container.on('click', '.main-control .repeat', function() {
		var containerID = $(this).attr('container');
		$(this).toggleClass("active");
		players[containerID].repeat = $(this).hasClass("active");
	});

	//PAUSE
	//----------------------------------------------
	container.on('click', '.main-control .play.active + .pause:not(.active)', function() {
		var containerID = $(this).attr('container');	
		players[containerID].playButton.removeClass("active");
		players[containerID].pauseButton.addClass("active");
		$.each(players[containerID].tracks, function(){
			this.pause();
		});
		players[containerID].playing=false;
	});
	
	//STOP
	//----------------------------------------------
	container.on('click', '.main-control .stop', function() {
		var containerID = $(this).attr('container');
		players[containerID].playButton.removeClass("active");
		players[containerID].pauseButton.removeClass("active");
		$.each(players[containerID].tracks, function(){
			this.pause();
			this.currentTime=0;
		});
		players[containerID].playing=false;
	});
	
	//CANVAS TOGGLE
	container.on('click', '.canvas-toggle', function() {
		var container = $("#"+$(this).attr('container')).toggleClass('canvas-opened');
		if(container.hasClass('canvas-opened')) {
			$(this).html("▲");
			players[container.attr('id')].canvasVisible = true;
		}
		else {
			$(this).html("▼");
			players[container.attr('id')].canvasVisible = false;
		}	
	});
	//SEEK BAR
	//----------------------------------------------
	container.on('click', '.main-control .timebar-wrapper', function(e) {
		var containerID = $(this).attr('container');
		//to be more sure : pause current playing
		players[containerID].tracks[0].pause();
		var myWidth = e.pageX - players[containerID].timebar.offset().left;
		var widthPercent = (myWidth*100)/players[containerID].timebarWrapper.width();
		timePercent = players[containerID].firstTrack.duration*widthPercent/100;
		
		//change the bar progression
		players[containerID].timebar.css('width', widthPercent+'%');
		
		//apply the wanted currentTime to all tracks
		//console.log((players[containerID].playing ? "playing":"not playing")+ ' currentTime='+timePercent+' => '+widthPercent+"%");
		
		for(var i=1;i<players[containerID].tracks.length;i++) {
			var trackI = players[containerID].tracks[i];
			trackI.currentTime=timePercent;
			//console.log('track['+i+'].currentTime='+trackI.currentTime+" != "+timePercent+' ????');
		
		}
		//apply the wanted current time to the first track (the observed one)
		players[containerID].tracks[0].currentTime=timePercent;	

		//play again if we were playing
		if(players[containerID].playing==true) players[containerID].tracks[0].play();
	});
	
	//TIME UPDATE
	//----------------------------------------------
	$(players[containerID].tracks[0]).bind('timeupdate', function() {
		var containerID = $(this).attr('container');
		
		//console.log("TIME UPDATE : "+players[containerID].firstTrack.currentTime);
		//change the bar progression
		players[containerID].timebar.css('width', ((players[containerID].firstTrack.currentTime*100) / players[containerID].firstTrack.duration)+'%');
	});

	$(players[containerID].tracks[0]).bind('ended', function() {
		//stop player if we terminate the track
		var containerID = $(this).attr('container');	
		players[containerID].stopButton.click();
		if(players[containerID].repeat)
			players[containerID].playButton.click();
	});
};
var constID = 0;
$(document).ready(function () {
	$("body").addClass("high-graphics");
	generateHierarchy($('body'));
	//loop through all audio container 
	$(".audio-container").each(function(){
		var myId = $(this).attr('id'); 
		if(!myId){
			myId = "generated-audio-container-" + constID; 
			$(this).attr('id', myId);
			constID++;
		}
		//create the player for this container
		initPlayer(myId);
	});
});
