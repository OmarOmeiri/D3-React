
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
  currentSeries.sort((c1, c2) => c1.id - c2.id)
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

// Set the canvas dimensions
const margin = { top: 30, right: 20, bottom: 70, left: 50 };
const width = 950 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;
// Set the x and y values
const x = d3.scalePoint()
    .domain(DATA.map((d) => d.year))
    .range([0, width]);

const y = d3.scaleLinear()
.domain([745000, 800000])
.range([height, 0]);

const xAxis = d3.axisBottom(x)
const yAxis = d3.axisLeft(y)

const lineGenerator = (x, y) => d3.line()
    .x(function(d) { return x(d.attr.yKey); })
    .y(function(d) { return y(d.attr.ykey); });

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


chart.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

chart.append("g")
  .attr("class", "y axis")
  .call(yAxis);


const update = () => {
  const groupedData = groupDataWithSeries();
  let parentGroup = chart
    .selectAll('.parentGroup')
    .data(groupedData, (d) => d.attrs.id);

  parentGroup.exit()
    .select('.dots-group')
    .selectAll('circle')
    .transition()
    .attr('cx', (xd) => x(xd[xd.__attrs__.xKey]))
    .attr('cy', () => y(y.domain()[0]))
    .attr('r', 0)
    .duration(TRANSITION);

  parentGroup.exit()
    .select('.line-group')
    .selectAll('path')
    .transition()
    .attr('stroke-width', 0)
    .attr('d', (d) => (
      d3.line()
        .x((xd) => x(xd[d.attrs.xKey]))
        .y((yd) => y(y.domain()[0]))
        .curve(d3.curveCatmullRom.alpha(this.alpha))(d.data)
    ))
    .duration(TRANSITION);

  parentGroup.exit()
    .transition()
    .duration(TRANSITION)
    .remove();

  const parentEnter = parentGroup
    .enter()
    .append('g')
    .attr('class', 'parentGroup');

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
    .exit()
    .transition()
    .attr('stroke-width', 0)
    .attr('d', (d) => (
      d3.line()
        .x((xd) => x(xd[d.attrs.xKey]))
        .y((yd) => y(y.domain()[0]))
        .curve(d3.curveCatmullRom.alpha(this.alpha))(d.data)
    ))
    .duration(TRANSITION)
    .remove();

  dots
    .exit()
    .transition()
    .attr('cx', (xd) => x(xd[xd.__attrs__.xKey]))
    .attr('cy', () => y(y.domain()[0]))
    .duration(TRANSITION)
    .remove();

  lines
    .enter()
    .append('path')
    .attr('fill', 'none')
    .attr('stroke-width', 0)
    .attr('stroke', (d) => d.attrs.stroke)
    .attr('d', (d) => (
      d3.line()
        .x((xd) => x(xd[d.attrs.xKey]))
        .y((yd) => y(y.domain()[0]))
        .curve(d3.curveCatmullRom.alpha(this.alpha))(d.data)
    ))
    .transition()
    .duration(TRANSITION)
    .attr('stroke-width', 2)
    .attr('d', (d) => (
      d3.line()
        .x((xd) => x(xd[d.attrs.xKey]))
        .y((yd) => y(yd[d.attrs.yKey]))
        .curve(d3.curveCatmullRom.alpha(this.alpha))(d.data)
    ))


  dots.enter()
    .append('circle')
    .attr('cx', (xd) => x(xd[xd.__attrs__.xKey]))
    .attr('cy', () => y(y.domain()[0]))
    .attr('r', 0)
    .transition()
    .duration(TRANSITION)
    .attr('r', 6)
    .attr('cx', (xd) => x(xd[xd.__attrs__.xKey]))
    .attr('cy', (yd) => y(yd[yd.__attrs__.yKey]));
}

update()