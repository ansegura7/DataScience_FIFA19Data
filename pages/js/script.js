// Init parameters
var ast = [],
    util = [];
ast.width = 1000;
ast.height = 800;

// Init dynamic components
ast.init = () => {

	// Fire main event
	ast.loadData();
}

// Load yearly data and charts
ast.loadData = () => {
	let filepath = "https://raw.githubusercontent.com/ansegura7/DataScience_FIFA19Data/master/data/";
	let filename = filepath + "fifa19_pca_data_best500.csv";
	
	d3.csv(filename).then(
		function(rawdata) {
			// Load data and apply quality process
			ast.data = rawdata;
			ast.data.forEach(function(d, i) {
				d.Name = util.normalize(d.Name);
				d.Nationality = util.normalize(d.Nationality);
				d.Club = util.normalize(d.Club);
				d.PC1 = +d.PC1;
				d.PC2 = +d.PC2;
				d.Overall = +d.Overall;
				d.Potential = +d.Potential;
			});
			
			ast.loadFilters(ast.data);
			ast.createNetworks(ast.data);
		},
		function(error) {
			// Error log message
			console.log(error);
		}
	);
}

// Derive current data and create Networks
ast.createNetworks = (currData) => {
	ast.playerList = {},
	ast.positionList = {},
	ast.zoneList = {},
	ast.linkList = {};

	// Load and parse current data
	currData.forEach(function(d, i) {		
		let player = d.Name;
		let position = d.Position;
		let zone = d.Zone;
		let playerPosition = player + "|" + position;
		let positionZone = position + "|" + zone;
		
		util.addCounterToDict(ast.playerList, player);
		util.addCounterToDict(ast.zoneList, zone);
		util.addCounterToDict(ast.positionList, position);
		util.addCounterToDict(ast.linkList, playerPosition);
		util.addCounterToDict(ast.linkList, positionZone);
	});
	
	// Create Network chart
	ast.changeOrder();
}

ast.loadFilters = (currData) => {
	var nationalityList = util.getDistinctValueFromJsonArray(currData, "Nationality", "All");
	var clubList = util.getDistinctValueFromJsonArray(currData, "Club", "All");
	
	util.addComboBoxData("cmbNationality", nationalityList, "All");
	util.addComboBoxData("cmbClub", clubList, "All")
}

ast.filterData = () => {
	let currNationality = d3.select("#cmbNationality").node().value;
	let currClub = d3.select("#cmbClub").node().value;
	
	var currData = JSON.parse(JSON.stringify(ast.data));
	if (currNationality != "All")
		currData = currData.filter(d => d.Nationality === currNationality);
	if (currClub != "All")
		currData = currData.filter(d => d.Club === currClub);
	
	console.log("currNationality:" + currNationality + ", currClub: " + currClub + ", Original data size: " + ast.data.length + ", Filtered data size: " + currData.length);
	ast.createNetworks(currData);
}

ast.changeOrder = () => {
	let orderType = d3.select("#cmbOrder").node().value.toLowerCase();
	
	// Charts variables
	let xTitle = "Count";
	let yTitle = "";
	let cTitle = "Players by Zones";
	let svgNetwork1 = d3.select("#svgNetwork1");

	// Update data
	let nodes = [],
		links = [];
	util.addDictToJsonArray(nodes, ast.playerList, 'Player');
	util.addDictToJsonArray(nodes, ast.positionList, 'Position');
	util.addDictToJsonArray(nodes, ast.zoneList, 'Zone');
	util.addDictToJsonArrayWithSplit(links, ast.linkList, '|');
	
	// Chart 1 - Line chart
	let ordered = (orderType.indexOf("no") == -1);
	ast.doNetworkChart(svgNetwork1, nodes, links, xTitle, yTitle, cTitle, ordered);
}

// Create Network chart
ast.doNetworkChart = (svg, nodes, links, xTitle, yTitle, cTitle, ordered) => {
	svg.html("");

	// Network margins
	let margin = {top: 20, right: 20, bottom: 20, left: 20},
		iwidth = ast.width - margin.left - margin.right,
		iheight = ast.height - margin.top - margin.bottom;

	// Legend - Item list
	let legendList = ["Player", "Position", "Goalkeper", "Defense", "Midfield", "Attack"];
	let legendColors = ["#9467bd", "#8c564b", "#dc3912", "#3366cc", "#ff9900", "#109618"];
	
 	// Create scales
	let c = d3.scaleOrdinal()
				.domain(legendList)
				.range(legendColors),
		r = d3.scaleOrdinal()
				.domain(["Player", "Position", "Zone"])
				.range([3, 5, 7]),
		y = d3.scaleLinear()
				.domain([1, util.getMaxValue(nodes, "count")])
				.range([iheight, margin.bottom]),
		x = d3.scaleLinear()
				.domain([0, 90])
				.range([0, iwidth]);
	
    // Nodes tooltip
    let tooltip = svg.append("text");
    let adjlist = [];
	
	ast.nodes = nodes;
	ast.links = links;
	
	// Simulation Force
	let simulation = d3.forceSimulation(nodes);

	if (ordered) {
		simulation
			.force("center", d3.forceCenter(260, iheight / 2))
			.force("charge", d3.forceManyBody()
				.strength(-2.5))
			.force("x", d3.forceX((d) => { return (d.group == "Zone" ? x(d.count) * 1.7 : (d.group == "Position" ? x(d.count) * 1.3 : x(d.count))) })
				.strength(0.1))
			.force("collide", d3.forceCollide(d => r(d.group) + 1))
			.force("link", d3.forceLink(links)
				.id((d) => d.name)
				.distance(30)
				.strength(0.15))
			.on("tick", ticked);
	}
	else {
		simulation
			.force("charge", d3.forceManyBody()
				.strength(-25))
			.force("x", d3.forceX(iwidth/2 + 20)
				.strength(0.1))
			.force("y", d3.forceY(iheight/2 + 20)
				.strength(0.1))
			.force("collide", d3.forceCollide(d => r(d.group) + 1))
			.force("link", d3.forceLink(links)
				.id((d) => d.name)
				.distance(30)
				.strength(0.45))
			.on("tick", ticked);
	}

	// Drawing links
	let selLinks = svg.selectAll(".link")
		.data(links)
		.enter()
		.append("line")
		.attr("class", "link")
		.attr("stroke", "#aaa")
		.style("stroke-width", "2px")
		.style("opacity", 0.5)

	// Drawing nodes
	let selNodes = svg.selectAll(".node")
		.data(nodes)
		.enter()
		.append("circle")
		.attr("class", "node")
		.style("fill", (d) => { return (d.group == "Zone" ? c(d.name) : c(d.group)) })
		.attr("r", (d) => r(d.group))
		.on("mouseover", (d) => {
			tooltip.text(d.name)
				.transition()
				.duration(500)
				.attr("x", d.x + 5)
				.attr("y", d.y + 5);
		})
		.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended));

	selNodes.append("title")
		.text(d => (d.name  + " [weight = " + d.count + "]"))
		.style("fill", "#000000")
		.style("font-family", "Calibri")
        .style("font-size", 12);
				
	// Focus/Unfocus events
	selNodes.on("mouseover", focus)
		.on("mouseout", unfocus);
	selNodes.on("mouseover", focus)
		.on("mouseout", unfocus);

	links.forEach(function(d) {
		adjlist[d.source.index + "-" + d.target.index] = true;
    	adjlist[d.target.index + "-" + d.source.index] = true;
	});

	let g = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	// Add title
	g.append("text")
		.attr("x", (iwidth / 2))
		.attr("y", (10 - margin.top))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.style("font-family", "sans-serif")
		.style("font-size", "16pt")
		.text(cTitle)
		.style("color", "steelblue");

	if (ordered) {
		// Add width scale
		g.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + (iheight*0.91) + ")")  
			.style("font-size", "12px")
			.call(d3.axisBottom(x));
		
		// text label for the x axis
		g.append("text")
			.attr("x", (iwidth / 2))
			.attr("y", (iheight * 0.94))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.style("font-family", "sans-serif")
			.style("font-size", "11pt")
			.text(xTitle);
	}

	// Add legend
	var legend = g.append("g")
    	.attr("transform", "translate(" + (iwidth*0.16) + "," + (iheight*0.985) + ")");
	
	legend.selectAll(".circle")
		.data(legendList)
		.enter()
		.append("circle")
		.attr("class", "circle")
		.style("fill", (d, i) => { return legendColors[i] })
		.attr("r", "8")
		.attr("cx", (d, i) => { return i*120; })
		.attr("cy", (d, i) => { return 10; });

	legend.selectAll("text")
		.data(legendList)
		.enter()
		.append("text")
		.attr("x", (d, i) => { return 14 + (i*120); })
		.attr("y", "1em")
		.attr("font-size", 15)
		.text((d, i) => {
			return legendList[i];
		});
	
	svg.append("line")
		.attr("x1", x(0))
		.attr("y1", iheight)
		.attr("x2", x(iwidth))
		.attr("y2", iheight)
		.style("stroke-width", 1)
		.style("stroke", "#337ab7")
		.style("fill", "none");
	
	// Begin Nodes events
	function ticked() {
		selLinks
			.attr("x1", (l) => l.source.x)
			.attr("y1", (l) => l.source.y)
			.attr("x2", (l) => l.target.x)
			.attr("y2", (l) => l.target.y);

		selNodes
			.attr("cx", (n) => n.x)
			.attr("cy", (n) => n.y);
	}

	function dragstarted(d) {
		if (!d3.event.active) simulation.alphaTarget(0.4).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragended(d) {
		if (!d3.event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}

	function focus(d) {
		var index = d3.select(d3.event.target).datum().index;
		selNodes.style("opacity", function(o) {
			return neigh(index, o.index) ? 1 : 0.1;
		});
		selLinks.style("opacity", function(o) {
			return o.source.index == index || o.target.index == index ? 1 : 0.1;
		});
	}
    
    function unfocus() {
		selNodes.style("opacity", 1);
		selLinks.style("opacity", 1);
	}

	function neigh(a, b) {
		return a == b || adjlist[a + "-" + b];
	}
	// End Nodes events
}

/********* Start Utility Functions *********/
util.addDictToJsonArray = (list, dict, category) => {
	let node = {};
	for(var k in dict) {
		node = { name: k, group: category, count: dict[k] }
		list.push(node);
	}
}

util.addDictToJsonArrayWithSplit = (list, dict, token) => {
	let node = {};
	for(var k in dict) {
		let params = ("" + k).split(token);
		let s = params[0];
		let t = params[1];
		node = { source: s, target: t , count: 0} //dict[k]}
		list.push(node);
	}
}

util.addCounterToDict = (dict, elem) => {
	elem = elem.trim();
	if (!(elem in dict))
		dict[elem] = 1;
	else
		dict[elem]++;
}

util.getMinValue = (data, varname) => {
	return d3.min(data, (d) => d[varname]);
}

util.getMaxValue = (data, varname) => {
	return d3.max(data, (d) => d[varname]);
}

util.titleCase = (str) => {
	var splitStr = str.toLowerCase().split(' ');
	for (var i = 0; i < splitStr.length; i++) {
		splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
	}
	return splitStr.join(' ').trim(); 
}

util.normalize = (word) => {
	word = word.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
	return util.titleCase(word);
}

// Add data types to ComboBox
util.addComboBoxData = (cmbID, varList, defValue) => {
	var options = d3.select("#"+cmbID);

	const addItem = (d, i) => options
		.append("option")
		.text(d)
		.attr("value", d)
		.property("selected", (d == defValue));
	
	varList.forEach(addItem);
}

util.getDistinctValueFromJsonArray = (items, column, defaultValue) => {
	var lookup = {};
	var result = [];
	
	for (var item, i = 0; item = items[i++];) {
		var cellValue = item[column];
		if (cellValue && !(cellValue in lookup)) {
			lookup[cellValue] = 1;
			result.push(cellValue);
		}
	}
	result = result.sort()
	
	if (defaultValue && defaultValue != "")
		result = [defaultValue].concat(result);
	
	return result;
}
/********** End Utility Fundtions **********/