var singleTimeSeriesModule = (function(d3Object){

    var parsedData = [];

    function extractXandYaxis(dataToUse) {
        var dataObj = {
            x: [],
            y: [],
            sessionName: '',
        };

        var data = dataToUse.timeline;
        dataObj.sessionName = dataToUse.video_name;
        data.forEach(function(timeLineObj){
            if (dataObj.x.indexOf(timeLineObj.name) < 0) {
                dataObj.x.push(timeLineObj.name);
            }
            if (dataObj.y.indexOf(timeLineObj.progress_report) < 0) {
                dataObj.y.push(timeLineObj.progress_report);
            }
        });
        return dataObj;
    }

    function _generateTimeSeriesGraph(dataToUse, svgEl) {
        // function to plot a single time-series graph
        //console.log('single time series module ', dataToUse);
        // pick the first sample for example
        var sampleData = dataToUse;

        document.addEventListener('DOMContentLoaded', function(event){
            initiate(sampleData, svgEl);
        });
    }

    function initiate(dataToUse, svgEl) {
        parsedData = parseData(dataToUse);
        drawChart(parsedData, svgEl);
    }

    function parseData(dataToParse) {
        dataToParse.forEach(function(dataObj){
            parsedData.push({
                sessionName: dataObj.video_name, 
                timeline: (function(timelineArray){
                    var timelineParsed = [];
                    timelineArray.forEach(function(timelineObj){
                        // timelineParsed.push({name: timelineObj.name, value: timelineObj.progress_report})
                        timelineParsed.push({name: timelineObj.held_on, value: timelineObj.progress_report})

                    });
                    return timelineParsed;
                })(dataObj.timeline), 
                id: dataObj.id
            });
        });
        /* let data = dataToParse.timeline;
        data.forEach(function(obj){
        parsedData.push({name: obj.name, value: obj.progress_report});
        }); */
        console.log(parsedData);
        return parsedData;
    }

    function getDynamicLines(dataToUse, x, y) {
        var dynamiclinesarray = [];

        dataToUse.forEach(function (dataObj) {
            dynamiclinesarray.push({
                name: dataObj.sessionName,
                lineCb: d3Object.line()
                    .x(function (d) {
                        return x(d.name);
                    })
                    .y(function (d) {
                        return y(d.value)
                    })
            });
        });
        return dynamiclinesarray;
    }

    function getXandYdomain(dataToConsume) {
        // get the complete array for x axis and y axis
        let xArray = [];
        let yArray = [];
        dataToConsume.forEach(function(sessionObj){
            let timelineArray = sessionObj.timeline;
            timelineArray.forEach(function(timelineEntry){
                if(xArray.indexOf(timelineEntry.name) < 0) {
                    xArray.push(timelineEntry.name);
                }
                if (yArray.indexOf(timelineEntry.value) < 0) {
                    yArray.push(timelineEntry.value);
                }
            });
        });
        return {x: xArray, y: yArray};
    }

    function drawChart(dataToUse, svgEl) {
        console.log('draw chart ', dataToUse);
        var colorScale = d3Object.scaleOrdinal(d3Object.schemeCategory20).range(['red','blue','black','orange']);

        let svgwidth = svgEl.node().getBoundingClientRect().width;
        let svgheight = svgEl.node().getBoundingClientRect().height;

        var margin = { top: 20, right: 20, bottom: 30, left: 50 };
        var width = svgwidth - margin.left - margin.right;
        var height = svgheight - margin.top - margin.bottom;

        var globalChartGroup = svgEl.append('g').attr('id', 'globalChartGroup').attr('width', '90%').attr("transform","translate(" + margin.left + "," + margin.top + ")");   
        var x = d3Object.scalePoint().rangeRound([0,width-10]);
        var y = d3Object.scaleLinear().rangeRound([height,0]);
        
        var D3dynamicLinesArray = getDynamicLines(dataToUse, x, y);
        console.log('dynamic lines array now is ', D3dynamicLinesArray);

        // get max x and y domain
        var domainData = getXandYdomain(dataToUse);
        console.log('domain data is ', domainData);
        x.domain(domainData.x);
        console.log('sorted domain  y', domainData.y.sort()[domainData.y.length - 1]);
        y.domain([0,d3Object.max(domainData.y)]);
        // x.domain(dataToUse.map(function(d){return d.name}));
        // y.domain(d3Object.extent(dataToUse, function(d){return d.value}));

        // append the axis
        globalChartGroup.append("g")
                        .attr('id', 'XaxisGroup')
                        .attr("transform", "translate(0," + height + ")")
                        .attr('class', 'xaxisGroup')
                        .call(d3Object.axisBottom(x))
                        .append("text")
                        .attr("fill", "#000")
                        .attr('y',-10)
                        .attr("x", (globalChartGroup.node().getBoundingClientRect().width - 120))
                        .attr("dx", "0em")
                        .attr("text-anchor", "start")
                        .text("Week Numbers");

        globalChartGroup.append("g")
                        .attr('id', 'YaxisGroup').call(d3Object.axisLeft(y)).append("text").attr("fill", "#000").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "0.71em").attr("text-anchor", "end").text("Performance index");
        
        // add a globalToolbar
        var globalPathToopTip = d3Object.select('body').append('div').attr('id','globalPathTooltip').style('position','absolute').style('top','100px').style('left','100px').style('opacity',0);

        globalPathToopTip.attr('class', 'tooltip');
        // append the path
        generatePaths(globalChartGroup, dataToUse, D3dynamicLinesArray, colorScale);
    }

    function generatePaths(d3Element, dataToConsume, linesCBArray, colorScale) {
        let colorCodes = ['red', 'steelblue', 'grey', 'orange', 'green', 'pink'];
        // render lines for each data segment
        dataToConsume.forEach(function(dataSegment,index){
            d3Element
                    .append("path").attr('id',`linePath_${dataSegment.sessionName}`)
                    .datum(dataSegment.timeline).attr("fill", "none")
                    .attr("stroke", function(){return colorScale(index)})
                    .attr("stroke-linejoin", "round").attr("stroke-linecap", "round")
                    .attr("stroke-width", 1.5).attr("d", assignLine(linesCBArray, dataSegment.sessionName))
                    .on('mouseover', function(d){
                        mouseOverHandler(d, d3Object.event);
                    })
                    .on('mouseout', function(d){
                        mouseOutHandler(d);
                    });
        });        
    }

    function getRandomColor(availableColorCodesArray) {
        let randomColor = availableColorCodesArray[Math.floor(Math.random() * (availableColorCodesArray.length - 1) + 1)];
        console.log('assigning ', randomColor);
        return randomColor;
    }

    function assignLine(lineArray, currentLineName) {
        let selectedLineCB;
        lineArray.forEach(function(lineObject){
            if (lineObject.name === currentLineName) {
                selectedLineCB = lineObject.lineCb;
            }
        });
        return selectedLineCB;
    }

    function mouseOverHandler(selectedNode, triggeredEvent) {
        d3Object.select('[id="globalPathTooltip"]')
                .style('opacity', 0.8)
                .style('cursor', 'pointer')
                .style('box-shadow','13px 11px 24px -15px rgba(0,0,0,0.75)')
                .style('top',triggeredEvent.clientY + 'px')
                .style('left', triggeredEvent.clientX + 'px')
                .html(
                    `<div class="tooltipContainer">
                        <div class="tooltipText">
                            <h6 class="text">${triggeredEvent.target.id.split('_')[1]}</h6>
                        </div>
                     </div>`
                );
        // add the video name inside the tooltip

    }

    function mouseOutHandler(selectedNode, triggeredEvent) {
        d3Object.select('[id="globalPathTooltip"]')
                .style('left', '0px')
                .style('top','50px')
                .style('opacity', 0);
        
    }
    return {
        generateTimeSeriesGraph: _generateTimeSeriesGraph
    }
})(d3)