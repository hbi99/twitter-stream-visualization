var geomaniac = (function(){

	var width = window.innerWidth - 4,
		height = window.innerHeight - 4,
		startCountry = "France",
		globe, land, countries, borders, features, cities, scale = 1, moved = true,
		wasMoved = [], clickPoints = [], dragging, zoom, drag,
		tweetLocations = [], loadingTooltip = true;

	var orthographic = function(){
		 // uncomment for testing
		 /*for(var i = 0; i < 202; i++){
            var k = {"retweets":0,"faves":0,"coords":[-33.4394,-70.5521],"text":"Blablabla bla bla bla","user":{"name":"lessgeneric","screenName":"lessgeneric"},"time":"Wed Jun 22 18:50:37 +0000 2016"}

            k.coords[0] = helpers.getRandomInRange(-180, 180, 3);
            k.coords[1] = helpers.getRandomInRange(-90, 90, 3);

            var ft = {
                retweets: k.retweets,
                faves: k.faves,
                longitude: helpers.formatLocation(k.coords).straight[0],
                latitude: helpers.formatLocation(k.coords).straight[1],
                coords: k.coords,
                text: k.text,
                user: k.user,
                time: k.time,
                retweeted_status: k.retweeted_status
            }

            tweetLocations.push(ft);
        }*/

		var animate = function() {

			requestAnimationFrame(animate);

			now = Date.now();
			elapsed = now - then;

			// if enough time has elapsed, draw the next frame
			if (elapsed > fpsInterval) {
				
				// Get ready for next frame by setting then=now, but...
				// Also, adjust for fpsInterval not being multiple of 16.67
				then = now - (elapsed % fpsInterval);

				if(moved){
					draw();
					moved = false;
				}
			}
		};

		var projection = d3.geo.orthographic()
			.scale(300)
			.translate([width / 2, height / 2])
			.clipAngle(90)
			.precision(.1);

		var barProjection = d3.geo.orthographic()
			.scale(410.1)
			.translate([width / 2, height / 2])
			.clipAngle(90)
			.precision(.1);

		var canvas = d3.select("body").append("canvas")
			.attr("width", width)
			.attr("height", height);

		var c = canvas.node().getContext("2d");


		var path = d3.geo.path()
			.projection(projection) // put barProjection for testing distances
			.pointRadius(1.5)
			.context(c);

		var graticule = d3.geo.graticule();

		var elem = document.querySelector('canvas'),
			elemLeft = elem.offsetLeft,
			elemTop = elem.offsetTop,
			context = elem.getContext('2d'),
			elements = [],
			lastCountryName = '',
			lastCountryGeometry = null;

		var draw = function(){
			
			// Store the current transformation matrix
			c.save();

			// Use the identity matrix while clearing the canvas
			c.setTransform(1, 0, 0, 1, 0, 0);
			c.clearRect(0, 0, width, height);

			// Restore the transform
			c.restore();

			// sea //003366'
			c.fillStyle = '#f3f0ec';
			c.beginPath();
			path.context(c)(globe);
			c.fill();
			c.stroke();

			//graticule
			c.strokeStyle = "rgba(0,0,0,0)";
			c.lineWidth = .5;
			c.beginPath();
			path.context(c)(graticule());
			c.stroke();
			
			// land
			c.fillStyle = "#70cbf4";
			c.beginPath();
			path.context(c)(land); /*path(land)*/
			c.fill();
			// countries

			// mobile
			/*for(var i in countries){
				c.fillStyle = "#f00", c.beginPath(), path(countries[i]), c.fill();
			}*/
			// borders
			c.strokeStyle = "rgba(225, 215, 255, 0.4)";
			c.lineWidth = 1;
			c.beginPath();
			path(borders);
			c.stroke();

			var protate = projection.rotate(),
				mouseCoords = projection.invert([mousepos.x, mousepos.y]),
				scaleLevel = zoom && zoom.scale() || 0;


			// cities
			for(var i in cities){

				// no show
				//if(scaleLevel < 4)
				//	return;

				c.fillStyle = "#fff", c.beginPath(), path(cities[i]), c.fill();

				var cds = cities[i].geometry.coordinates,
					xyFromCoordinates = projection([cds[0],cds[1]]);

				// mask and labels
				var longitude = Number(cds[0]) + 180,
					startLongitude = 360 - ((protate[0] + 270) % 360),
					endLongitude = (startLongitude + 180) % 360;

				if ((startLongitude < endLongitude && longitude > startLongitude && longitude < endLongitude) ||
						(startLongitude > endLongitude && (longitude > startLongitude || longitude < endLongitude))){
							// labels
						//	c.font = '8px Monospace';
						//	c.fillStyle = "#fb0", c.beginPath(), c.fillText(decodeURI(cities[i].properties.city).toUpperCase(), xyFromCoordinates[0], xyFromCoordinates[1]);
							// white outline
						//	c.fillStyle = 'rgba(144, 122, 122, 0.2)', c.beginPath(), c.fillRect(xyFromCoordinates[0] -1, xyFromCoordinates[1] -6, (decodeURI(cities[i].properties.city).toUpperCase().length * 5), 7);
				} else {
				//	c.font = '5px Monospace';
				//	c.fillStyle = "rgba(32, 45, 21, 0.2)", c.beginPath(), c.fillText(decodeURI(cities[i].properties.city).toUpperCase(), xyFromCoordinates[0], xyFromCoordinates[1]);
				//	c.fillStyle = 'rgba(255, 255, 255, 0.0)', c.beginPath(), c.fillRect(xyFromCoordinates[0] -1, xyFromCoordinates[1] -6, (decodeURI(cities[i].properties.city).toUpperCase().length * 5), 7);
				}
			}
			
			// tweet spots
			for(var i in tweetLocations){
				var tweetLocation = tweetLocations[i],
					loc = tweetLocation? projection([tweetLocation.longitude, tweetLocation.latitude]): null;
				
				if(loc){
					var longitude = Number(tweetLocation.longitude) + 180,
						startLongitude = 360 - ((protate[0] + 270) % 360),
						endLongitude = (startLongitude + 180) % 360;

					// mask 
					if ((startLongitude < endLongitude && longitude > startLongitude && longitude < endLongitude) ||
							(startLongitude > endLongitude && (longitude > startLongitude || longitude < endLongitude))){
								drawLine(tweetLocation, 'rgba(255, 255, 255, 0.7)');
								drawSpot(tweetLocation, '0.9',  4);
						}
						else {
							drawLine(tweetLocation, 'rgba(32, 45, 21, 0.1)');
							drawSpot(tweetLocation, '0.1', 2);
						}
					
					removeTweet('clickpoint');
				}
			}
		};

		var drawSpot = function(tweet, style, tradius){
			var ending = barProjection([tweet.longitude, tweet.latitude]);

			var histo = {
				5:    'rgba(229, 115, 238', 
				10:   'rgba(200, 239, 234', 
				30:   'rgba(248, 250, 212', 
				100:  'rgba(255, 242, 128', 
				300:  'rgba(240, 186,  50', 
				800:  'rgba(218,  80,  25', 
				1000: 'rgba(165,  33, 117', 
			};

			var circ = Math.PI * 2;
			var quart = Math.PI / 2;
		

			var popularity = tweet.retweets + tweet.faves;

			if(popularity <= 5)
				c.strokeStyle = histo['5'] + ',' + style + ')';
		
			if(popularity > 5 && popularity <= 10)
				c.strokeStyle = histo['10'] + ',' + style + ')';
		
			if(popularity > 10 && popularity <= 30)
				c.strokeStyle = histo['30'] + ',' + style + ')';
			
			if(popularity > 30 && popularity <= 100)
				c.strokeStyle = histo['100'] + ',' + style + ')';
			
			if(popularity > 100 && popularity <= 300)
				c.strokeStyle = histo['300'] + ',' + style + ')';
		
			if(popularity > 300 && popularity <= 800)
				c.strokeStyle = histo['800'] + ',' + style + ')';
			
			if(popularity > 800 && popularity <= 1000)
				c.strokeStyle = histo['1000'] + ',' + style + ')';
			
			if(popularity > 1000)
				c.strokeStyle = 'rgba(144, 253, 222, ' + style + ')';
		

			var radius = Math.log(projection.scale()); // Math.floor(radius) ...
			c.lineWidth = 2, c.beginPath(), c.lineTo(ending[0], ending[1]), c.arc(ending[0], ending[1], 2, - (quart), ((circ) * (100 / 100)) - quart, false), c.stroke();
			
		}

		var drawLine = function(tweet, style){
			var beggining = projection([tweet.longitude, tweet.latitude]),
				ending = barProjection([tweet.longitude, tweet.latitude]);

			c.strokeStyle = style;
			c.beginPath();
			c.moveTo(beggining[0], beggining[1]);
			c.lineTo(ending[0], ending[1]);
			c.stroke();
		}

		var onDrag = function(){
			var dx = d3.event.dx,
				dy = d3.event.dy,
				rotation = projection.rotate(),
				radius = projection.scale(),
				barRotation = barProjection.rotate(),
				barRadius = barProjection.scale();

			scale = d3.scale.linear()
				.domain([-1 * radius, radius])
				.range([-90, 90]);

			var degX = scale(dx), degY = scale(dy);

			rotation[0] += degX;
			rotation[1] -= degY;
			if (rotation[1] > 90)   rotation[1] = 90;
			if (rotation[1] < -90)  rotation[1] = -90;

			if (rotation[0] >= 180) rotation[0] -= 360;

			// barprojection
			scale = d3.scale.linear()
				.domain([-1 * barRadius, barRadius])
				.range([-90, 90]);

			// barRotation sphere is ~~twice bigger thus degree scales must be twice
			// bigger as well (if you want 3d effect)
			var degrX = scale(dx) * 1.367, degrY = scale(dy)* 1.367;

			barRotation[0] += degrX;
			barRotation[1] -= degrY;
			if (barRotation[1] > 90)   barRotation[1] = 90;
			if (barRotation[1] < -90)  barRotation[1] = -90;

			if (barRotation[0] >= 180) barRotation[0] -= 360;

			projection.rotate(rotation);
			//barProjection.rotate(barRotation);

			moved = true;
			dragging = true;
				
			wasMoved.push([dx, dy]);
		};

		var onZoom = function(){
			zoom.scaleExtent([zoom.scale()*0.9, zoom.scale()*1.1]);

			scale = (d3.event.scale >= 1) ? d3.event.scale : 1;
			projection.scale(300 * scale);

			// this is double scaled projection, if you change scale
			// you must also change rotation and control point factors
			// to reflect this scale size
			barProjection.scale(410.1 * zoom.scale());

			moved  = true;
			dragging = true;
		};

		var detectCountry = function(inverted){
			if(!features)
				return;

			var foundCountryElement;

			features.forEach(function(element) {
				if(element.geometry.type == 'Polygon'){
					if(gju.pointInPolygon(inverted, element.geometry) && !foundCountryElement){
						foundCountryElement = element;
					}
				}

				else if(element.geometry.type == 'MultiPolygon'){
					if(gju.pointInMultiPolygon(inverted, element.geometry) && !foundCountryElement){
						foundCountryElement = element;
					}
				}
			});

			var name = foundCountryElement? foundCountryElement.name: null,
				geometry = foundCountryElement? foundCountryElement.geometry: null;

			return {
				name: name,
				geometry: geometry
			}
		};

		var addDomElement = function(id, text, cssclass, coords, removeOnRedraw){
			var oldh = document.querySelector('#' + id);

			if(oldh){
				oldh.remove();
			}

			var div = document.createElement("div"); 
			div.setAttribute('id', id);
			div.setAttribute('class', cssclass);

			var textContent = document.createElement('div');
			textContent.innerHTML = text;
			div.appendChild(textContent); //add the text node to the newly created div. 

			div.style.cssText = 'position: absolute; top: ' + (coords[1] - 15) + 'px; left:' + (coords[0] - 21) +'px;';

			// add the newly created element and its content into the DOM 
			var currentDiv = document.getElementById(id); 
			document.body.insertBefore(div, currentDiv);

			var currentBoundingBox = div.getBoundingClientRect();

			// refine top position
			div.style.top = (parseFloat(div.style.top.replace('px','')) - currentBoundingBox.height) + 'px';
		};

		var addTweet = function(inverted){
			
			if(tweetLocations && tweetLocations.length > 0){
				for(var i in tweetLocations){

					// Using formula: sqrt((x2 - x1)^2 + (y2 - y1)^2))  for distance
					// TODO: in five kilometers metric should be better
					var _T = tweetLocations[i],
						distance = Math.sqrt(Math.pow(inverted[0]  - _T.longitude, 2) + Math.pow(inverted[1] - _T.latitude, 2)),
						
						scaleFactor = parseInt(zoom.scale() / 6),
						isItInFiveKilometers = distance <= (0.05 / scaleFactor) *2;
						
						

					if(isItInFiveKilometers){ 
						// TODO: add twitter-like card
						var _DOM = ['<strong>@' + _T.user.screenName + '</strong><br/>',
										'<p>' + _T.text + '</p><br/>',
										'<div style="border-top: 1px solid #333l; width: 100%;">Retweets: ' + _T.retweets + ', Favorties: ' + _T.faves + '</div><br/>',
										'<span style="font-style: italic;">' + _T.time + '</span>'
										].join('');

						addDomElement('clickpoint', _DOM, 'locationtip', barProjection([_T.longitude, _T.latitude]), false);
					}
				}
			}
		};

		var removeTweet = function(id){
			var oldh = document.querySelector('#' + id);
			
			if(oldh){
				oldh.remove();
			}
		};

		elem.addEventListener('click', function(event){

			// prevents clicks on dragend
			if(wasMoved.length > 1){
				wasMoved = [];
				return;
			}

			var x = event.pageX - elemLeft,
				y = event.pageY - elemTop,
				inverted = projection.invert([x,y]),
				zoomBy = zoomByB = 1,
				initialProjectionScale = projection.scale(),
				initialBarProjectionScale = barProjection.scale(),
				zoomIn = initialProjectionScale > 3000 ? false: true;

			d3.transition()
				.duration(1250)
				.tween("rotate", function() {
					var r = d3.interpolate(projection.rotate(), [-inverted[0], -inverted[1]]);
					
					return function(t) {
						projection.rotate(r(t));
						barProjection.rotate(r(t));

						zoomBy = zoomIn ? initialProjectionScale + (t * 900) : initialProjectionScale - (t * 1200);
						zoomByB = zoomIn ? initialBarProjectionScale + (t * 1230.3) : initialBarProjectionScale - (1640.4)
						
						zoom.scale(t * 3.1);

						projection.scale(zoomBy);
						barProjection.scale(zoomByB);
						
						wasMoved = [];
						draw();
					};
				})
				.transition()
				.each('end',function(){
					wasMoved = [];
				});

		}, false);

		elem.addEventListener('mousemove', function(event) {
			
			// huge performance improvement for firefox
			if(dragging){
				return;
			}

			var x = event.pageX - elemLeft,
				y = event.pageY - elemTop,
				inverted = projection.invert([x,y]),
				country = detectCountry(inverted);

			// mouse out of current territory
			if(lastCountryGeometry && country.geometry && lastCountryGeometry.coordinates[0][0] != country.geometry.coordinates[0][0] ){
				draw();
			}

			// ocean
			if(country && !country.geometry){
				draw();
			}

			// mouse over territory
			if(country && country.name){
				if(lastCountryName != country.name){

					c.fillStyle = "rgba(198, 237, 219, 0.4)";
					c.beginPath();
					path(country.geometry);
					c.fill();

					// country text (background)
					// c.fillStyle = 'rgba(0,0,0,0.5)';
					// c.beginPath();
					// c.fillRect(x -1, y -10, ((decodeURI(country.name)).toUpperCase().length * 7.5), 12);

					// country text
					c.font = '12px Arial';
					c.fillStyle = "#000", c.beginPath();
					c.fillText((decodeURI(country.name)).toUpperCase(), x, y);

					lastCountryName = country.name;
					lastCountryGeometry = country.geometry;
				}
			}

			if(tweetLocations.length > 0 && zoom && zoom.scale() > 6){
				
				addTweet(barProjection.invert([x,y]));
			}
		}, false);

		var loader = function(error, world, names, _cities) {
			if (error) throw error;

			var countryById = { };

			names.forEach(function(d) {

				countryById[d.id] = d.name;
			});

			features = topojson.feature(world, world.objects.countries).features;

			features.forEach(function(object){

				object.name =  countryById[object.id];
			});

			globe = {type: "Sphere"},
			land = topojson.feature(world, world.objects.land)
			countries = features,
			cities = _cities.features,
			borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });

			features = features.filter(function(d) {
				return names.some(function(n) {
					if (d.id == parseInt(n.id)){ return d.name = n.name; }
				});
			}).sort(function(a, b) {
				return a.name.localeCompare(b.name);
			});

			var startIDObj = features.filter(function(d){
				return (d.name).toLowerCase() == (startCountry).toLowerCase();
			})[0];


			var startGeom = features.filter(function(d){
				return d.id == startIDObj.id
			});

			var startCoord = d3.geo.centroid(startGeom[0]);

			var coords = [-startCoord[0], -startCoord[1]];

			projection.rotate(coords);
			barProjection.rotate(coords);

			animate();

			zoom = d3.behavior.zoom()
				.center([width / 2, height / 2])
				.on("zoom", onZoom)
				.on("zoomend", function(){ dragging = false; });

			drag = d3.behavior.drag()
				.on('drag', onDrag)
				.on('dragend', function(){ dragging = false; })

			canvas.call(zoom);
			canvas.call(drag);
		}

		queue()
			.defer(d3.json, "/json/world-110m.json")
			.defer(d3.tsv, "/json/world-110m-country-names.tsv")
			.defer(d3.json, "/json/cities.geojson")
			.await(loader);

		d3.select(self.frameElement).style("height", height + "px");

	};

	return {
		orthographic: orthographic,
		tweetLocations: tweetLocations
	};

})();

var mousepos = {};

var frameCount = 0;
var fps = 30, now, elapsed;
var fpsInterval = 1000 / fps;
var then = Date.now();
var startTime = then;

window.addEventListener('load', function(){

	document.addEventListener('mousemove', function(event){
		mousepos.x = (window.Event) ? event.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
		mousepos.y = (window.Event) ? event.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
	});

	prefix = helpers.prefixMatch(["webkit", "ms", "Moz", "O"]);
	
	geomaniac.orthographic();

	// helpers.loadScript(location.href + 'socket.io/socket.io.js', 'text/javascript', function(){

	// 	// uncomment for testing
	// 	/*geomaniac.orthographic();
 //        return;*/

	// 	var iointerval = setInterval(function(){
	// 		if(typeof io != 'undefined'){
	// 			clearInterval(iointerval);
	// 			sockety.load();
	// 			geomaniac.orthographic();
	// 			console.log('io ready.');
	// 		}
	// 	}, 50);

	// 	var connecting = document.createElement('div');
	// 	connecting.className = 'totalstatustip connecting';
	// 	connecting.innerHTML = 'Connecting stream ...';
	// 	connecting.style.cssText = 'position: absolute; right: 100; bottom: 50;'

	// 	document.body.appendChild(connecting);
	// });
});

