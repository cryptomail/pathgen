/**
 * Created by joshuateitelbaum on 3/8/14.
 */
"use strict";
Raphael.fn.line = function(startX, startY, endX, endY){
    return this.path('M' + startX + ' ' + startY + ' L' + endX + ' ' + endY);
};

var pathgen = {
    paper:null,
    pointlist: [],
    segmentlist: [],
    simulationmode:false,
    default_circle_radius:10,
    default_circle_fillcolor: "red",
    pointCounter:0,
    /*
    Initializes pathgen object.
     */

    initialize: function(htmlid)
    {


        if(!htmlid)
        {
            return;
        }
        var element = document.getElementById(htmlid);
        if(!element)
        {
            return;
        }
        pathgen.paper = new Raphael(htmlid,"100%","100%");

        element.onclick = pathgen.onClickpaper;
    },
    /*
    addPoint
    Adds a point at x,y
     */
    addPoint: function(x,y)
    {
        var circle = pathgen.paper.circle(x,y,pathgen.default_circle_radius);
        circle.pointId = pathgen.pointCounter;
        circle.parentPathGen = pathgen;
        circle.pointCounter++;
        circle.attr("fill",pathgen.default_circle_fillcolor);
        circle.click(pathgen.pointClicked);
        pathgen.paper.set(circle).drag(pathgen.pointDragMove,pathgen.pointDragStart,pathgen.pointDragEnd);
        pathgen.pointlist.push(circle);
        if(pathgen.pointlist.length > 1)
        {
            var a = pathgen.pointlist[pathgen.pointlist.length -2];
            var b = pathgen.pointlist[pathgen.pointlist.length -1];
            var line = pathgen.paper.line(a.attr('cx'),a.attr('cy'),b.attr('cx'),b.attr('cy'));
            line.parentPathGen = pathgen;
            pathgen.segmentlist.push(line);
        }
    },

    /*
    click handler for our canvas.  We'll put points here.
     */
    onClickpaper: function(e)
    {
        if(!self.simulationmode)
        {
            if(!e.defaultPrevented)
            {
                pathgen.addPoint(e.offsetX, e.offsetY);
            }
            console.log("x: " + e.offsetX + " y: " + e.offsetY);

        }
        else
        {
            console.log("x: " + e.offsetX + " y: " + e.offsetY);
        }
    },
    pointClicked: function(e)
    {
        console.log("point x: " + e.offsetX + " point y: " + e.offsetY);
        e.preventDefault();
    },
    pointDragStart: function()
    {
        this.ox = this.attr("cx");
        this.oy = this.attr("cy");
    },
    pointDragMove: function(dx,dy)
    {
        this.attr({cx: this.ox + dx, cy: this.oy + dy});
        var idx = this.parentPathGen.pointlist.indexOf(this);
        var avant = idx - 1;
        var apres = idx + 1;


        if(avant < 0)
        {

            if(apres < this.parentPathGen.pointlist.length)
            {
                avant = 0;
                var a = this.parentPathGen.pointlist[avant];
                var b = this.parentPathGen.pointlist[apres];
                /*
                The target segment is between 0'th and 1st point, so the first segment.
                 */
                var line = this.parentPathGen.segmentlist[0];
                line.remove();
                line.parentPathGen = null;
                pathgen.segmentlist.splice(0,1);
                var line = pathgen.paper.line(a.attr('cx'),a.attr('cy'),b.attr('cx'),b.attr('cy'));
                line.parentPathGen = pathgen;
                pathgen.segmentlist.splice(avant,0,line);
            }
            else
            {
                /*
                Nothing to do, Tex! Nous sommes en seuls!
                 */
            }
        }
        else  /* There are points before us */
        {
            if(apres < this.parentPathGen.pointlist.length)
            {

                var a = this.parentPathGen.pointlist[avant];

                var b = this.parentPathGen.pointlist[apres];
                /*
                Two segments!
                 */
                var line = this.parentPathGen.segmentlist[avant];
                line.remove();
                line.parentPathGen = null;
                pathgen.segmentlist.splice(avant,1);
                var line = pathgen.paper.line(a.attr('cx'),a.attr('cy'),this.attr('cx'),this.attr('cy'));
                line.parentPathGen = pathgen;
                pathgen.segmentlist.splice(avant,0,line);
                var line = this.parentPathGen.segmentlist[avant+1];
                line.remove();
                line.parentPathGen = null;
                pathgen.segmentlist.splice(avant+1,1);
                var line = pathgen.paper.line(this.attr('cx'),this.attr('cy'),b.attr('cx'),b.attr('cy'));
                line.parentPathGen = pathgen;
                pathgen.segmentlist.splice(avant+1,0,line);
            }
            else
            {
                /*
                 We're the last node on the chain!
                 It also means we're the last segment.
                 */
                apres = this.parentPathGen.pointlist.length-1;
                var a = this.parentPathGen.pointlist[avant];
                var b = this.parentPathGen.pointlist[apres];
                /*
                 The target segment is the same index as avant.
                 */
                var line = this.parentPathGen.segmentlist[avant];
                line.remove();
                line.parentPathGen = null;
                pathgen.segmentlist.splice(avant,1);
                var line = pathgen.paper.line(a.attr('cx'),a.attr('cy'),b.attr('cx'),b.attr('cy'));
                line.parentPathGen = pathgen;
                pathgen.segmentlist.splice(avant,0,line);
            }
        }


    },
    pointDragEnd: function()
    {

    }

};

