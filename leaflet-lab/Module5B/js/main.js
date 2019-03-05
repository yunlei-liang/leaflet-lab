/* Module 5B java script by Yunlei Liang, 2019 */


//function to instantiate the Leaflet map

function createMap(){
    //create the two maps
    var mapporp = L.map('mapporp', {
        center: [38,-94],
        zoom: 4
    });
	
    var mapchoro = L.map('mapchoro', {
        center: [38,-94],
        zoom: 4
    });	

    //add OSM base tilelayer
   L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(mapporp);
	
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(mapchoro);

    getDataProp(mapporp,mapchoro);
	getDataChoro(mapporp,mapchoro);
	
	//add legend
	var legend = L.control({position: 'bottomright'});

	legend.onAdd = function (mapchoro) {

		var div = L.DomUtil.create('div', 'info legend'),
			grades = [0, 5, 10, 20, 30, 50, 75, 100],
			labels = [];

		// loop through our density intervals and generate a label with a colored square for each interval
		for (var i = 0; i < grades.length; i++) {
			div.innerHTML +=
				'<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
				grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
		}

		return div;
	};
	
	legend.addTo(mapchoro);

	

};

//give a color shading according to attribute values
function getColor(d) {
    return d > 100 ? '#800026' :
           d > 75 ? '#BD0026' :
           d > 50  ? '#E31A1C' :
           d > 30  ? '#FC4E2A' :
           d > 20 ? '#FD8D3C' :
           d > 10  ? '#FEB24C' :
           d > 5  ? '#FED976' :
                     '#FFEDA0';
}

//style for the choropleth map
function style(feature, attributes){

	var attribute = attributes[0];
	
	//check
    //console.log(feature.properties[attribute]);
    
    return {
        fillColor: getColor(feature.properties[attribute]),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };

}


//bind popup
function onEachFeature(feature,attributes,layer){

	var attribute = attributes[0];		
	var popupContent = "<p><b>State:</b> " + feature.properties.name + "</p>";
	
	var year = attribute.split("g")[1];
    popupContent += "<p><b>Education Spending in " + year + ":</b> " + feature.properties[attribute] + " billion $US</p>";
	
	//console.log(popupContent);
	layer.bindPopup(popupContent);
	
    layer.on({
        click: function(){
			this.openPopup();
		}
    });

}



//Add polygon features to the map
function createChoropleth(response, map, attributes){
	
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(response, {
		onEachFeature: function(feature,layer){
			return onEachFeature(feature,attributes,layer)
		},
		style: function (feature) {		
			return style(feature, attributes);
			
		}
    }).addTo(map);

};



//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 15;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    //console.log(attribute);
    
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
    var popupContent = "<p><b>State:</b> " + feature.properties.name + "</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("g")[1];
    popupContent += "<p><b>Education Spending in " + year + ":</b> " + feature.properties[attribute] + " billion $US</p>";
	

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius),
		closeButton: false
    });
	
	    //event listeners to open popup on hover
    layer.on({
        /*mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },*/
		click: function(){
            this.openPopup();
        }
	
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


//Add circle markers for point features to the map
function createPropSymbols(response, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
 
	L.geoJson(response, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);


};


//build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Spending") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};


//Step 2: Import GeoJSON data
function getDataChoro(mapprop,mapchoro){
    //load the data
    $.ajax("data/PolygonData.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);			
			createChoropleth(response, mapchoro, attributes);
            createSequenceControls(mapprop,mapchoro,attributes);
        }
    });

};

function getDataProp(mapprop,mapchoro){
    //load the data

    $.ajax("data/Data.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);			
			createPropSymbols(response, mapprop, attributes);
            //createPropSequenceControls(map, attributes, mapindex);
			createSequenceControls(mapprop,mapchoro,attributes);
        }
    });

};


//Step 1: Create new sequence controls
function createSequenceControls(mapprop,mapchoro,attributes){
    //create range input element (slider)
	
    var p = document.getElementById('panel').children;
	
	if ((p.length) == 0 ){
		$('#panel').append('<input class="range-slider" type="range">');
	}else{
		console.log("slider exists");
	}
	
    //set slider attributes
    $('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });
    
    //Step 5: click listener for buttons
	/*
	$('.skip').click(function(){
		var index = $('.range-slider').val();
		//get the old index value		 
		//Step 6: increment or decrement depending on button clicked
		if ($(this).attr('id') == 'forward'){
			index++;
			//Step 7: if past the last attribute, wrap around to first attribute
			index = index > 6 ? 0 : index;
			$('.range-slider').val(index);
			
			//Called in both skip button and slider event listener handlers
			//Step 9: pass new attribute to update symbols
			updateChoropleth(mapchoro, attributes[index]);
			updatePropSymbols(mapprop, attributes[index]);
			console.log('index',index);
		} else if ($(this).attr('id') == 'reverse'){
			index--;
			//Step 7: if past the first attribute, wrap around to last attribute
			index = index < 0 ? 6 : index;
			
			$('.range-slider').val(index);
			
			//Called in both skip button and slider event listener handlers
			//Step 9: pass new attribute to update symbols
			updateChoropleth(mapchoro, attributes[index]);
			updatePropSymbols(mapprop, attributes[index]);
			console.log('index',index);			
		};	
		//Step 8: update slider

	});   	        
   
   */
    //Step 5: input listener for slider
    $('.range-slider').on('input', function(){
        //Step 6: get the new index value
		var index = $(this).val();
		updateChoropleth(mapchoro, attributes[index]);			
		updatePropSymbols(mapprop, attributes[index]);

    });
	
};

//Step 10: Recolor polygon symbols according to new attribute values
function updateChoropleth(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
			layer.setStyle({
				fillColor: getColor(props[attribute]),
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: 0.7
			});

            //add city to popup content string
            var popupContent = "<p><b>State:</b> " + props.name + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.split("g")[1];
            popupContent += "<p><b>Education Spending in " + year + ":</b> " + props[attribute] + " billion $US</p>";

            //replace the layer popup
            layer.bindPopup(popupContent);
        };
    });
};



//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>State:</b> " + props.name + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.split("g")[1];
            popupContent += "<p><b>Education Spending in " + year + ":</b> " + props[attribute] + " billion $US</p>";

            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
        };
    });
};


//below Example 3.4...add skip buttons
//$('#panel').append('<button class="skip" id="reverse">Reverse</button>');
//$('#panel').append('<button class="skip" id="forward">Skip</button>');

//Below Example 3.5...replace button content with images
//$('#reverse').html('<img src="img/reverse.png">');
//$('#forward').html('<img src="img/forward.png">');




$(document).ready(createMap);

