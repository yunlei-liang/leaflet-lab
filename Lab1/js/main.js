/* Module 4, geojson java script by Yunlei Liang, 2019 */

/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map

function createMap(){
    //create the map
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};



//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 0.2;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    //Determine which attribute to visualize with proportional symbols
    var attribute = "GDP2015";

    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

	//build popup content string starting with country
    var panelContent = "<p><b>Country:</b> " + feature.properties.name + "</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("P")[1];
    panelContent += "<p><b>GDP in " + year + ":</b> " + feature.properties[attribute] + " billion $US</p>";
	
	//popup content is now just the country name
    var popupContent = feature.properties.name;
	
    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius),
		closeButton: false
    });
	
	    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
		click: function(){
            $("#panel").html(panelContent);
        }
		
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map){
    //create a Leaflet GeoJSON layer and add it to the map
	L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
};


//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/GDP.geojson", {
        dataType: "json",
        success: function(response){
            //call function to create proportional symbols
            createPropSymbols(response, map);
			createSequenceControls(map);
        }
    });
};

//Step 1: Create new sequence controls
function createSequenceControls(map){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');

    //set slider attributes
    $('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });
	
};

//below Example 3.4...add skip buttons
$('#panel').append('<button class="skip" id="reverse">Reverse</button>');
$('#panel').append('<button class="skip" id="forward">Skip</button>');

//Below Example 3.5...replace button content with images
$('#reverse').html('<img src="img/reverse.png">');
$('#forward').html('<img src="img/forward.png">');












$(document).ready(createMap);

