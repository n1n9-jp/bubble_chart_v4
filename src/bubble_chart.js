


function bubbleChart() {

      var width = 940;
      var height = 600;

      var tooltip = floatingTooltip('gates_tooltip', 240);

      // 初期状態用のcenters
      var centersDefault = { x: width / 2, y: height / 2 };

  var yearCenters = {
    2008: { x: width / 3, y: height / 2 },
    2009: { x: width / 2, y: height / 2 },
    2010: { x: 2 * width / 3, y: height / 2 }
  };

      var yearsTitleX = {
        2008: 160,
        2009: width / 2,
        2010: width - 160
      };

      // @v4 strength to apply to the position forces
      var forceStrength = 0.03;

      // これらはcreate_nodesとcreate_visで設定されます
      var svg = null;
      var bubbles = null;
      var nodes = [];


    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))

      function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
      }


  
      var simulation = d3.forceSimulation()
        .velocityDecay(0.2) // ノード（バブル）の移動速度の減衰率を設定
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

      simulation.stop();

      var fillColor = d3.scaleOrdinal()
        .domain(['low', 'medium', 'high'])
        .range(['#d84b2a', '#beccae', '#7aa25c']);



      function createNodes(rawData) {

          var maxAmount = d3.max(rawData, function (d) { return +d.total_amount; });

          var radiusScale = d3.scalePow()
            .exponent(0.5)
            .range([2, 85])
            .domain([0, maxAmount]);

          var myNodes = rawData.map(function (d) {
            return {
              id: d.id,
              radius: radiusScale(+d.total_amount),
              value: +d.total_amount,
              name: d.grant_title,
              org: d.organization,
              group: d.group,
              year: d.start_year,
              x: Math.random() * 900,
              y: Math.random() * 800
            };
          });

          // sort them to prevent occlusion of smaller nodes.
          myNodes.sort(function (a, b) { return b.value - a.value; });

          return myNodes;
      }



      var chart = function chart(selector, rawData) {

            nodes = createNodes(rawData);

            svg = d3.select(selector)
              .append('svg')
              .attr('width', width)
              .attr('height', height);

            bubbles = svg.selectAll('.bubble')
              .data(nodes, function (d) { return d.id; });

            var bubblesE = bubbles.enter().append('circle')
              .classed('bubble', true)
              .attr('r', 0)
              .attr('fill', function (d) { return fillColor(d.group); })
              .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
              .attr('stroke-width', 2)
              .on('mouseover', showDetail)
              .on('mouseout', hideDetail);

            bubbles = bubbles.merge(bubblesE);

            bubbles.transition()
              .duration(2000)
              .attr('r', function (d) { return d.radius; });

            simulation.nodes(nodes);

            groupBubbles();
      };



      function ticked() {
        bubbles
          .attr('cx', function (d) { return d.x; })
          .attr('cy', function (d) { return d.y; });
      }



      function nodeYearPos(d) {
        return centersSplit[d.year].x;
      }



      function groupBubbles() {
        hideYearTitles();

        // @v4 Reset the 'x' force to draw the bubbles to the center.
        simulation.force('x', d3.forceX().strength(forceStrength).x(centersGroup.x));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
      }

  function nodeYearPos(d) {
    return yearCenters[d.year].x;
  }


      function splitBubbles() {
        showYearTitles();

    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));
        // @v4 Reset the 'x' force to draw the bubbles to their year centers

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
      }


      function hideYearTitles() {
        svg.selectAll('.year').remove();
      }


      function showYearTitles() {
        // Another way to do this would be to create
        // the year texts once and then just hide them.
        var yearsData = d3.keys(yearsTitleX);
        var years = svg.selectAll('.year')
          .data(yearsData);

        years.enter().append('text')
          .attr('class', 'year')
          .attr('x', function (d) { return yearsTitleX[d]; })
          .attr('y', 40)
          .attr('text-anchor', 'middle')
          .text(function (d) { return d; });
      }



      function showDetail(d) {

        d3.select(this).attr('stroke', 'black');

        var content = '<span class="name">Title: </span><span class="value">' +
                      d.name +
                      '</span><br/>' +
                      '<span class="name">Amount: </span><span class="value">$' +
                      addCommas(d.value) +
                      '</span><br/>' +
                      '<span class="name">Year: </span><span class="value">' +
                      d.year +
                      '</span>';

        tooltip.showTooltip(content, d3.event);
      }




      function hideDetail(d) {
        // reset outline
        d3.select(this)
          .attr('stroke', d3.rgb(fillColor(d.group)).darker());

        tooltip.hideTooltip();
      }




      chart.toggleDisplay = function (displayName) {
        if (displayName === 'year') {
          splitBubbles();
        } else {
          groupBubbles();
        }
      };

      return chart;
}




var myBubbleChart = bubbleChart();



function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}



function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      
      // Find the button just clicked & set it as the active button
      var button = d3.select(this);
      button.classed('active', true);

      // buttonIdによって、表示内容のフラグとする
      var buttonId = button.attr('id');
      myBubbleChart.toggleDisplay(buttonId);
      
    });
}



function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}



// Load the data.
d3.csv('data/gates_money.csv', display);

// setup the buttons.
setupButtons();
