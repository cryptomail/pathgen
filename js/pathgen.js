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
    default_sqrt_radius:Math.sqrt(10),
    default_circle_fillcolor: "red",
    default_circle_hoverincolor: "pink",
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
     pointHoverIn
     */
    pointHoverIn: function(e,x,y)
    {
        this.attr({fill:pathgen.default_circle_hoverincolor});
    },
    /*
     pointHoverOut
     */
    pointHoverOut: function(e,x,y)
    {
        this.attr({fill:pathgen.default_circle_fillcolor});
    },


    /*
    line angle
     */
    lineAngle: function(p1,p2)
    {
        var xDiff = p2.x - p1.x;
        var yDiff = p2.y - p1.y;
        return -Math.atan2(yDiff, xDiff);

    },
    createLine: function(p1,p2)
    {
        var lineangle = pathgen.lineAngle(p1,p2);


        var dx = Math.cos(lineangle) * pathgen.default_circle_radius;
        var dy = Math.sin(lineangle) * pathgen.default_circle_radius;
        var line = null;
        if(dx >= 0 && dy >= 0)
        {
            line = pathgen.paper.line(p1.x+dx,p1.y-dy,p2.x-dx,p2.y+dy);

        }
        else if(dx <=0 && dy <= 0)
        {
            line = pathgen.paper.line(p1.x+dx,p1.y-dy,p2.x-dx,p2.y+dy);
        }
        else if(dx >=0 && dy <= 0)
        {
            line = pathgen.paper.line(p1.x+dx,p1.y-dy,p2.x-dx,p2.y+dy);
        }
        else if(dx <= 0 && dy >= 0)
        {
            line = pathgen.paper.line(p1.x+dx,p1.y-dy,p2.x-dx,p2.y+dy);
        }
        return line;
    },
    /*
    addPoint
    Adds a point at x,y
     */
    addPoint: function(x,y)
    {
        var circle = pathgen.paper.circle(x,y,pathgen.default_circle_radius);
        circle.hover(pathgen.pointHoverIn,pathgen.pointHoverOut,circle,circle);
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

            var p1 = {
                x:a.attr('cx'),
                y:a.attr('cy')
                };

            var p2 = {
                x:b.attr('cx'),
            y:b.attr('cy')
            };

            var line = pathgen.createLine(p1,p2);
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
        }
        else
        {

        }
    },
    pointClicked: function(e)
    {

        e.preventDefault();
    },
    pointDragStart: function(x,y,e)
    {
        this.ox = this.attr("cx");
        this.oy = this.attr("cy");
        e.preventDefault();
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

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                /*
                The target segment is between 0'th and 1st point, so the first segment.
                 */
                var line = this.parentPathGen.segmentlist[0];
                line.remove();
                line.parentPathGen = null;
                pathgen.segmentlist.splice(0,1);
                line =  pathgen.createLine(p1,p2);
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

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:this.attr('cx'),
                    y:this.attr('cy')
                };

                var line =  pathgen.createLine(p1,p2);
                line.parentPathGen = pathgen;
                pathgen.segmentlist.splice(avant,0,line);
                line = this.parentPathGen.segmentlist[avant+1];
                line.remove();
                line.parentPathGen = null;
                pathgen.segmentlist.splice(avant+1,1);

                var pp1 = {
                    x:this.attr('cx'),
                    y:this.attr('cy')
                };

                var pp2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                var line =  pathgen.createLine(pp1,pp2);
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

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                var line =  pathgen.createLine(p1,p2);
                line.parentPathGen = pathgen;
                pathgen.segmentlist.splice(avant,0,line);
            }
        }


    },
    pointDragEnd: function(e)
    {
        e.preventDefault();

    }

};

