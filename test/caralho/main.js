
const TRANSITION = 300;
const DATA = [
  { 'year': '2005', 'value': 771900, 'value2': 751900 },
  { 'year': '2006', 'value': 771500, 'value2': 755500 },
  { 'year': '2007', 'value': 770500, 'value2': 760500 },
  { 'year': '2008', 'value': 770400, 'value2': 765400 },
  { 'year': '2009', 'value': 771000, 'value2': 766000 },
  { 'year': '2010', 'value': 772400, 'value2': 772400 },
  { 'year': '2011', 'value': 774100, 'value2': 765900 },
  { 'year': '2012', 'value': 776700, 'value2': 776700 },
  { 'year': '2013', 'value': 777100, 'value2': 787100 },
  { 'year': '2014', 'value': 779200, 'value2': 779200 },
  { 'year': '2015', 'value': 782300, 'value2': 766000 },
]
const SERIES = [
  {
    id: 1,
    xKey: 'year',
    yKey: 'value',
    stroke: 'green',
  },
  {
    id: 2,
    xKey: 'year',
    yKey: 'value2',
    stroke: 'red',
  },
];

let currentSeries = [...SERIES];

const toggleSeries = (id, checked) => {
  if (checked) {
    currentSeries.push(SERIES[id - 1])
  } else {
    currentSeries = currentSeries.filter((cs) => cs.id !== id)
  }
  update()
}

const groupDataWithSeries = () => (
  currentSeries.reduce((d, s) => ([
    ...d,
    {
      data: DATA.map((d) => ({
        [s.xKey]: d[s.xKey],
        [s.yKey]: d[s.yKey],
      })),
      attrs: s,
    },
  ]), [])
)

const getDomain = () => {
  const keys = currentSeries.map((s) => s.yKey);
  const values = DATA.flatMap(d => keys.map(k => d[k]));
  return [Math.min(...values), Math.max(...values)]
}

// Set the canvas dimensions
const margin = { top: 30, right: 20, bottom: 70, left: 50 };
const width = 950 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;
// Set the x and y values
let x = d3.scalePoint()
    .domain(DATA.map((d) => d.year))
    .range([0, width]);

let y = d3.scaleLinear()
.domain(getDomain())
.range([height, 0]);

let xAxis = d3.axisBottom(x)
.tickSize(-height)
let yAxis = d3.axisLeft(y)
.tickSize(-width)

let lineGenerator = (d) => (
  d3.line()
  .x((xd) => x(xd[d.attrs.xKey]))
  .y((yd) => y(yd[d.attrs.yKey]))
  .curve(d3.curveCatmullRom.alpha(0.5))(d.data)
)


const svg = d3.select("#chart-area")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("font", "Arial")
  .style("font-size","14px")
        

const chart = svg
  .append('g')
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .attr('id', 'chart')
  .attr("width", width)
  .attr("height", height)

chart
  .append('defs')
  .append('clipPath')
  .attr('id', 'clip')
  .append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', width)
  .attr('height', height);


chart.append("g")
  .attr("class", "x-axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

chart.append("g")
  .attr("class", "y-axis")
  .call(yAxis);

chart.selectAll('.tick')
  .attr('stroke-dasharray', '3 3')


const updateScales = () => {
  x = d3.scalePoint()
    .domain(DATA.map((d) => d.year))
    .range([0, width]);

  y = d3.scaleLinear()
    .domain(getDomain())
    .range([height, 0]);

  xAxis = d3.axisBottom(x)
    .tickSize(-height)
  yAxis = d3.axisLeft(y)
    .tickSize(-width)

  lineGenerator = (d) => (
    d3.line()
    .x((xd) => x(xd[d.attrs.xKey]))
    .y((yd) => y(yd[d.attrs.yKey]))
    .curve(d3.curveCatmullRom.alpha(0.5))(d.data)
  )

  chart
    .select('.x-axis')
    .transition()
    .duration(TRANSITION)
    .call(xAxis);
  
  chart
    .select('.y-axis')
    .transition()
    .duration(TRANSITION)
    .call(yAxis);

  chart.selectAll('.tick')
    .attr('stroke-dasharray', '3 3')

  chart
    .selectAll('.line')
    .transition()
    .duration(TRANSITION)
    .attr('d', (d) => lineGenerator(d));

  chart
    .selectAll('.dot')
    .attr('r', 6)
    .transition()
    .duration(TRANSITION)
    .attr('cx', (xd) => x(xd[xd.__attrs__.xKey]))
    .attr('cy', (yd) => y(yd[yd.__attrs__.yKey]))
}

const update = () => {
  const groupedData = groupDataWithSeries();
  let parentGroup = chart
    .selectAll('.parentGroup')
    .data(groupedData, (d) => d.attrs.id);

  const dotsExit = parentGroup.exit()
    .select('.dots-group')
    .selectAll('circle')
    .transition()
    .duration(TRANSITION)
    .attr('cx', (xd) => x(xd[xd.__attrs__.xKey]))
    .attr('cy', () => y(y.domain()[0]))
    .attr('r', 0);

  const pathsExit = parentGroup
    .exit()
    .select('.line-group')
    .selectAll('path')
    .transition()
    .duration(TRANSITION)
    .attr('stroke-width', 0)
    .attr('d', (d) => (
      d3.line()
        .x((xd) => x(xd[d.attrs.xKey]))
        .y((yd) => y(y.domain()[0]))
        .curve(d3.curveCatmullRom.alpha(0.5))(d.data)
    ));

  if (pathsExit.size()) {
    pathsExit
      .end()
      .then(() => updateScales());
  }

  pathsExit.remove();
  dotsExit.remove();
  parentGroup
    .exit()
    .transition()
    .duration(TRANSITION)
    .remove();

  const parentEnter = parentGroup
    .enter()
    .append('g')
    .attr('class', 'parentGroup')
    .attr('clip-path', `url(#clip)`);

  parentEnter.append('g')
    .attr('class', 'line-group');

  parentEnter.append('g')
    .attr('class', 'dots-group');

  parentGroup = parentEnter.merge(parentGroup);

  const linesGroup = parentGroup
    .select('.line-group');
  
  const dotsGroup = parentGroup
    .select('.dots-group')
    .attr('fill', (d, i) => d.attrs.stroke);

  const dots = dotsGroup.selectAll('circle')
    .data((dt) => {
      return dt.data.map((d) => ({ ...d, __attrs__: dt.attrs }))
    });

  const lines = linesGroup.selectAll('path')
    .data((d) => [d], (d, i) => d.attrs.id);


  lines
    .enter()
    .append('path')
    .attr('fill', 'none')
    .attr('class', 'line')
    .attr('stroke-width', 0)
    .attr('stroke', (d) => d.attrs.stroke)
    .attr('d', (d) => (
      d3.line()
        .x((xd) => x(xd[d.attrs.xKey]))
        .y((yd) => y(y.domain()[0]))
        .curve(d3.curveCatmullRom.alpha(0.5))(d.data)
    ))
    .transition()
    .duration(TRANSITION)
    .attr('stroke-width', 2)
    .attr('d', (d) => lineGenerator(d));


  dots.enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', (xd) => x(xd[xd.__attrs__.xKey]))
    .attr('cy', () => y(y.domain()[0]))
    .attr('r', 0)
    .transition()
    .duration(TRANSITION)
    .attr('r', 6)
    .attr('cx', (xd) => x(xd[xd.__attrs__.xKey]))
    .attr('cy', (yd) => y(yd[yd.__attrs__.yKey]))
    .on('end', () => updateScales());
}

update()