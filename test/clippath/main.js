// Set the canvas dimensions
const margin = { top: 30, right: 20, bottom: 70, left: 50 };
const width = 950 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;
// Set the x and y values
const x = d3.scalePoint()
    .domain(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
    .range([0, width]);

const y = d3.scaleLinear()
.domain([745000, 800000])
.range([height, 0]);

const xAxis = d3.axisBottom(x)
.tickSize(-height);
const yAxis = d3.axisLeft(y)
.tickSize(-width);

const svg = d3.select("#chart-area")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("font", "Arial")
      .style("font-size","14px");
      
const chart = svg
  .append('g')
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .attr('id', 'chart')
  .attr("width", width)
  .attr("height", height);

chart
  .append('defs')
  .append('clipPath')
  .attr('id', 'clip')
  .append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', width)
  .attr('height', height)
  .attr('fill', 'red');

chart.append("g")
  .attr("class", "x-axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis)
  .selectAll('line') 
  .style("stroke-dasharray", ("3, 3"));

chart.append("g")
  .attr("class", "y-axis")
  .call(yAxis)
  .selectAll('line') 
  .style("stroke-dasharray", ("3, 3"));

chart.append("line")
  .attr("class", "line")
  .attr('x1', width)
  .attr('y1', 0)
  .attr('x2', 0)
  .attr('y2', height)
  .attr('stroke', 'green')
  .attr('stroke-width', 2);


const toggleClip = (value) => {
  chart.select('.x-axis')
  .selectAll('line')
  .attr('clip-path', value ? 'url(#clip)' : '');

  chart.select('.y-axis')
  .selectAll('line')
  .attr('clip-path', value ? 'url(#clip)' : '');

}
