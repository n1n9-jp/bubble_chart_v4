var BubbleChartObject = function () {

    var self = this;
    this.e = new Eventer;

    // データ・コンテナー
    var dataAll;
    var dataMod = [];

    // 初期値：ビューポート
    var width = 940;
    var height = 600;

    // 初期値：ツールチップ
    var tooltip = floatingTooltip('gates_tooltip', 240);

    // 初期値：座標値
    var centersDefault = { x: width / 2, y: height / 2 };
    var centersGroup = { x: width / 2, y: height / 2 };
    var centersSplit = {
        2007: { x: (width/5) * 1, y: height / 2 },
        2008: { x: (width/5) * 2, y: height / 2 },
        2009: { x: (width/5) * 3, y: height / 2 },
        2010: { x: (width/5) * 4, y: height / 2 }
    };

    // SVGコンテナー
    var svgContainer = null;
    var bubbles = null;

    // flag
    var buttonId = "";

    // パラメーター：シミュレーション
    var forceStrength = 0.03;

    // シミュレーションの設定
    var simulation = d3.forceSimulation()
        .velocityDecay(0.2)
        .force('x', d3.forceX().strength(forceStrength).x(centersDefault.x))
        .force('y', d3.forceY().strength(forceStrength).y(centersDefault.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

    simulation.stop();

    // スケール：色
    var fillColor = d3.scaleOrdinal()
        .domain(['low', 'medium', 'high'])
        .range(['#d84b2a', '#beccae', '#7aa25c']);


  
    // 初期化
    this.init = function () {
        console.log("init...");

        this.e.subscribe('create:nodes', this.createNodes);
        this.e.subscribe('create:chart', this.createChart);
        this.e.subscribe('toggle:display', this.toggleDisplay);
        this.e.subscribe('load:data', this.loadData);
        this.e.subscribe('setup:buttons', this.setupButtons);

        this.e.publish('setup:buttons');
        this.e.publish('load:data');
    };



    // ノードの作成
    this.createNodes = function() {
        console.log("createNodes...");

        var radiusScale = d3.scalePow()
            .exponent(0.5)
            .range([2, 85])
            .domain([0, d3.max(dataAll, function(d) { 
                return parseFloat(d.total_amount) || 0; 
            })]);
        
        dataMod = dataAll.map(function (d) {
            return {
                id: d.id,
                radius: radiusScale(+d.total_amount),
                value: +d.total_amount,
                name: d.grant_title,
                group: d.group,
                year: d.start_year,
                x: Math.random() * 900,
                y: Math.random() * 800
            };
        });
        console.log("dataMod", dataMod);

        // グローバルnodesを使用してチャートを作成
        self.e.publish('create:chart', dataMod);
    };



    // チャートの作成
    this.createChart = function(data) {
        console.log("createChart...");

        d3.select('#vis svg').remove();
        
        svgContainer = d3.select('#vis')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr("id", "svgArea")
            .attr("viewBox", "0 0 "+ width + " " + height)
            .attr("preserveAspectRatio", "xMidYMid");

        // dataModを直接使用
        bubbles = svgContainer.selectAll('.bubble')
            .data(dataMod, function (d) { return d.id; });

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

        simulation.nodes(dataMod);
        groupBubbles();
    };



    // 表示の切り替え
    this.toggleDisplay = function() {
        console.log("toggleDisplay");

        if (buttonId === 'year') {
            splitBubbles();
        } else {
            groupBubbles();
        }
    };



    // データの読み込み
    this.loadData = function() {
        console.log("loadData");

        d3.csv('./data/data.csv')
            .then(function(data) {

                data.forEach(function(d) {
                    d.total_amount = parseInt(d.total_amount);
                });

                dataAll = data;
                console.log("data loaded.", data);

                self.e.publish('create:nodes', data);
            })
            .catch(function(error) {
                console.error("Error loading CSV:", error);
            });
    };



    this.setupButtons = function() {
        console.log("setupButtons");

        d3.select('#toolbar')
            .selectAll('.button')
            .on('click', function (event) {

                d3.selectAll('.button').classed('active', false);
                var button = d3.select(this);
                button.classed('active', true);
                buttonId = button.attr('id');
                console.log("buttonId", buttonId);

                self.e.publish('toggle:display');
            });
    };



    // ヘルパー関数
    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }

    function ticked() {
        bubbles
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; });
    }

    function groupBubbles() {
        hideYearTitles();
        simulation.force('x', d3.forceX().strength(forceStrength).x(centersGroup.x));
        simulation.alpha(1).restart();
    }

    function splitBubbles() {
        showYearTitles();
        simulation.force('x', d3.forceX().strength(forceStrength).x(nodeYearPos));
        simulation.alpha(1).restart();
    }

    function nodeYearPos(d) {
        return centersSplit[d.year].x;
    }

    function hideYearTitles() {
        svgContainer.selectAll('.year').remove();
    }

    function showYearTitles() {
        var yearsData = Object.keys(centersSplit);
        var years = svgContainer.selectAll('.year')
            .data(yearsData);

        years.enter().append('text')
            .attr('class', 'year')
            .attr('x', function (d) { return centersSplit[d].x; })
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(function (d) { return d; });
    }

    function showDetail(event, d) {
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
      tooltip.showTooltip(content, event);
    }

    function hideDetail(d) {
        d3.select(this).attr('stroke', d3.rgb(fillColor(d.group)).darker());
        tooltip.hideTooltip();
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

    this.init.apply(this, arguments);
}; //BubbleChartObject

new BubbleChartObject();