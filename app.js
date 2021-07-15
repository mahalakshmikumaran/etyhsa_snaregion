const d3Tableau = () => {
	//required to sync with tableau dashboard
	const initAsync = () => {
		return tableau.extensions.initializeAsync();
	};

	//getDataTable from a certain Sheet within the Dashboard
	const getDataTable = (sheetName) => {
		const worksheets =
			tableau.extensions.dashboardContent.dashboard.worksheets;
		var worksheet = worksheets.find(function (sheet) {
			return sheet.name === sheetName;
		});
		console.log(worksheet);
		return worksheet.getSummaryDataAsync().then(function (worksheetData) {
			return [worksheetData, worksheet];
		});
	};

	//give our datatable headers
	const getLinksFields = (dataTable) => {
		const fieldIdx_links = (fieldName) => {
			const field = dataTable.columns.find(
				(column) => column.fieldName === fieldName
			);
			return field.index;
		};
		const list = [];
		for (const [i, row] of dataTable.data.entries()) {
			list.push({
				source: row[fieldIdx_links("Source")].value,
				target: row[fieldIdx_links("Target")].value,
			});
		}
		return list;
	};

	const getNodeFields = (dataTable) => {
		const fieldIdx = (fieldName) => {
			const field = dataTable.columns.find(
				(column) => column.fieldName === fieldName
			);
			return field.index;
		};

		const list = [];

		for (const [i, row] of dataTable.data.entries()) {
			list.push({
				index: i,
				ID: row[fieldIdx("ID")].value,
				Case_Variant: row[fieldIdx("Case Variant")].value,
				Case_ID: row[fieldIdx("Case ID")].value,
				Case_Zone: row[fieldIdx("Case Zone")].value,
				contactRecordType: row[fieldIdx("Contact Recordtype")].value,
				contactVoc: row[fieldIdx("Contact VOC")].value,
				contactId: row[fieldIdx("Contact ID")].value,
				idLabel: row[fieldIdx("Id Label")].value,
				RECORD_TYPE: row[fieldIdx("Record Type")].value,
				testResultDate: row[fieldIdx("Test Result Date")].value,
				VARIANT: row[fieldIdx("Variant")].value,
				Variant_Identified_Date:
					row[fieldIdx("Variant Identified Date")].value,
			});
		}
		return list;
	};

	async function getData() {
		//initialize
		const initialize = await initAsync();

		//links
		const [linksDataTable, linksSheet] = await getDataTable("links_table");
		const linksFields = await getLinksFields(linksDataTable);

		//nodes
		const [nodeDataTable, nodeSheet] = await getDataTable("node_table");
		const nodeFields = await getNodeFields(nodeDataTable);

		//combine nodes & links into d3_data

		d3_data = { nodes: nodeFields, links: linksFields };
		originalFields = { ...d3_data };
		console.log("originalFields", originalFields);

		//Event Listeners, nodes & lniks
		//filter event handlers functions
		async function linksFilterChangedHandler() {
			console.log("links filter triggered");
		}

		async function nodeFilterChangedHandler(originalFields) {
			console.log("node filter triggered");

			//nodes
			const [nodeDataTable, nodeSheet] = await getDataTable("node_table");
			const nodeFields = await getNodeFields(nodeDataTable);

			const [linksDataTable, linksSheet] = await getDataTable(
				"links_table"
			);
			const linksFields = await getLinksFields(linksDataTable);

			const originalLinksFields = originalFields.links;
			console.log("originalLinksFields", originalLinksFields);

			//Ensure all nodes that are in filtered table remain, as well as all nodes that are targets of nodes in table
			//all nodes from filtered table = nodeFields
			//targets = iterate over links.source[i].id, push links[i] to new array

			console.log("nodeFields", nodeFields);

			const finalNodeField = [...nodeFields];

			filteredLinks = [];

			for (let i = 0; i < originalLinksFields.length; i++) {
				if (
					nodeFields.some(
						(e) => e.ID === originalLinksFields[i].source
					)
				) {
					filteredLinks.push({
						source: originalLinksFields[i].source,
						target: originalLinksFields[i].target,
					});
				} else {
					// console.log(
					// 	"not found",
					// 	originalLinksFields[i].source.ID,
					// 	"i",
					// 	i
					// );
				}
			}

			console.log("filteredLinks", filteredLinks);

			const filtered_d3_data = {
				nodes: nodeFields,
				links: filteredLinks,
			};

			console.log(filtered_d3_data);

			d3_functions(filtered_d3_data, true, nodeSheet);
		}

		//add Listeners
		nodeSheet.addEventListener(
			tableau.TableauEventType.FilterChanged,
			function () {
				nodeFilterChangedHandler(originalFields);
			}
		);

		linksSheet.addEventListener(
			tableau.TableauEventType.FilterChanged,
			linksFilterChangedHandler()
		);

		d3_functions(d3_data, false);
	}

	getData();

	d3_functions = (d3_data, svgCreated) => {
		//////////////////////////////////////////////////////
		// Developed by Moushir Elbishouty - AHS - 2021 March
		// Developed by Moushir Elbishouty - AHS - 2021 March
		//////////////////////////////////////////////////////
		if (svgCreated) {
			d3.selectAll("svg > *").remove();
			console.log("remove svg");
		}

		var svg = d3.select("svg");

		console.log("svg", svg);

		var width = +svg.attr("width");
		var height = +svg.attr("height");

		//Zoom
		var g = svg.append("g").attr("class", "everything");

		//ForceSimulation
		var simulation = d3
			.forceSimulation()
			.force("charge", d3.forceManyBody().strength(-10))
			.force("center", d3.forceCenter(width / 2, height / 2))
			.force(
				"link",
				d3.forceLink().id((d) => d.ID)
			);

		//Arrow
		var marker = g
			.append("marker")
			.attr("id", "resolved")
			.attr("markerUnits", "userSpaceOnUse")
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 10)
			.attr("refY", 0)
			.attr("markerWidth", 6)
			.attr("markerHeight", 6)
			.attr("orient", "auto")
			.attr("stroke-width", 1)
			.append("path")
			.attr("d", "M0,-5L10,0L0,5")
			.attr("fill", "#000000");

		//Tooltip
		var tooltip = d3
			.select("body")
			.append("div")
			.attr("class", "tooltip")
			.style("position", "absolute")
			.style("padding", "10px")
			.style("z-index", "10")
			.style("width", "300px")
			.style("height", "80px")
			.style("background-color", "rgba(230, 242, 255, 0.8)")
			.style("border-radius", "5px")
			.style("visibility", "hidden")
			.text("");

		async function drawData(d3_data) {
			const graph = d3_data;
			//const graph = await d3.json("./VOC_ALL_Links_No_Null.json");
			console.log("graph", graph);
			var link = g
				.append("g")
				.attr("class", "links")
				.selectAll("line")
				.data(graph.links)
				.enter()
				.append("line");

			var node = g
				.append("g")
				.attr("class", "nodes")
				.selectAll("circle")
				.data(graph.nodes)
				.enter()
				.append("circle")
				.attr("r", 2.5)
				.style("fill", nodeColor)
				.on("mouseover", handleMouseOver)
				.on("mouseout", handleMouseOut)
				.call(
					d3
						.drag()
						.on("start", dragstarted)
						.on("drag", dragged)
						.on("end", dragended)
				);

			simulation
				.nodes(graph.nodes)
				.on("tick", ticked)
				.force("link")
				.links(graph.links);

			function ticked() {
				node.attr("cx", function (d) {
					return d.x;
				}).attr("cy", function (d) {
					return d.y;
				});
				link.attr("x1", function (d) {
					return d.source.x;
				})
					.attr("y1", function (d) {
						return d.source.y;
					})
					.attr("x2", function (d) {
						return d.target.x;
					})
					.attr("y2", function (d) {
						return d.target.y;
					})
					.attr("marker-end", "url(#resolved)");
			}
		}

		//Zoom capabilities
		var zoom_handler = d3.zoom().on("zoom", zoom_actions);

		zoom_handler(svg);

		function dragstarted(d) {
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
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

		function nodeColor(node) {
			var color;
			if (node.Case_Zone == "Calgary") color = "pink";
			if (node.Case_Zone == "Edmonton") color = "green";
			if (node.Case_Zone == "Central") color = "red";
			if (node.Case_Zone == "Alberta Health") color = "rgb(0, 94, 133)";
			if (node.Case_Zone == "North") color = "black";
			if (node.Case_Zone == "Unknown") color = "lightblue";

			return color;
		}

		function recordType(node) {
			var type;
			if (node.RECORD_TYPE == "CI - Not Tested") type = "Not Tested";
			if (node.RECORD_TYPE == "CI - Tested Negative") type = "Tested Negative";
			if (node.RECORD_TYPE == "DI - VOC Positive") type = "VOC Positive";
			if (node.RECORD_TYPE == "DI - Wild Type") type = "Wild Type";

			return type;
		}

		function dateConvert(datetext) {
			var months = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
			var dd = datetext.slice(2,4);
			var mmm = datetext.slice(4,7);
			var yyyy = datetext.slice(7,11);
			return new Date(yyyy, months[mmm], dd);
		}

		function handleMouseOver(node) {
			var datevalue = dateConvert(node.Variant_Identified_Date).toDateString();
			var htmlContent = "<div>";
			htmlContent += "Variant: " + node.VARIANT + "<br>";
			htmlContent += "Identified Date: " + datevalue + "<br>";
			htmlContent += "ID: " + node.ID + "<br>";
			htmlContent += "Zone: " + node.Case_Zone + "<br>";
			htmlContent += "Record Type: " + recordType(node) + "<br>";
			htmlContent += "</div>";
			tooltip.html(htmlContent);
			return tooltip
				.style("top", d3.event.pageY - 10 + "px")
				.style("left", d3.event.pageX + 10 + "px")
				.style("visibility", "visible");
		}

		function handleMouseOut(node) {
			return tooltip.style("visibility", "hidden");
		}

		//Zoom functions
		function zoom_actions() {
			g.attr("transform", d3.event.transform);
		}

		drawData(d3_data);
	};
};

d3Tableau();
