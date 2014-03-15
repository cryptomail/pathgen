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
    selectedPoints:[],
    simulationmode:false,
    default_circle_radius:10,
    default_sqrt_radius:Math.sqrt(10),
    default_circle_fillcolor: "red",
    default_circle_hoverincolor: "pink",
    default_circle_selectedcolor:"blue",
    pointCounter:0,
    screenwidth:ko.observable(320),
    screenheight:ko.observable(480),

    /*
     Initializes pathgen object.
     */

    setcssOfElement: function(css, target)
    {
        for(var prop in css) {
            document.getElementById(target).style[prop] = css[prop];
        }
    },

    sizePanels: function(mainwidth, mainheight)
    {
        var spacex = 10;
        var leftbar = document.getElementById("leftbar");

        mainwidth = parseInt(mainwidth);
        mainheight = parseInt(mainheight);
        var leftbarcss =
        {

            "width":100,
            "height":mainheight,
            "border-style":"solid",
            "border-width":"2px",
            "overflow":"scroll"

        };


        this.setcssOfElement(leftbarcss,"leftbar");


        var maincss =
        {
            "left":110,
            "width":mainwidth,
            "height":mainheight,
            "border-style":"solid",
            "border-width":2
        };

        var main = document.getElementById("main");
        this.setcssOfElement(maincss,"main");


        var inputarea = document.getElementById("inputarea");
        var inputcss =
        {

            "left":leftbarcss.width + mainwidth + spacex + maincss["border-width"],
            "width":320,
            "height":mainheight,
            "border-style":"solid",
            "border-width":"2"
        };

        this.setcssOfElement(inputcss,"inputarea");

        var bottomcss =
        {

            "width":leftbarcss.width + mainwidth  + maincss["border-width"],
            "height":100,
            "border-style":"solid",
            "border-width":"2"
        };

        this.setcssOfElement(bottomcss,"bottombar");

        this._initCanvas();


    },
    requestScreenWidthChange: function(newval)
    {
        this.sizePanels(newval,this.screenheight());
    },
    requestScreenHeightChange: function(newval)
    {
        this.sizePanels(this.screenwidth(),newval);
    },
    _initCanvas: function()
    {

        this.pointlist = [];
        this.segmentlist = [];

        var element = document.getElementById("main");
        if(!element)
        {
            return;
        }
        if(pathgen.paper)
        {
            pathgen.paper.clear();

        }
        else
        {
            pathgen.paper = new Raphael("main","100%","100%");
        }

        element.onclick = pathgen.onClickpaper;
    },
    initialize: function()
    {

        this.sizePanels(this.screenwidth(),this.screenheight());

        this.screenwidth.subscribe(this.requestScreenWidthChange,this);
        this.screenheight.subscribe(this.requestScreenHeightChange,this);
        ko.applyBindings(this);



    },

    _deleteSegmentsFromPoint: function(c1)
    {
        var x;
        for(x = this.segmentlist.length-1; x >= 0; x--)
        {
            if(this.segmentlist[x].c1 == c1)
            {
                this.segmentlist[x].remove();
                this.segmentlist.splice(x,1);
            }
            else if(this.segmentlist[x].c2 == c1)
            {
                this.segmentlist[x].remove();
                this.segmentlist.splice(x,1);
            }
        }
    },
    _deletePoint: function(item)
    {
        /*
        1) find all segments related to point item
        2) delete those segments
        3) delete the point
        4) rejoin before and after
         */

        var idx,avantidx, apresidx,avant,apres;

        idx = this.pointlist.indexOf(item);
        if(idx < 0)
        {
            return;
        }
        avantidx = idx - 1;
        apresidx = idx + 1;

        if(avantidx < 0)
        {
            avant = null;
        }
        else
        {
            avant = this.pointlist[avantidx];
        }

        if(apresidx < 0)
        {
            apres = null;
        }
        else
        {
            apres = this.pointlist[apresidx];
        }

        this._deleteSegmentsFromPoint(item);

        item.remove();

        this.pointlist.splice(idx,1);

        if(avant != null && apres != null)
        {
            var p1 = {
                x:avant.attr('cx'),
                y:avant.attr('cy')
            };

            var p2 = {
                x:apres.attr('cx'),
                y:apres.attr('cy')
            };

            var line = pathgen.createLine(p1,p2,avant,apres);
            line.parentPathGen = this;
            this.segmentlist.push(line);
        }

    },
    delClicked: function()
    {
        /*
         For each point selected, delete the point
         Then re-render the segments....tomorrow tired now :)
         */
        var self = this;
        var traverselist = this.selectedPoints.slice(0);

        traverselist.sort(
            function(a,b)
            {
                return a.pointId < b.pointId;
            }
        );
        traverselist.forEach( function(item)
        {
        self._deletePoint(item);
        });
        this.selectedPoints = [];

    },
    isSelected: function(p)
    {
        return this.selectedPoints.indexOf(p) >= 0;
    },
    /*
     pointHoverIn
     */
    pointHoverIn: function(e,x,y)
    {
        if(!this.parentPathGen.isSelected(this))
        {
            this.attr({fill:pathgen.default_circle_hoverincolor});
        }
    },
    /*
     pointHoverOut
     */
    pointHoverOut: function(e,x,y)
    {
        if(!this.parentPathGen.isSelected(this))
        {
            this.attr({fill:pathgen.default_circle_fillcolor});
        }

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
    createLine: function(p1,p2,c1,c2)
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

        line.c1 = c1;
        line.c2 = c2;
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
        pathgen.pointCounter++;
        console.log("DEBUG: point counter " + circle.pointId)
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

            var line = pathgen.createLine(p1,p2,a,b);
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
        if(e.altKey)
        {
            var n;

            if((n=this.parentPathGen.selectedPoints.indexOf(this)) >= 0)
            {
                this.parentPathGen.selectedPoints.splice(n,1);
                this.attr({fill:pathgen.default_circle_fillcolor});
            }
            else
            {
                this.parentPathGen.selectedPoints.push(this);
                this.attr({fill:pathgen.default_circle_selectedcolor});
            }

        }
        else
        {
            var select = true;
            if(this.parentPathGen.selectedPoints.length == 1 && this.parentPathGen.selectedPoints[0] == this)
            {
                select = false;
            }
            this.parentPathGen.selectedPoints.forEach( function(item)
            {
                item.attr({fill:pathgen.default_circle_fillcolor});
            });
            this.parentPathGen.selectedPoints = [];
            if(select)
            {
                this.parentPathGen.selectedPoints.push(this);
                this.attr({fill:pathgen.default_circle_selectedcolor});
            }
        }
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
                line =  pathgen.createLine(p1,p2,a,b);
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

                line =  pathgen.createLine(p1,p2,a,this);
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

                line =  pathgen.createLine(pp1,pp2,this,b);
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

                line =  pathgen.createLine(p1,p2,a,b);
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
