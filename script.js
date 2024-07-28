Promise.all([
    d3.json("/world.geojson.json"),
    d3.csv("/DataForTable2.1WHR2023.csv")
]).then(function(data) {
    const geojsonData = data[0];
    const happinessData = data[1];

    let happinessIndex = {};
    happinessData.forEach(d => {
        happinessIndex[d['Country name']] = +d['Life Ladder'];
    });

    geojsonData.features.forEach(d => {
        d.properties.lifeLadder = happinessIndex[d.properties.name] || 0;
    });

	const margin = { top: 20, right: 20, bottom: 30, left: 50 };
	const width = 960 - margin.left - margin.right;  
	const height = 600 - margin.top - margin.bottom; 

    const svg = d3.select('body').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);
	
    const projection = d3.geoNaturalEarth1();
    const pathGenerator = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain([0, 10]);

    svg.selectAll("path")
	   .data(geojsonData.features)
	   .enter()
	   .append("path")
	   .attr("d", pathGenerator)
	   .attr("fill", d => d.properties.lifeLadder ? colorScale(d.properties.lifeLadder) : '#ccc')
	   .attr("stroke", "#FFFFFF")
	   .attr("stroke-width", 0.5)
	   .on("mouseover", function(event, d) {
		   tooltip.transition()
				  .duration(200)
				  .style("opacity", .9);
		   tooltip.html(d.properties.name + "<br/>Happiness Score: " + (d.properties.lifeLadder || "N/A"))
				  .style("left", (event.pageX + 10) + "px")
				  .style("top", (event.pageY - 28) + "px");
	   })
	   .on("mouseout", function(d) {
		   tooltip.transition()
				  .duration(500)
				  .style("opacity", 0);
	   })
	   .on("click", function(event, d) {
		   updateLineChart(d.properties.name); 
		   updateBarChart(d.properties.name, 'Log GDP per capita');
	   });

    const tooltip = d3.select(".tooltip");

    svg.selectAll("path")
       .on("mouseover", function(event, d) {
           tooltip.transition()
                  .duration(200)
                  .style("opacity", .9);
           tooltip.html(d.properties.name + "<br/>Happiness Score: " + (d.properties.lifeLadder || "N/A"))
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px");
       })
       .on("mouseout", function(d) {
           tooltip.transition()
                  .duration(500)
                  .style("opacity", 0);
       });

	   
	const lineSvg = d3.select('body').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);
	   
	const xScale = d3.scaleTime().range([0, width]);
	const yScale = d3.scaleLinear().range([height, 0]); 

	const xAxis = d3.axisBottom(xScale).ticks(5);
	const yAxis = d3.axisLeft(yScale).ticks(5);

	lineSvg.append("g")
		.attr("transform", `translate(0, ${height})`)
		.attr("class", "x axis");

	lineSvg.append("g")
		.attr("class", "y axis");

	// Append x-axis title
	lineSvg.append("text")
		.attr("text-anchor", "end")
		.attr("x", width)
		.attr("y", height - 10)
		.text("Year");

	// Append y-axis title
	lineSvg.append("text")
		.attr("text-anchor", "end")
		.attr("transform", "rotate(-90)")
		.attr("y", 20)  
		.attr("x", 0) 
		.text("Happiness Score");


	function updateLineChart(country) {
		const data = happinessData.filter(d => d['Country name'] === country);
		xScale.domain(d3.extent(data, d => d3.timeParse("%Y")(d.year)));

		const minValue = d3.min(data, d => +d['Life Ladder']) - 0.5;
		const maxValue = d3.max(data, d => +d['Life Ladder']) + 0.5;
		yScale.domain([minValue < 0 ? 0 : minValue, maxValue]);

		lineSvg.selectAll(".line").remove();  
		lineSvg.selectAll(".circle").remove(); 

		const line = d3.line()
			.x(d => xScale(d3.timeParse("%Y")(d.year)))
			.y(d => yScale(+d['Life Ladder']));

		lineSvg.append("path")
			.data([data])
			.attr("class", "line")
			.attr("d", line)
			.attr("fill", "none")
			.attr("stroke", "steelblue");

		lineSvg.selectAll(".circle")
			.data(data)
			.enter().append("circle")
			.attr("class", "circle")
			.attr("cx", d => xScale(d3.timeParse("%Y")(d.year)))
			.attr("cy", d => yScale(+d['Life Ladder']))
			.attr("r", 5)  
			.attr("fill", "steelblue")
			.on("mouseover", (event, d) => {
				tooltip.transition()
					   .duration(200)
					   .style("opacity", .9);
				tooltip.html(`Year: ${d.year}<br/>Happiness Score: ${d['Life Ladder']}`)
					   .style("left", (event.pageX + 10) + "px")
					   .style("top", (event.pageY - 28) + "px");
			})
			.on("mouseout", (d) => {
				tooltip.transition()
					   .duration(500)
					   .style("opacity", 0);
			});

		// Update the axes
		lineSvg.select(".x.axis").call(xAxis);
		lineSvg.select(".y.axis").call(yAxis);
	}


	const barSvg = d3.select('body').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);

	const xBarScale = d3.scaleBand()
		.range([0, width])
		.padding(0.1);

	const yBarScale = d3.scaleLinear()
		.range([height, 0]);

	barSvg.append("g")
		.attr("transform", `translate(0, ${height})`)
		.attr("class", "x-axis");

	barSvg.append("g")
		.attr("class", "y-axis");


	function normalizeValues(data, factors) {
		let normalizedData = {};

		factors.forEach(factor => {
			let factorValues = data.map(d => +d[factor]);
			let max = d3.max(factorValues);
			let min = d3.min(factorValues);

			normalizedData[factor] = data.map(d => {
				return {
					factor: factor,
					value: (d[factor] - min) / (max - min) 
				};
			});
		});

		return normalizedData;
	}


	function updateBarChart(country) {
		const data = happinessData.filter(d => d['Country name'] === country);

		const factors = ["Log GDP per capita", "Social support", "Healthy life expectancy at birth", 
						 "Freedom to make life choices", "Generosity", "Perceptions of corruption", 
						 "Positive affect", "Negative affect"];

		let averages = {};
		factors.forEach(factor => {
			averages[factor] = d3.mean(data, d => +d[factor]);
		});

		let normalizedAverages = normalizeValues(data, factors);

		let values = factors.map(factor => ({
			factor: factor,
			value: d3.mean(normalizedAverages[factor].map(d => d.value))
		}));

		xBarScale.domain(factors.map(d => d));
		yBarScale.domain([0, 1]);

		const bars = barSvg.selectAll(".bar")
			.data(values)
			.join("rect")
			.attr("class", "bar")
			.attr("x", d => xBarScale(d.factor))
			.attr("y", d => yBarScale(d.value))
			.attr("width", xBarScale.bandwidth())
			.attr("height", d => height - yBarScale(d.value))
			.attr("fill", "steelblue");

		barSvg.select(".x-axis").call(d3.axisBottom(xBarScale))
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", ".15em")
			.attr("transform", "rotate(-7)");

		barSvg.select(".y-axis").call(d3.axisLeft(yBarScale));
	}


	barSvg.selectAll(".bar")
		.on("mouseover", (event, d, i) => {
			tooltip.transition()
				   .duration(200)
				   .style("opacity", .9);
			tooltip.html(`Factor: ${factors[i]}<br/>Average: ${d.toFixed(2)}`)
				   .style("left", (event.pageX + 10) + "px")
				   .style("top", (event.pageY - 28) + "px");
		})
		.on("mouseout", () => {
			tooltip.transition()
				   .duration(500)
				   .style("opacity", 0);
		});



});
