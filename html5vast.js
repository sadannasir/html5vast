/*
 * HTML5VAST - Play VAST 2.0 Ads on HTML5 Video
 * http://html5vast.com
 * Sadan Nasir
 * version 1.1 2014-06-01
 * Creative Commons Attribution-NonCommercial 4.0 International License
 * http://creativecommons.org/licenses/by-nc/4.0/
*/
 
 //Fix DOCTYPE -> caption alignment issue (DONE)
 //Add Time-Event Tracking
 
	function html5vast(video_player_id, vast_url, options){
		var video_player = document.getElementById(video_player_id);
		
		//Default options
		var html5vast_options = {
			'media_type' : 'video/mp4',
			'media_bitrate_min' : 200,
			'media_bitrate_max' : 1200,
			'ad_caption': 'Advertisement'					
		};
		for(var key in options){
			html5vast_options[key] = options[key];
		}
		
		//Create Wrapper Div
		var wrapper_div = document.createElement('div');
		wrapper_div.className = 'h5vwrapper';
		wrapper_div.id = 'h5vwrapper_'+video_player_id;
		video_player.parentNode.insertBefore(wrapper_div,video_player);
		wrapper_div.appendChild(video_player);				
		
		
		var obj_vast = h5vReadFile(vast_url,html5vast_options);
		//alert(obj_vast.media_file);
		h5vPreRoll(video_player_id,obj_vast, html5vast_options);
		
		
	}		
	
	//Read VAST XML
	function h5vReadFile(vast_url, options){
		//Read XML file
		var xmlHttpReq; var xmlDoc;
		if (window.XMLHttpRequest){
			xmlHttpReq=new XMLHttpRequest();
		}
		else{
		  xmlHttpReq=new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlHttpReq.open("GET",vast_url,false);
		xmlHttpReq.send();
		xmlDoc=xmlHttpReq.responseXML;
		
		var obj_vast ={};
		
		//Get impression tag
		var impression = xmlDoc.getElementsByTagName("Impression");
		if(impression != null){
			obj_vast.impression_url = impression[0].childNodes[0].nodeValue;
			//alert(obj_vast.impression_url);
		}
		
		//Get Creative
		var creative = xmlDoc.getElementsByTagName("Creative");				
		var media_files;
		for(var i=0;i<creative.length;i++){
			var creative_linear = creative[i].getElementsByTagName("Linear");
			if(creative_linear != null){
				for(var j=0;j<creative_linear.length;j++){
					
					//Get media files
					var creative_linear_mediafiles = creative_linear[j].getElementsByTagName("MediaFiles");
					if(creative_linear_mediafiles!=null){
						for(var k=0;k<creative_linear_mediafiles.length;k++){
							var creative_linear_mediafiles_mediafile = creative_linear_mediafiles[k].getElementsByTagName("MediaFile");
							if(creative_linear_mediafiles_mediafile!=null){
								media_files = creative_linear_mediafiles_mediafile;
							}
						}
					}
					
					//Get Clickthrough URL
					var creative_linear_videoclicks = creative_linear[j].getElementsByTagName("VideoClicks");
					if(creative_linear_videoclicks!=null){
						for(var k=0;k<creative_linear_videoclicks.length;k++){
							var creative_linear_videoclicks_clickthrough = creative_linear_videoclicks[k].getElementsByTagName("ClickThrough")[0].childNodes[0].nodeValue;
							if(creative_linear_videoclicks_clickthrough!=null){
								obj_vast.clickthrough_url = creative_linear_videoclicks_clickthrough;
							}
						}
					}
					
				}
			}
		}
						
		for(var i=0;i<media_files.length;i++){
				if(media_files[i].getAttribute('type')==options.media_type){
					if((media_files[i].getAttribute('bitrate')>options.media_bitrate_min) && (media_files[i].getAttribute('bitrate')<options.media_bitrate_max)){
						obj_vast.media_file=media_files[i].childNodes[0].nodeValue;
					}
				}
		}
		
		return obj_vast;
	}
	
	//Preroll 
	function h5vPreRoll(video_player_id, obj_vast, options){
		var video_player = document.getElementById(video_player_id);
		//Video play event
		var prev_src = h5vGetCurrentSrc(video_player_id);
		var video_player_play = function(event) { 
				
				//Change source to PreRoll
				video_player.src = obj_vast.media_file;
				video_player.load();
				
				//On content load
				var video_player_loaded = function(event){
					h5vAddClickthrough(video_player_id,obj_vast);
					h5vAddCaption(video_player_id,options.ad_caption);							
					video_player.play();							
					h5vAddPixel(obj_vast.impression_url); //Fire impression
					video_player.removeEventListener('loadedmetadata',video_player_loaded);
				}
				
				//On PreRoll End
				var video_player_ended = function(event){
					video_player.src = prev_src;
					video_player.load();
					video_player.play();
					h5vRemoveClickthrough(video_player_id);
					h5vRemoveCaption(video_player_id);
					video_player.removeEventListener('ended',video_player_ended);
				}
				
				video_player.addEventListener('loadedmetadata', video_player_loaded);
				video_player.addEventListener('ended', video_player_ended);						
				video_player.removeEventListener('play', video_player_play);					
		}
		video_player.addEventListener('play', video_player_play);
	}
	
	//Add Caption
	function h5vAddCaption(video_player_id, caption_text){
		var video_player = document.getElementById(video_player_id);
		var wrapper_div = document.getElementById('h5vwrapper_'+video_player_id);
		
		//Create Caption div
		var caption_div = document.createElement('div');
		caption_div.className = 'h5vcaption';
		caption_div.id='h5vcaption_'+video_player_id;
		caption_div.innerHTML=caption_text;
		wrapper_div.appendChild(caption_div);			
		//Adjust style
		var caption_div_left = (video_player.offsetWidth/2)-(document.getElementsByClassName("h5vcaption")[0].offsetWidth/2);
		caption_div.style.left=caption_div_left+'px';
	}
	
	//Remove Caption
	function h5vRemoveCaption(video_player_id){
		var elem = document.getElementById('h5vcaption_'+video_player_id);
		elem.parentNode.removeChild(elem);
	}
	
	//Add Clickthrough
	function h5vAddClickthrough(video_player_id,obj_vast){
		var video_player = document.getElementById(video_player_id);
		var wrapper_div = document.getElementById('h5vwrapper_'+video_player_id);
		//Create Clickthrough div
		var clickt_div = document.createElement('div');
		clickt_div.className = 'h5vclickt';
		clickt_div.id='h5vclickt_'+video_player_id;
		clickt_div.style.position='absolute';
		clickt_div.style.cursor = 'pointer';
		clickt_div.style.left=0;
		clickt_div.style.top=0;
		clickt_div.style.width=video_player.offsetWidth;
		clickt_div.style.height=(video_player.offsetHeight - 50);
		//clickt_div.innerHTML="<a href='' style='width:100%;height:100%;'></a>";
		wrapper_div.appendChild(clickt_div);
		//Bind Onclick
		var clickt_obj = document.getElementById('h5vclickt_'+video_player_id);
		clickt_obj.onclick = function(){window.open(obj_vast.clickthrough_url)};				
	}
	
	//Remove Clickthrough
	function h5vRemoveClickthrough(video_player_id){
		var elem = document.getElementById('h5vclickt_'+video_player_id);
		elem.parentNode.removeChild(elem);
	}
	
	//Get current video source src
	function h5vGetCurrentSrc(video_player_id){			
		return document.getElementById(video_player_id).getElementsByTagName("source")[0].getAttribute("src");
	}
	
	//Add pixel for firing impressions, tracking etc
	function h5vAddPixel(pixel_url){
		var image = new Image(1,1); 
		image.src = pixel_url;
	}