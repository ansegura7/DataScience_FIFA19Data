// Init parameters
var ast = { "width": 1000, "height": 800, "bImage": false, "photoList": {}},
    util = {};

// Init dynamic components
ast.init = () => {

	// Fire main event
	setTimeout(() => {
		ast.loadData();
	}, 10);
}

// Load dataW
ast.loadData = () => {
	let filepath = "https://raw.githubusercontent.com/ansegura7/DataScience_FIFA19Data/master/data/";
	let filename = filepath + "fifa19_pca_data_best500.csv";
	
	d3.csv(filename).then(
		function(rawdata) {
			
			// Load data and apply quality process
			rawdata.forEach(function(d, i) {
				d.Name = util.normalize(d.Name);
				d.Nationality = util.normalize(d.Nationality);
				d.Club = util.normalize(d.Club);
				d.PC1 = +d.PC1;
				d.PC2 = +d.PC2;
				d.Overall = +d.Overall;
				d.Potential = +d.Potential;
				ast.photoList[d.Name] = d.Photo;
			});
			
			// Save and show data
			ast.data = rawdata;
			ast.loadFilters(ast.data);
			ast.createNetworks(ast.data);
		},
		function(error) {
			// Error log message
			console.log(error);
		}
	);
}

/********** Begin Events Fundtions **********/
ast.evShowNetworks = () => {
	ast.evFilterData();
}

ast.evFilterData = () => {
	let currNationality = d3.select("#cmbNationality").node().value;
	let currClub = d3.select("#cmbClub").node().value;
	
	var currData = JSON.parse(JSON.stringify(ast.data));
	if (currNationality != "All")
		currData = currData.filter(d => d.Nationality === currNationality);
	if (currClub != "All")
		currData = currData.filter(d => d.Club === currClub);
	
	ast.createNetworks(currData);
}

ast.evActivePlayerImage = (checked) => {
	ast.bImage = checked;
	ast.evFilterData();
}
/*********** End Events Fundtions ***********/

// Load the page filters into combobox
ast.loadFilters = (currData) => {
	var variableList = ["Overall", "Potential", "ShortPassing", "Volleys", "Dribbling", "FKAccuracy", "LongPassing", "SprintSpeed", "Agility", "ShotPower", "Jumping", "Stamina", "Strength"].sort();
	var nationalityList = util.getDistinctValueFromJsonArray(currData, "Nationality", "All");
	var clubList = util.getDistinctValueFromJsonArray(currData, "Club", "All");
	
	util.addComboBoxData("cmbVariable", variableList, "");
	util.addComboBoxData("cmbNationality", nationalityList, "All");
	util.addComboBoxData("cmbClub", clubList, "All")
}

// Derive current data and create Networks
ast.createNetworks = (currData) => {
	ast.playerList = {},
	ast.positionList = {},
	ast.zoneList = {},
	ast.linkList = {};

	// Create Network chart
	let orderType = d3.select("#cmbOrder").node().value.toLowerCase() || "No Ordered";
	let currVariable = d3.select("#cmbVariable").node().value || "Overall";

	// Load and parse current data
	currData.forEach(function(d, i) {		
		let player = d.Name;
		let position = d.Position;
		let zone = d.Zone;
		let playerPosition = player + "|" + position;
		let positionZone = position + "|" + zone;
		let vWeigth = d[currVariable];
		
		if (vWeigth && vWeigth > 0) {
			
			if (!(zone in ast.zoneList)) ast.zoneList[zone] = 1;
			if (!(position in ast.positionList)) ast.positionList[position] = 20;
			util.addOrUpdateToDict(ast.playerList, player, vWeigth);
			util.addCounterToDict(ast.linkList, playerPosition);
			util.addCounterToDict(ast.linkList, positionZone);
		}
	});

	// Update data
	let nodes = [],
		links = [];
	util.addDictToJsonArray(nodes, ast.playerList, "Player");
	util.addDictToJsonArray(nodes, ast.positionList, "Position");
	util.addDictToJsonArray(nodes, ast.zoneList, "Zone");
	util.addDictToJsonArrayWithSplit(links, ast.linkList, "|");

	// Network variables
	let xTitle = "";
	let yTitle = "Weight";
	let cTitle = "Force-Directed Graph of Players";
	let svgNetwork = d3.select("#svgNetwork1");
	let ordered = (orderType.indexOf("no") == -1);
	let avgValue = util.sumValueJsonArray(currData, currVariable);
	ast.doNetworkChart(svgNetwork, nodes, links, xTitle, yTitle, cTitle, ordered, ast.bImage, avgValue);
}

// Create Network diagram
ast.doNetworkChart = (svg, nodes, links, xTitle, yTitle, cTitle, ordered, bImage, threshold) => {
	svg.empty();
	svg.html("");

	// Network margins
	let margin = {top: 30, right: 20, bottom: 30, left: 20},
		iwidth = ast.width - margin.left - margin.right,
		iheight = ast.height - margin.top - margin.bottom;

	// Chart variables
	let adjlist = [];
	let legendList = ["Player", "Position", "GoalKeper", "Defense", "Midfield", "Attack"];
	let legendColors = ["#9467bd", "#8c564b", "#dc3912", "#3366cc", "#ff9900", "#109618"];
	let nNodes = nodes.length;

 	// Create scales
	let c = d3.scaleOrdinal()
				.domain(legendList)
				.range(legendColors),
		r = d3.scaleOrdinal()
				.domain(["Player", "Position", "Zone"])
				.range([3, 5, 7]),
		x = d3.scaleLinear()
				.domain([0, 100])
				.range([0, iwidth]),
		y = d3.scaleLinear()
				.domain([0, 100])
				.range([0, iheight - 30]);
	
	// Simulation Force system
	let simulation = d3.forceSimulation(nodes);
	
	if (ordered) {
		simulation
			.force("center", d3.forceCenter((iwidth / 2 - 10), (iheight * 2 / 3)))
			.force("charge", d3.forceManyBody()
				.strength(-5))
			.force("y", d3.forceY((d) => y(d.weight))
				.strength(4))
			.force("collide", d3.forceCollide(d => r(d.group) * 3))
			.force("link", d3.forceLink(links)
				.id((d) => d.name)
				.distance(40)
				.strength(0.25))
			.on("tick", ticked);
	}
	else {
		simulation
			.force("charge", d3.forceManyBody()
				.strength(-30))
			.force("x", d3.forceX(iwidth/2 + 20)
				.strength(0.08))
			.force("y", d3.forceY(iheight/2)
				.strength(0.1))
			.force("collide", d3.forceCollide(d => r(d.group) * 2))
			.force("link", d3.forceLink(links)
				.id((d) => d.name)
				.distance(40)
				.strength(0.5))
			.on("tick", ticked);
	}
	
	// Create adjacency matrix
	links.forEach(function(d) {
		adjlist[d.source.index + "-" + d.target.index] = true;
    adjlist[d.target.index + "-" + d.source.index] = true;
	});
	
	// Drawing links
	let selLinks = svg.selectAll(".link")
		.data(links)
		.enter()
		.append("line")
		.attr("class", "link")
		.attr("stroke", "#aaa")
		.style("stroke-width", "2px")
		.style("opacity", 0.6);

	// Drawing nodes
	let selNodes = svg.selectAll(".node")
		.data(nodes)
		.enter()
		.append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
		.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended));
	
	// Add circle to node
	selNodes.append("circle")
		.style("fill", (d) => { return (d.group == "Zone" ? c(d.name) : c(d.group)) })
		.attr("r", (d) => r(d.group))
		.attr("stroke", "#090909")
    .style("stroke-width", 1);
	
	// Add text to position nodes
	selNodes.append("text")
		.attr("dy", ".35em")    
		.style("font-size", "10pt")
		.attr("x", "6")
		.text((d) => { return (d.group == "Position" ? d.name.toUpperCase() : "") });
	
	// Add tooltip text to node
	selNodes.append("title")
		.text(d => (d.name  + " [weight = " + d.weight + "]"))
		.style("fill", "#000000")
		.style("font-family", "Calibri")
		.style("font-size", "11pt");
	
	if(bImage) {
		selNodes.append("image")
			.attr("xlink:href", (d) => { return (d.group == "Player" ? ast.photoList[d.name] : "") }) 
			.attr("x", "-16")
			.attr("y", "-16")
			.attr("width", 32)
			.attr("height", 32);
	}
	
	// Focus/Unfocus events
	selNodes.on("mouseover", focus)
		.on("mouseout", unfocus);
	selNodes.on("mouseover", focus)
		.on("mouseout", unfocus);
	
	// Graph object
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
		.style("fill", "black");
	
	// Add sub-title
	g.append("text")
		.attr("x", (iwidth - 40))
		.attr("y", (iheight - 35))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.style("font-family", "sans-serif")
		.style("font-size", "12pt")
		.text("# Nodes: " + nNodes)
		.style("fill", "black");

	// Add Y scale
	if (ordered) {
		g.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(" + margin.left + ", 0)")  
			.style("font-size", "12px")
			.call(d3.axisLeft(y));

		// Add threshold line
		if (threshold) {
			let thColor = d3.schemeCategory10[0];
			svg.append("line")
				.attr("x1", (2 * margin.left))
				.attr("y1", y(threshold))
				.attr("x2", x(iwidth))
				.attr("y2", y(threshold))
				.style("stroke", thColor)
				.style("stroke-dasharray", ("3, 3"));

			svg.append("text")
				.attr("x", (iwidth - 30))
				.attr("y",  y(threshold))
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.style("font-family", "sans-serif")
				.style("font-size", "10pt")
				.text("Var Mean: " + threshold)
				.style("fill", thColor);
		}
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
		.attr("stroke", "black")
    .style("stroke-width", 1)
		.attr("cx", (d, i) => { return i*120; })
		.attr("cy", (d, i) => { return 20; });
	
	legend.selectAll("text")
		.data(legendList)
		.enter()
		.append("text")
		.attr("x", (d, i) => { return 14 + (i*120); })
		.attr("y", margin.bottom - 5)
		.attr("font-size", 15)
		.text((d, i) => {
			return legendList[i];
		});
	
	svg.append("line")
		.attr("x1", x(0))
		.attr("y1", iheight + 20)
		.attr("x2", x(iwidth))
		.attr("y2", iheight + 20)
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
			.attr("transform", (n) => "translate(" + n.x + "," + n.y + ")");  
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

	// Node focus event
	function focus(d) {
		var index = d3.select(d3.event.target).datum().index;
		selNodes.style("opacity", function(o) {
			return neigh(index, o.index) ? 1 : 0.1;
		});
		selLinks.style("opacity", function(o) {
			return o.source.index == index || o.target.index == index ? 1 : 0.1;
		});
		d3.select(this).select("circle")
			.transition()
      .duration(500)
			.attr("r", (d) => r(d.group) * 3);
	}
	
	// Node unfocus event
  function unfocus() {
		selNodes.style("opacity", 1);
		selLinks.style("opacity", 0.6);
		d3.select(this).select("circle")
			.transition()
      .duration(300)
			.attr("r", (d) => r(d.group));
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
		node = { name: k, group: category, weight: dict[k] }
		list.push(node);
	}
}

util.addDictToJsonArrayWithSplit = (list, dict, token) => {
	let node = {};
	for(var k in dict) {
		let params = ("" + k).split(token);
		let s = params[0];
		let t = params[1];
		node = { source: s, target: t , weight: 0}
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

util.addOrUpdateToDict = (dict, elem, value) => {
	elem = elem.trim();
	if (!(elem in dict))
		dict[elem] = value;
	else
		dict[elem] += value;
}

util.sumValueJsonArray = (currdata, varname, colfilter, valfilter) => {
	if (colfilter && valfilter)
		currdata = currdata.filter((d) => d[colfilter] === valfilter);
	let value = d3.mean(currdata, (d) => d[varname]);
	return parseFloat(value).toFixed(2);
}

util.titleCase = (str) => {
	var splitStr = str.toLowerCase().split(" ");
	for (var i = 0; i < splitStr.length; i++) {
		splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
	}
	return splitStr.join(" ").trim(); 
}

util.normalize = (word) => {
	word = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
	return util.titleCase(word);
}

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