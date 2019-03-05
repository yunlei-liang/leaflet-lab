/* Module 5B java script by Yunlei Liang, 2019 */


//function to instantiate the Leaflet map

function createMap(){
    //create the map
    var map = L.map('map', {
        center: [38,-94],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
	

	var legend = L.control({position: 'bottomright'});

	legend.onAdd = function (map) {

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
		
	legend.addTo(map);
	
};


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


var geojson;

//Example 2.1 line 34...Add circle markers for point features to the map
function createChoropleth(data, map, attributes){
	
    //create a Leaflet GeoJSON layer and add it to the map
    geojson = L.geoJson(data, {
		onEachFeature: function(feature,layer){
			return onEachFeature(feature,attributes,layer)
		},
		style: function (feature) {		
			return style(feature, attributes);
			
		}
    }).addTo(map);
};


//Above Example 3.8...Step 3: build an attributes array from the data
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
function getData(map){
    //load the data
    $.ajax("data/Data.geojson", {
        dataType: "json",
        success: function(response){
            
            //create an attributes array
            var attributes = processData(response);

            createChoropleth(response, map, attributes);
            createChoroSequenceControls(map, attributes);
        }
    });
};




//Step 1: Create new sequence controls
function createChoroSequenceControls(map, attributes){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');

    //set slider attributes
    $('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });
    
    //Step 5: click listener for buttons
    $('.skip').click(function(){
        //get the old index value
        var index = $('.range-slider').val();

        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 6 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 6 : index;
        };

        //Step 8: update slider
        $('.range-slider').val(index);
        
        //Called in both skip button and slider event listener handlers
        //Step 9: pass new attribute to update symbols
        updateChoropleth(map, attributes[index]);
                
    });
    
    //Step 5: input listener for slider
    $('.range-slider').on('input', function(){
        //Step 6: get the new index value
        var index = $(this).val();
		updateChoropleth(map, attributes[index]);
    });
	
};

//Step 10: Resize proportional symbols according to new attribute values
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

//below Example 3.4...add skip buttons
$('#panel').append('<button class="skip" id="reverse">Reverse</button>');
$('#panel').append('<button class="skip" id="forward">Skip</button>');

//Below Example 3.5...replace button content with images
$('#reverse').html('<img src="img/reverse.png">');
$('#forward').html('<img src="img/forward.png">');



$(document).ready(createMap);


